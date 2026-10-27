"""HTTP local real de PHP con cURL externo deshabilitado y proveedor simulado.

VITAMET_TEST_PHP puede apuntar a un PHP CLI alternativo (o un launcher con sus
extensiones). Nunca se copian .env, helpers.php ni credenciales del workspace.
"""
import hashlib
import http.client
import io
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
import zipfile


REPO = Path(__file__).resolve().parents[2]
PHP = os.environ.get('VITAMET_TEST_PHP', 'php')
PDF = b'%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
DOCX_PARTS = [
    ('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    ('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    ('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Mi CV</w:t></w:r></w:p></w:body></w:document>'),
]
CONFIG = """<?php return [
 'AIRTABLE_API_KEY' => 'test-only-key',
 'AIRTABLE_POST_FORM_MAIL' => 'test-only-base', 'AIRTABLE_POST_TABLE_MAIL' => 'newsletter',
 'AIRTABLE_POST_FORM_CON' => 'test-only-base', 'AIRTABLE_POST_TABLE_CON' => 'consulta',
 'AIRTABLE_POST_FORM_CV' => 'test-only-base', 'AIRTABLE_POST_TABLE_CV' => 'Lead',
];"""


def make_zip(parts):
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, text in parts:
            archive.writestr(name, text)
    return out.getvalue()


def multipart(fields, file=('cv.pdf', PDF), extra_files=()):
    boundary = 'vitamet-php-test-boundary'
    chunks = []
    for name, value in fields.items():
        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    files = ([('cv', *file)] if file else []) + list(extra_files)
    for field, name, content in files:
        chunks.extend([f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{name}"\r\nContent-Type: text/plain\r\n\r\n'.encode(), content, b'\r\n'])
    chunks.append(f'--{boundary}--\r\n'.encode())
    return b''.join(chunks), f'multipart/form-data; boundary={boundary}'


class PhpEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='vitamet-php-tests-')
        cls.root = Path(cls.temp.name)
        cls.public = cls.root / 'VITAMET'
        cls.backend = cls.public / 'backend'
        (cls.backend / 'utils').mkdir(parents=True)
        for filename in ['submit-email.php', 'submit-con.php', 'submit-cv.php', 'utils/submitCommon.php', 'utils/airtablePost.php']:
            shutil.copyfile(REPO / 'backend' / filename, cls.backend / filename)
        cls.config = cls.root / 'env-vitamet.php'
        cls.config.write_text(CONFIG)
        cls.calls_file = cls.root / 'mock-calls.jsonl'
        cls.log_path = cls.root / 'php.log'
        cls.log = cls.log_path.open('w+')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        env = os.environ.copy()
        env['VITAMET_TEST_CURL_LOG'] = str(cls.calls_file)
        cls.process = subprocess.Popen([
            PHP, '-d', 'disable_functions=curl_exec', '-d', 'display_errors=0',
            '-d', 'log_errors=1', '-d', 'upload_max_filesize=5M', '-d', 'post_max_size=6M',
            '-d', 'memory_limit=128M', '-d', 'max_file_uploads=10',
            '-d', 'auto_prepend_file=' + str(REPO / 'backend/tests/php/mock-airtable.php'),
            '-S', f'127.0.0.1:{cls.port}', '-t', str(cls.public),
        ], env=env, stdout=cls.log, stderr=cls.log)
        for _ in range(100):
            if cls.process.poll() is not None:
                raise RuntimeError('PHP test server could not start: ' + cls.log_path.read_text())
            try:
                with socket.create_connection(('127.0.0.1', cls.port), timeout=0.2):
                    return
            except OSError:
                time.sleep(0.02)
        raise RuntimeError('PHP test server did not become available')

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        cls.process.wait(timeout=5)
        cls.log.close()
        cls.temp.cleanup()

    def setUp(self):
        if self.config.is_symlink():
            self.config.unlink()
        self.config.write_text(CONFIG)
        self.calls_file.write_text('')

    def calls(self):
        return [json.loads(line) for line in self.calls_file.read_text().splitlines()]

    def request(self, endpoint, body=None, method='POST', content_type='application/json', scenario='success', headers=None):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        request_headers = {'Content-Type': content_type, 'X-Test-Scenario': scenario, **(headers or {})}
        conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        try:
            conn.request(method, f'/backend/submit-{endpoint}.php', body, request_headers)
            response = conn.getresponse()
            text = response.read().decode()
            return response.status, json.loads(text) if text else None, dict(response.getheaders())
        finally:
            conn.close()

    def cv_request(self, fields=None, file=('cv.pdf', PDF), **options):
        raw, media = multipart(fields if fields is not None else self.cv_fields(), file, options.pop('extra_files', ()))
        return self.request('cv', raw, content_type=media, **options)

    @staticmethod
    def email_fields():
        return {'email': '  Person+Tag@Example.COM  ', 'formSource': 'newsletter_blog'}

    @staticmethod
    def con_fields():
        return {'name': '  María   Pérez  ', 'email': 'Person@Example.COM', 'subject': 'asesoria',
                'message': '  Mi consulta\r\ncon detalles.  ', 'formSource': 'consulta_contacto'}

    @staticmethod
    def cv_fields():
        return {'name': 'María Pérez', 'phone': '+52 (81) 1234-5678', 'location': 'monterrey', 'formSource': 'cv_contacto'}

    def check(self, result, status, success):
        self.assertEqual(result[0], status, result[:2])
        self.assertIs(result[1]['success'], success)
        self.assertIsInstance(result[1]['message'], str)
        self.assertTrue(result[2]['Content-Type'].startswith('application/json'))
        self.assertNotIn('Access-Control-Allow-Origin', result[2])
        self.assertNotIn('private-provider-marker', json.dumps(result[1]))
        for value in ['test-only-key', 'test-only-base', 'Authorization', 'rec00000000000000', 'att00000000000000']:
            self.assertNotIn(value, json.dumps(result[1]))

    def test_email_mapping_and_sources(self):
        for source in ['newsletter_blog', 'asesoria_contacto']:
            with self.subTest(source=source):
                result = self.request('email', {**self.email_fields(), 'formSource': source})
                self.check(result, 200, True)
                self.assertEqual(self.calls()[-1]['data'], {'fields': {'email': 'person+tag@example.com', 'source': source, 'source_utm': 'organico'}})
                self.assertTrue(self.calls()[-1]['url'].endswith('/newsletter'))

    def test_contact_mapping_subjects_and_normalization(self):
        for subject in ['asesoria', 'servicios', 'otro']:
            with self.subTest(subject=subject):
                self.check(self.request('con', {**self.con_fields(), 'subject': subject}), 200, True)
                self.assertEqual(self.calls()[-1]['data'], {'fields': {'name': 'María Pérez', 'email': 'person@example.com', 'subject': subject,
                                  'text': 'Mi consulta\ncon detalles.', 'source': 'consulta_contacto', 'source_utm': 'organico'}})
                self.assertTrue(self.calls()[-1]['url'].endswith('/consulta'))

    def test_utm_same_classification_for_all_three(self):
        cases = [({}, 'organico'), ({'utm_campaign': '  Verano  '}, 'Verano'), ({'utm_source': 'blog'}, 'sin_campana'),
                 ({'utm_future_2027': 'x'}, 'sin_campana'), ({'utm_campaign': ' ', 'utm_source': ''}, 'organico'),
                 ({'utm_campaign': '0'}, '0'), ({'utm_source': '0'}, 'sin_campana'), ({'utm_source': '\ufeff'}, 'organico'),
                 ({'utm_' + 'x' * 60: 'x' * 256}, 'sin_campana'),
                 ({f'utm_{i}': 'x' * 256 for i in range(20)}, 'sin_campana')]
        for endpoint in ['email', 'con', 'cv']:
            for utm, classification in cases:
                with self.subTest(endpoint=endpoint, utm=utm):
                    self.calls_file.write_text('')
                    if endpoint == 'cv':
                        result = self.cv_request({**self.cv_fields(), 'utm': json.dumps(utm)})
                    else:
                        fields = self.email_fields() if endpoint == 'email' else self.con_fields()
                        result = self.request(endpoint, {**fields, 'utm': utm})
                    self.check(result, 200, True)
                    self.assertEqual(self.calls()[0]['data']['fields']['source_utm'], classification)

    def test_invalid_utm_does_not_write(self):
        for endpoint in ['email', 'con', 'cv']:
            for utm in [None, [], 'string', 1, {'source': 'x'}, {'utm_': 'x'}, {'utm_campaign': None},
                        {'utm_campaign': []}, {'utm_campaign': 'x' * 257}, {'utm_source': 'bad\nvalue'},
                        {'utm_' + 'x' * 61: 'x'}, {f'utm_{i}': 'x' for i in range(21)}, {'__proto__': {}}]:
                with self.subTest(endpoint=endpoint, utm=utm):
                    if endpoint == 'cv':
                        result = self.cv_request({**self.cv_fields(), 'utm': json.dumps(utm)})
                    else:
                        fields = self.email_fields() if endpoint == 'email' else self.con_fields()
                        result = self.request(endpoint, {**fields, 'utm': utm})
                    self.check(result, 400, False)
        self.assertEqual(self.calls(), [])

    def test_json_structure_fields_and_types(self):
        invalid = [None, [], 1, 'x', {}, b'{', b'', b'{"private-provider-marker":']
        for endpoint in ['email', 'con']:
            fields = self.email_fields() if endpoint == 'email' else self.con_fields()
            cases = invalid + [{**fields, key: value} for key, value in [
                ('email', None), ('email', []), ('email', 'a..b@example.com'), ('email', 'a@b'), ('email', 'a@@example.com'),
                ('email', 'a\n@example.com'), ('email', 'a' * 65 + '@example.com'), ('email', 'x' * 255),
                ('formSource', 'arbitrary'), ('formSource', []), ('website', None), ('website', 'x' * 513), ('unknown', 'x')]]
            cases += [{key: value for key, value in fields.items() if key != missing} for missing in fields]
            if endpoint == 'con':
                cases += [{**fields, key: value} for key, value in [('name', 'x'), ('name', 'x' * 121), ('name', {}),
                          ('name', 'bad\nname'), ('subject', 'unknown'), ('subject', []), ('message', 'short'),
                          ('message', 'x' * 5001), ('message', None), ('message', 'bad\0message')]]
            for body in cases:
                with self.subTest(endpoint=endpoint, body=body):
                    self.check(self.request(endpoint, body), 400, False)
        self.assertEqual(self.calls(), [])

    def test_honeypot_has_same_success_without_config_or_file(self):
        self.config.unlink()
        for endpoint in ['email', 'con', 'cv']:
            for website in ['bot', '0']:
                result = self.cv_request({'website': website}, None) if endpoint == 'cv' else self.request(endpoint, {'website': website})
                with self.subTest(endpoint=endpoint, website=website):
                    self.check(result, 200, True)
                    if endpoint == 'cv':
                        self.assertIs(result[1]['partial'], False)
        self.assertEqual(self.calls(), [])

    def test_methods_media_types_limits_and_compression(self):
        for endpoint in ['email', 'con', 'cv']:
            for method in ['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']:
                with self.subTest(endpoint=endpoint, method=method):
                    result = self.request(endpoint, {}, method=method)
                    self.assertEqual(result[0], 204 if method == 'OPTIONS' else 405)
                    if method not in ['HEAD', 'OPTIONS']:
                        self.check(result, 405, False)
                        self.assertEqual(result[2]['Allow'], 'POST')
            for media in ['text/plain', 'application/x-www-form-urlencoded', 'application/ld+json', 'application/json' if endpoint == 'cv' else 'multipart/form-data']:
                with self.subTest(endpoint=endpoint, media=media):
                    self.check(self.request(endpoint, {}, content_type=media), 415, False)
            if endpoint != 'cv':
                fields = self.email_fields() if endpoint == 'email' else self.con_fields()
                self.check(self.request(endpoint, fields, headers={'Content-Encoding': 'gzip'}), 415, False)
                self.check(self.request(endpoint, fields, content_type='application/json; charset=iso-8859-1'), 415, False)
                self.check(self.request(endpoint, {'large': 'x' * 17000}), 413, False)
            else:
                self.check(self.cv_request(headers={'Content-Encoding': 'gzip'}), 415, False)
        self.assertEqual(self.calls(), [])

    def test_unicode_length_and_whitespace_match_javascript(self):
        for name, status in [('😀' * 60, 200), ('😀' * 61, 400), ('\ufeffAna\u00a0Pérez\ufeff', 200)]:
            with self.subTest(name=name):
                self.check(self.request('con', {**self.con_fields(), 'name': name}), status, status == 200)
        self.assertEqual(self.calls()[-1]['data']['fields']['name'], 'Ana Pérez')

    def test_cv_pdf_and_docx_two_step_mapping_and_tls(self):
        for name, content, mime in [('candidate.pdf', PDF, 'application/pdf'), ('CV.DOCX', make_zip(DOCX_PARTS), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
                                    ('cv.docx', make_zip([('word/', ''), ('_rels/', '')] + DOCX_PARTS), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')]:
            with self.subTest(name=name):
                self.calls_file.write_text('')
                result = self.cv_request(file=(name, content))
                self.check(result, 200, True)
                self.assertIs(result[1]['partial'], False)
                create, upload = self.calls()
                self.assertEqual(create['data']['fields'], {'name': 'María Pérez', 'phone': '+528112345678', 'state': 'monterrey', 'source': 'cv_contacto', 'source_utm': 'organico'})
                self.assertTrue(create['url'].endswith('/Lead'))
                self.assertEqual(upload['url'], 'https://content.airtable.com/v0/test-only-base/rec00000000000000/attachment/uploadAttachment')
                self.assertEqual(upload['data'], {'contentType': mime, 'filename': 'cv.' + name.split('.')[-1].lower(), 'file': {'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}})
                for call in [create, upload]:
                    self.assertIs(call['follow'], False)
                    self.assertIs(call['sslPeer'], True)
                    self.assertEqual(call['sslHost'], 2)
                    self.assertIn(call['protocols'], ['HTTPS', 2])
                self.assertEqual([create['timeout'], upload['timeout']], [8, 15])

    def test_cv_invalid_fields(self):
        for key, value in [('name', 'x'), ('name', 'x' * 121), ('phone', '123'), ('phone', '1' * 16),
                           ('phone', '12345678ext123'), ('location', 'other'), ('formSource', 'newsletter_blog'),
                           ('utm', '{'), ('utm', 'x' * 17000), ('unknown', 'x')]:
            with self.subTest(key=key):
                self.check(self.cv_request({**self.cv_fields(), key: value}), 413 if key == 'utm' and len(value) > 16384 else 400, False)
        for missing in self.cv_fields():
            self.check(self.cv_request({key: value for key, value in self.cv_fields().items() if key != missing}), 400, False)
        self.check(self.cv_request(file=None), 400, False)
        self.assertEqual(self.calls(), [])

    def test_cv_invalid_files_and_zip_limits(self):
        invalid = [('cv.exe', PDF), ('cv.pdf', b''), ('cv.pdf', b'not a pdf'), ('cv.pdf', PDF[:-10]),
                   ('cv.docx', PDF), ('cv.pdf', make_zip(DOCX_PARTS)), ('cv.docx', b'PK\x03\x04invalid'),
                   ('cv.docx', make_zip([('other.txt', 'not word')])), ('cv.docx', make_zip(DOCX_PARTS)[:-10]),
                   ('cv.docx', make_zip(DOCX_PARTS + [('word/vbaProject.bin', 'macro')])),
                   ('cv.docx', make_zip(DOCX_PARTS + [('../outside', 'bad')])),
                   ('cv.docx', make_zip(DOCX_PARTS + [('word/large.bin', 'x' * 20000001)])),
                   ('cv.docx', make_zip([(name, 'x' * 2000001 if name == 'word/document.xml' else value) for name, value in DOCX_PARTS])),
                   ('cv.docx', make_zip([(name, '<!DOCTYPE bad>' + value if name == 'word/document.xml' else value) for name, value in DOCX_PARTS])),
                   ('cv.docx', make_zip(DOCX_PARTS + [(f'word/{i}.txt', 'x') for i in range(254)]))]
        for name, content in invalid:
            with self.subTest(name=name, length=len(content)):
                self.check(self.cv_request(file=(name, content)), 400, False)
        self.assertEqual(self.calls(), [])

    def test_cv_maximum_inclusive_and_excess(self):
        maximum = PDF[:-6] + b' ' * (5000000 - len(PDF)) + PDF[-6:]
        self.check(self.cv_request(file=('cv.pdf', maximum)), 200, True)
        self.calls_file.write_text('')
        for size in [5000001, 5150001]:
            self.check(self.cv_request(file=('cv.pdf', b'x' * size)), 413, False)
        self.assertEqual(self.calls(), [])

    def test_cv_malformed_multipart_and_unexpected_parts(self):
        self.check(self.request('cv', b'invalid', content_type='multipart/form-data'), 400, False)
        self.check(self.cv_request(extra_files=[('other', 'cv.pdf', PDF)]), 400, False)
        raw, media = multipart(self.cv_fields())
        self.check(self.request('cv', raw[:-40], content_type=media), 400, False)
        self.check(self.cv_request({**self.cv_fields(), 'utm[utm_campaign]': 'nested'}), 400, False)
        self.assertEqual(self.calls(), [])

    def test_record_errors_timeouts_and_no_retries_or_leaks(self):
        for endpoint in ['email', 'con', 'cv']:
            for scenario, expected in [('record_error', 502), ('record_timeout', 504), ('record_network', 502), ('record_redirect', 502), ('oversized_response', 502)]:
                with self.subTest(endpoint=endpoint, scenario=scenario):
                    self.calls_file.write_text('')
                    result = self.cv_request(scenario=scenario) if endpoint == 'cv' else self.request(endpoint, self.email_fields() if endpoint == 'email' else self.con_fields(), scenario=scenario)
                    self.check(result, expected, False)
                    self.assertEqual(len(self.calls()), 1)
        self.log.flush()
        logs = self.log_path.read_text()
        for value in ['private-provider-marker', 'test-only-key', 'test-only-base', 'Authorization']:
            self.assertNotIn(value, logs)

    def test_cv_partial_success_never_recreates_or_deletes(self):
        for scenario in ['record_missing_id', 'record_invalid_json', 'attachment_error', 'attachment_timeout', 'attachment_internal_error', 'attachment_empty', 'attachment_wrong_record', 'attachment_wrong_size', 'attachment_invalid_json']:
            with self.subTest(scenario=scenario):
                self.calls_file.write_text('')
                result = self.cv_request(scenario=scenario)
                self.check(result, 200, True)
                self.assertIs(result[1]['partial'], True)
                self.assertEqual(result[1]['code'], 'CV_ATTACHMENT_FAILED')
                self.assertEqual(len(self.calls()), 1 if scenario.startswith('record_') else 2)

    def test_php_has_no_ten_minute_deduplication_cache(self):
        for _ in range(2):
            self.check(self.request('con', self.con_fields()), 200, True)
        self.assertEqual(len(self.calls()), 2)

    def test_config_missing_invalid_incomplete_and_public_symlink_fail_closed(self):
        for kind in ['missing', 'invalid', 'incomplete', 'public']:
            with self.subTest(kind=kind):
                if self.config.exists() or self.config.is_symlink():
                    self.config.unlink()
                if kind == 'invalid':
                    self.config.write_text('<?php syntax error')
                elif kind == 'incomplete':
                    self.config.write_text("<?php return ['AIRTABLE_API_KEY' => 'test-only-key'];")
                elif kind == 'public':
                    target = self.public / 'public-config.php'
                    target.write_text(CONFIG)
                    self.config.symlink_to(target)
                self.check(self.request('email', self.email_fields()), 503, False)
        self.assertEqual(self.calls(), [])

    def test_config_output_is_never_exposed(self):
        self.config.write_text(CONFIG.replace('<?php return', "<?php echo 'private-provider-marker'; return"))
        self.check(self.request('email', self.email_fields()), 200, True)


if __name__ == '__main__':
    unittest.main(verbosity=2)

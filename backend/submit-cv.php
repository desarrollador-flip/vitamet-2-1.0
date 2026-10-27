<?php
declare(strict_types=1);

namespace Vitamet\Submit;

require_once __DIR__ . '/utils/airtablePost.php';

function validate_multipart(): \stdClass
{
    $postLimit = ini_bytes((string) ini_get('post_max_size'));
    require_input($postLimit <= 0 || (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) <= $postLimit,
        'La solicitud supera el límite permitido.', 413);
    require_input(count($_POST) <= 6 && count($_FILES) <= 1 && !array_diff(array_keys($_FILES), ['cv']),
        'El archivo o los campos multipart no cumplen los límites permitidos.');
    foreach ($_POST as $key => $value) {
        require_input(strlen((string) $key) <= 64, 'El nombre del campo no es válido.');
        require_input(!is_string($value) || strlen($value) <= JSON_LIMIT, 'Un campo supera el límite permitido.', 413);
    }
    if (isset($_FILES['cv'])) {
        $file = $_FILES['cv'];
        require_input(isset($file['error']) && is_int($file['error']), 'El archivo CV no es válido.');
        require_input(!in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            && (int) ($file['size'] ?? 0) <= CV_LIMIT, 'El CV supera el límite de 5.000.000 bytes.', 413);
        if (in_array($file['error'], [UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION], true)) {
            safe_log('cv', 'upload', 'temporary_file_unavailable');
            throw new HttpError(503, 'El servicio no está disponible temporalmente.');
        }
        require_input(in_array($file['error'], [UPLOAD_ERR_OK, UPLOAD_ERR_NO_FILE], true), 'No se pudo recibir el CV completo.');
    }
    return (object) $_POST;
}

function validate_docx(string $path): void
{
    $invalid = 'El CV debe ser un archivo PDF o DOCX válido.';
    $zip = new \ZipArchive();
    require_input(@$zip->open($path, \ZipArchive::RDONLY | \ZipArchive::CHECKCONS) === true, $invalid);
    $parts = [];
    $names = [];
    $total = 0;
    try {
        require_input($zip->numFiles <= 256, $invalid);
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $entry = $zip->statIndex($index);
            require_input(is_array($entry), $invalid);
            $name = $entry['name'];
            require_input(!isset($names[$name]) && !str_contains($name, "\0") && !str_contains($name, '\\')
                && !preg_match('~^(?:/|[a-zA-Z]:)|(?:^|/)\.\.(?:/|$)~', $name)
                && !preg_match('/vbaProject\.bin$/i', $name), $invalid);
            $names[$name] = true;
            $total += $entry['size'];
            require_input($entry['size'] >= 0 && $total <= 20000000 && ($entry['encryption_method'] ?? 0) === 0
                && in_array($entry['comp_method'], [0, 8], true), $invalid);
            $keep = in_array($name, ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'], true);
            require_input(!$keep || $entry['size'] <= 2000000, $invalid);
            $stream = @$zip->getStreamIndex($index);
            require_input(is_resource($stream), $invalid);
            $content = '';
            $size = 0;
            $crc = hash_init('crc32b');
            try {
                while (!feof($stream)) {
                    $chunk = fread($stream, 65536);
                    require_input(is_string($chunk) && ($chunk !== '' || feof($stream)), $invalid);
                    $size += strlen($chunk);
                    require_input($size <= $entry['size'], $invalid);
                    hash_update($crc, $chunk);
                    if ($keep) {
                        $content .= $chunk;
                    }
                }
            } finally {
                fclose($stream);
            }
            require_input($size === $entry['size'] && hash_final($crc) === sprintf('%08x', $entry['crc']), $invalid);
            if ($keep) {
                require_input(!preg_match('/<!DOCTYPE|<!ENTITY/i', $content), $invalid);
                $parts[$name] = $content;
            }
        }
    } catch (\Throwable $error) {
        throw new HttpError(400, $invalid);
    } finally {
        $zip->close();
    }
    $types = $parts['[Content_Types].xml'] ?? '';
    $relations = $parts['_rels/.rels'] ?? '';
    $document = $parts['word/document.xml'] ?? '';
    require_input(preg_match('~<Override\b[^>]*\bPartName=["\']/word/document\.xml["\'][^>]*>~i', $types) === 1
        && str_contains($types, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'), $invalid);
    require_input(preg_match('~<Relationship\b[^>]*\bTarget=["\']/?word/document\.xml["\'][^>]*>~i', $relations) === 1
        && preg_match('~/officeDocument["\']~', $relations) === 1, $invalid);
    require_input(preg_match('~<(?:[\w.-]+:)?document\b~', $document) === 1
        && preg_match('~<(?:[\w.-]+:)?body(?:\s|>)~', $document) === 1
        && preg_match('~(?:schemas\.openxmlformats\.org/wordprocessingml/2006/main|purl\.oclc\.org/ooxml/wordprocessingml/main)~', $document) === 1, $invalid);
}

function validate_cv_file(): array
{
    $invalid = 'El CV debe ser un archivo PDF o DOCX válido.';
    require_input(isset($_FILES['cv']) && $_FILES['cv']['error'] === UPLOAD_ERR_OK, 'Adjunta un CV en PDF o DOCX.');
    $file = $_FILES['cv'];
    require_input(is_string($file['tmp_name'] ?? null) && is_uploaded_file($file['tmp_name'])
        && is_string($file['name'] ?? null), $invalid);
    $size = filesize($file['tmp_name']);
    require_input(is_int($size) && $size > 0, 'Adjunta un CV en PDF o DOCX.');
    require_input($size <= CV_LIMIT, 'El CV supera el límite de 5.000.000 bytes.', 413);
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    require_input(in_array($extension, ['pdf', 'docx'], true), $invalid);
    require_input(class_exists('finfo') && ($extension !== 'docx' || (class_exists('ZipArchive')
        && method_exists('ZipArchive', 'getStreamIndex'))), 'El servicio no está disponible temporalmente.', 503);
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $bytes = file_get_contents($file['tmp_name']);
    require_input(is_string($bytes) && strlen($bytes) === $size, $invalid);
    if ($extension === 'pdf') {
        require_input($mime === 'application/pdf' && preg_match('/^%PDF-(?:1\.[0-7]|2\.0)(?:\r|\n)/', substr($bytes, 0, 16)) === 1
            && preg_match('/%%EOF\s*$/D', substr($bytes, -1024)) === 1, $invalid);
    } else {
        require_input(in_array($mime, ['application/zip', 'application/x-zip', 'application/x-zip-compressed',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], true)
            && substr($bytes, 0, 4) === "PK\x03\x04", $invalid);
        validate_docx($file['tmp_name']);
    }
    return ['bytes' => $bytes, 'filename' => 'cv.' . $extension,
        'contentType' => $extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
}

run('cv', static function (): array {
    require_post('multipart/form-data', MULTIPART_LIMIT);
    require_input(preg_match('/;\s*boundary=(?:"[^"\r\n]+"|[^;\s\r\n]+)/i', $_SERVER['CONTENT_TYPE'] ?? '') === 1,
        'El cuerpo de la solicitud no es válido.');
    $body = validate_multipart();
    if (envelope($body, ['name', 'phone', 'location', 'formSource', 'utm', 'website'])) {
        return accepted(true);
    }
    $source = require_source($body, ['cv_contacto']);
    $sourceUtm = classify_utm($body, true);
    $name = normalize_name($body->name ?? null);
    $phoneError = 'Ingresa un teléfono válido de 8 a 15 dígitos.';
    require_input(isset($body->phone) && is_string($body->phone) && js_length($body->phone) <= 40, $phoneError);
    require_input(preg_match('/^\+?[0-9 ().-]+$/D', js_trim($body->phone)) === 1, $phoneError);
    $phone = str_replace([' ', '(', ')', '.', '-'], '', js_trim($body->phone));
    require_input(preg_match('/^\+?\d{8,15}$/D', $phone) === 1, $phoneError);
    require_input(isset($body->location) && in_array($body->location, ['monterrey', 'nacional'], true), 'La ubicación no es válida.');
    $file = validate_cv_file();
    $config = load_config(__DIR__ . '/../../env-vitamet.php', __DIR__ . '/..', 'CV');
    try {
        $record = create_record($config, ['name' => $name, 'phone' => $phone, 'state' => $body->location,
            'source' => $source, 'source_utm' => $sourceUtm]);
    } catch (AirtableError $error) {
        return record_error('cv', $error);
    }
    $partial = [200, ['success' => true, 'partial' => true, 'code' => 'CV_ATTACHMENT_FAILED',
        'message' => 'Tus datos se guardaron, pero no pudimos confirmar el CV. No repitas la postulación.']];
    $recordId = $record->id ?? null;
    if (!is_string($recordId) || preg_match('/^rec[a-zA-Z0-9]{14}$/D', $recordId) !== 1) {
        safe_log('cv', 'record_response', 'unconfirmed');
        return $partial;
    }
    try {
        $url = 'https://content.airtable.com/v0/' . rawurlencode($config['baseId']) . '/' . rawurlencode($recordId)
            . '/attachment/uploadAttachment';
        $uploaded = airtable_post($url, ['contentType' => $file['contentType'], 'file' => base64_encode($file['bytes']),
            'filename' => $file['filename']], $config, 15);
        if (($uploaded->id ?? null) === $recordId && ($uploaded->fields ?? null) instanceof \stdClass) {
            foreach (get_object_vars($uploaded->fields) as $value) {
                foreach (is_array($value) ? $value : [] as $attachment) {
                    if (is_string($attachment->id ?? null) && preg_match('/^att[a-zA-Z0-9]{14}$/D', $attachment->id) === 1
                        && ($attachment->filename ?? null) === $file['filename'] && ($attachment->size ?? null) === strlen($file['bytes'])) {
                        return accepted(true);
                    }
                }
            }
        }
        safe_log('cv', 'attachment_response', 'unconfirmed');
    } catch (AirtableError $error) {
        provider_log('cv', 'upload_attachment', $error);
    } catch (\Throwable $error) {
        // También ante un fallo interno del adjunto, el candidato ya existe.
        safe_log('cv', 'upload_attachment', 'internal_error');
    }
    return $partial;
});

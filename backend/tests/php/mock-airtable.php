<?php
declare(strict_types=1);

// Solo para el servidor local de pruebas con auto_prepend_file. No desplegar.
namespace Vitamet\Submit;

final class MockAirtable
{
    public static array $options = [];
    public static int $status = 0;
    public static int $errno = 0;
}

function curl_setopt_array($handle, array $options): bool
{
    MockAirtable::$options = $options;
    // TLS, timeouts y redirecciones se verifican desde el registro de pruebas.
    return true;
}

function curl_exec($handle)
{
    if (is_callable('curl_exec')) {
        throw new \RuntimeException('The native external transport must be disabled in tests.');
    }
    $url = \curl_getinfo($handle, CURLINFO_EFFECTIVE_URL);
    if (!str_starts_with($url, 'https://api.airtable.com/') && !str_starts_with($url, 'https://content.airtable.com/')) {
        throw new \RuntimeException('Unexpected mock URL.');
    }
    $options = MockAirtable::$options;
    $data = json_decode($options[CURLOPT_POSTFIELDS], true, 512, JSON_THROW_ON_ERROR);
    $upload = str_starts_with($url, 'https://content.airtable.com/');
    $scenario = $_SERVER['HTTP_X_TEST_SCENARIO'] ?? 'success';
    $summary = [
        'url' => $url, 'data' => $data,
        'timeout' => $options[CURLOPT_TIMEOUT], 'follow' => $options[CURLOPT_FOLLOWLOCATION],
        'sslPeer' => $options[CURLOPT_SSL_VERIFYPEER], 'sslHost' => $options[CURLOPT_SSL_VERIFYHOST],
        'protocols' => $options[defined('CURLOPT_PROTOCOLS_STR') ? constant('CURLOPT_PROTOCOLS_STR') : CURLOPT_PROTOCOLS],
    ];
    if ($upload) {
        $summary['data']['file'] = ['bytes' => strlen(base64_decode($data['file'], true)),
            'sha256' => hash('sha256', base64_decode($data['file'], true))];
    }
    file_put_contents(getenv('VITAMET_TEST_CURL_LOG'), json_encode($summary) . "\n", FILE_APPEND | LOCK_EX);
    MockAirtable::$status = 200;
    MockAirtable::$errno = 0;
    $response = ['id' => 'rec00000000000000'];
    if ($upload) {
        $response['fields'] = ['fldAttachment' => [[
            'id' => 'att00000000000000', 'filename' => $data['filename'],
            'size' => strlen(base64_decode($data['file'], true)),
        ]]];
    }
    if ((!$upload && $scenario === 'record_timeout') || ($upload && $scenario === 'attachment_timeout')) {
        MockAirtable::$status = 0;
        MockAirtable::$errno = CURLE_OPERATION_TIMEDOUT;
        return false;
    }
    if ($upload && $scenario === 'attachment_internal_error') {
        throw new \RuntimeException('private-provider-marker');
    }
    if (!$upload && $scenario === 'record_network') {
        MockAirtable::$status = 0;
        MockAirtable::$errno = CURLE_COULDNT_RESOLVE_HOST;
        return false;
    }
    if ((!$upload && $scenario === 'record_error') || ($upload && $scenario === 'attachment_error')) {
        MockAirtable::$status = 422;
        $response = ['error' => ['type' => 'private-provider-marker', 'message' => 'private-provider-marker']];
    }
    if (!$upload && $scenario === 'record_redirect') {
        MockAirtable::$status = 302;
    }
    if (!$upload && $scenario === 'record_missing_id') {
        $response = [];
    }
    if ($upload && $scenario === 'attachment_empty') {
        $response['fields'] = new \stdClass();
    }
    if ($upload && $scenario === 'attachment_wrong_record') {
        $response['id'] = 'wrong';
    }
    if ($upload && $scenario === 'attachment_wrong_size') {
        $response['fields']['fldAttachment'][0]['size']++;
    }
    $raw = json_encode($response);
    if ((!$upload && $scenario === 'record_invalid_json') || ($upload && $scenario === 'attachment_invalid_json')) {
        $raw = 'private-provider-marker';
    }
    if ($scenario === 'oversized_response') {
        $raw = str_repeat('private-provider-marker', 60000);
    }
    $written = $options[CURLOPT_WRITEFUNCTION]($handle, $raw);
    if ($written !== strlen($raw)) {
        MockAirtable::$errno = CURLE_WRITE_ERROR;
        return false;
    }
    return true;
}

function curl_getinfo($handle, int $option)
{
    if ($option !== CURLINFO_RESPONSE_CODE) {
        throw new \RuntimeException('Unexpected mock getinfo.');
    }
    return MockAirtable::$status;
}

function curl_errno($handle): int
{
    return MockAirtable::$errno;
}

<?php
declare(strict_types=1);

namespace Vitamet\Submit;

require_once __DIR__ . '/submitCommon.php';

final class AirtableError extends \RuntimeException
{
    public bool $timedOut;
    public ?int $upstreamStatus;

    public function __construct(bool $timedOut, ?int $status = null)
    {
        parent::__construct('Falló la operación de Airtable.');
        $this->timedOut = $timedOut;
        $this->upstreamStatus = $status;
    }
}

function load_config(string $filename, string $publicDirectory, string $suffix): array
{
    $unavailable = 'El servicio no está disponible temporalmente.';
    require_input(extension_loaded('curl') && function_exists('curl_init')
        && (is_callable(__NAMESPACE__ . '\\curl_exec') || is_callable('curl_exec')), $unavailable, 503);
    // En PHP-FPM/servidores persistentes puede haber cambiado un enlace simbólico.
    clearstatcache(true);
    $file = @realpath($filename);
    $roots = [@realpath($publicDirectory), @realpath($_SERVER['DOCUMENT_ROOT'] ?? $publicDirectory)];
    $private = $file !== false;
    foreach ($roots as $root) {
        if ($root !== false && ($file === $root || str_starts_with((string) $file, $root . DIRECTORY_SEPARATOR))) {
            $private = false;
        }
    }
    if (!$private || !is_file($file) || !is_readable($file)) {
        safe_log(strtolower($suffix), 'config', 'unavailable');
        throw new HttpError(503, $unavailable);
    }
    // Aislar la inclusión y descartar cualquier salida accidental del archivo privado.
    ob_start();
    try {
        $config = (static function (string $path) { return require $path; })($file);
    } catch (\Throwable $error) {
        safe_log(strtolower($suffix), 'config', 'invalid');
        throw new HttpError(503, $unavailable);
    } finally {
        ob_end_clean();
    }
    $names = ['AIRTABLE_API_KEY', 'AIRTABLE_POST_FORM_' . $suffix, 'AIRTABLE_POST_TABLE_' . $suffix];
    require_input(is_array($config), $unavailable, 503);
    foreach ($names as $name) {
        if (!isset($config[$name]) || !is_string($config[$name]) || trim($config[$name]) === ''
            || preg_match('/[\x00-\x1f\x7f]/', $config[$name])) {
            safe_log(strtolower($suffix), 'config', 'incomplete');
            throw new HttpError(503, $unavailable);
        }
    }
    return ['apiKey' => trim($config[$names[0]]), 'baseId' => trim($config[$names[1]]), 'table' => trim($config[$names[2]])];
}

function airtable_post(string $url, array $data, array $config, int $timeout = 8, int $responseLimit = 1048576)
{
    $response = '';
    $curl = curl_init($url);
    try {
        $protocolOption = defined('CURLOPT_PROTOCOLS_STR') ? constant('CURLOPT_PROTOCOLS_STR') : CURLOPT_PROTOCOLS;
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $config['apiKey'], 'Content-Type: application/json'],
            CURLOPT_CONNECTTIMEOUT => min(3, $timeout),
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_MAXREDIRS => 0,
            $protocolOption => defined('CURLOPT_PROTOCOLS_STR') ? 'HTTPS' : CURLPROTO_HTTPS,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$response, $responseLimit): int {
                if (strlen($response) + strlen($chunk) > $responseLimit) {
                    return 0;
                }
                $response .= $chunk;
                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($curl);
        if ($ok === false || $status < 200 || $status >= 300) {
            throw new AirtableError($errno === CURLE_OPERATION_TIMEDOUT, $status ?: null);
        }
        // Un 2xx ilegible ya puede haber creado el registro: CV lo tratará como parcial.
        return json_decode($response);
    } finally {
        // En PHP 8 el handle es un objeto; liberar la referencia cierra el recurso.
        unset($curl);
    }
}

function create_record(array $config, array $fields, int $responseLimit = 1048576)
{
    $url = 'https://api.airtable.com/v0/' . rawurlencode($config['baseId']) . '/' . rawurlencode($config['table']);
    return airtable_post($url, ['fields' => $fields], $config, 8, $responseLimit);
}

function provider_log(string $scope, string $stage, AirtableError $error): void
{
    safe_log($scope, $stage, $error->timedOut ? 'timeout' : 'upstream_error', $error->upstreamStatus);
}

function record_error(string $scope, AirtableError $error): array
{
    provider_log($scope, 'create_record', $error);
    return [$error->timedOut ? 504 : 502, ['success' => false,
        'message' => 'No se pudo confirmar el registro. No repitas el envío automáticamente.']];
}

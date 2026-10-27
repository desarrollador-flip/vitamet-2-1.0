<?php
declare(strict_types=1);

namespace Vitamet\Submit;

const JSON_LIMIT = 16384;
const CV_LIMIT = 5000000;
const MULTIPART_LIMIT = 5150000;
const JS_SPACE = '[\x{0009}-\x{000D}\x{0020}\x{00A0}\x{1680}\x{2000}-\x{200A}\x{2028}\x{2029}\x{202F}\x{205F}\x{3000}\x{FEFF}]';

final class HttpError extends \RuntimeException
{
    public int $status;

    public function __construct(int $status, string $message)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function require_input(bool $condition, string $message, int $status = 400): void
{
    if (!$condition) {
        throw new HttpError($status, $message);
    }
}

function safe_log(string $scope, string $stage, string $type, ?int $status = null): void
{
    // Solo categorías del código y HTTP numérico. Nunca mensajes, headers o URLs.
    error_log('[vitamet-submit-' . $scope . '] ' . $stage . ' ' . $type
        . ($status !== null && $status >= 100 && $status <= 599 ? ' status=' . $status : ''));
}

function accepted(bool $cv = false): array
{
    $body = ['success' => true, 'message' => 'Solicitud recibida correctamente.'];
    if ($cv) {
        $body['partial'] = false;
    }
    return [200, $body];
}

function run(string $scope, callable $handler): void
{
    ini_set('display_errors', '0');
    set_error_handler(static function (int $severity): bool {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        throw new \ErrorException('Error interno.', 0, $severity);
    });
    try {
        require_input(PHP_VERSION_ID >= 80200 && function_exists('mb_convert_encoding')
            && function_exists('mb_check_encoding'), 'El servicio no está disponible temporalmente.', 503);
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            $result = [204, null];
        } else {
            $result = $handler();
        }
    } catch (HttpError $error) {
        $result = [$error->status, ['success' => false, 'message' => $error->getMessage()]];
    } catch (\Throwable $error) {
        safe_log($scope, 'request', 'internal_error');
        $result = [500, ['success' => false, 'message' => 'No se pudo procesar la solicitud.']];
    } finally {
        restore_error_handler();
    }
    http_response_code($result[0]);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    // Mismo dominio: no emitir cabeceras Access-Control-Allow-Origin.
    if ($result[1] !== null && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') {
        echo json_encode($result[1], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}

function require_post(string $mediaType, int $limit): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        throw new HttpError(405, 'Método no permitido.');
    }
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '', 2)[0]));
    require_input($type === $mediaType, 'Se requiere Content-Type ' . $mediaType . '.', 415);
    $encoding = strtolower($_SERVER['HTTP_CONTENT_ENCODING'] ?? 'identity');
    require_input($encoding === 'identity', 'No se admiten cuerpos comprimidos.', 415);
    require_input((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) <= $limit, 'La solicitud supera el límite permitido.', 413);
    if (preg_match('/;\s*charset\s*=\s*"?([^;"\s]+)/i', $_SERVER['CONTENT_TYPE'] ?? '', $match)) {
        require_input(in_array(strtolower($match[1]), ['utf-8', 'utf8'], true), 'El formato de la solicitud no es compatible.', 415);
    }
}

function read_json(): \stdClass
{
    $stream = fopen('php://input', 'rb');
    try {
        $raw = stream_get_contents($stream, JSON_LIMIT + 1);
    } finally {
        fclose($stream);
    }
    require_input(is_string($raw) && strlen($raw) <= JSON_LIMIT, 'La solicitud supera el límite de 16 KiB.', 413);
    try {
        $body = json_decode($raw, false, 512, JSON_THROW_ON_ERROR);
    } catch (\JsonException $error) {
        throw new HttpError(400, 'El cuerpo JSON no es válido.');
    }
    require_input($body instanceof \stdClass, 'El cuerpo del formulario no es válido.');
    return $body;
}

function js_trim(string $value): string
{
    return preg_replace('~^' . JS_SPACE . '+|' . JS_SPACE . '+$~u', '', $value);
}

function js_length(string $value): int
{
    // JavaScript cuenta unidades UTF-16: un emoji cuenta como dos caracteres.
    require_input(mb_check_encoding($value, 'UTF-8'), 'El texto no contiene UTF-8 válido.');
    return intdiv(strlen(mb_convert_encoding($value, 'UTF-16LE', 'UTF-8')), 2);
}

function envelope(\stdClass $body, array $allowed): bool
{
    require_input(!array_diff(array_keys(get_object_vars($body)), $allowed), 'El cuerpo del formulario no es válido.');
    if (property_exists($body, 'website')) {
        require_input(is_string($body->website) && js_length($body->website) <= 512, 'El campo website no es válido.');
        return js_trim($body->website) !== '';
    }
    return false;
}

function require_source(\stdClass $body, array $allowed): string
{
    require_input(isset($body->formSource) && is_string($body->formSource)
        && in_array($body->formSource, $allowed, true), 'El origen del formulario no es válido.');
    return $body->formSource;
}

function classify_utm(\stdClass $body, bool $multipart = false): string
{
    if (!property_exists($body, 'utm')) {
        return 'organico';
    }
    $utm = $body->utm;
    if ($multipart) {
        require_input(is_string($utm) && strlen($utm) <= JSON_LIMIT, 'El campo utm debe contener un objeto JSON serializado.');
        try {
            $utm = json_decode($utm, false, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $error) {
            throw new HttpError(400, 'El campo utm debe contener un objeto JSON serializado.');
        }
    }
    require_input($utm instanceof \stdClass, 'Los parámetros UTM deben ser un objeto.');
    $entries = get_object_vars($utm);
    require_input(count($entries) <= 20, 'Los parámetros UTM no son válidos.');
    $hasValue = false;
    foreach ($entries as $key => $value) {
        require_input(strlen((string) $key) <= 64 && preg_match('/^utm_[a-z0-9_]+$/D', (string) $key) === 1
            && is_string($value) && js_length($value) <= 256 && !preg_match('/[\x00-\x1f\x7f]/', $value), 'Los parámetros UTM no son válidos.');
        $hasValue = $hasValue || js_trim($value) !== '';
    }
    if (isset($utm->utm_campaign) && js_trim($utm->utm_campaign) !== '') {
        return js_trim($utm->utm_campaign);
    }
    return $hasValue ? 'sin_campana' : 'organico';
}

function normalize_email($value): string
{
    $message = 'Ingresa un correo electrónico válido de hasta 254 caracteres.';
    require_input(is_string($value) && js_length($value) <= 254 && !preg_match('/[\x00-\x1f\x7f]/', $value), $message);
    $email = strtolower(js_trim($value));
    $parts = explode('@', $email);
    require_input(count($parts) === 2, $message);
    [$local, $domain] = $parts;
    $localPattern = <<<'REGEX'
~^[a-z0-9!#$%&'*+/=?^_`{|}\~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}\~-]+)*$~D
REGEX;
    require_input(strlen($local) <= 64 && preg_match($localPattern, $local) === 1, $message);
    $labels = explode('.', $domain);
    require_input(count($labels) >= 2 && preg_match('/^[a-z][a-z0-9-]*[a-z0-9]$/D', end($labels)) === 1, $message);
    foreach ($labels as $label) {
        require_input(preg_match('/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/D', $label) === 1, $message);
    }
    return $email;
}

function normalize_name($value): string
{
    $message = 'El nombre debe contener entre 2 y 120 caracteres.';
    require_input(is_string($value) && js_length($value) <= 120 && !preg_match('/[\x00-\x1f\x7f]/', $value), $message);
    $name = preg_replace('~' . JS_SPACE . '+~u', ' ', js_trim($value));
    require_input(js_length($name) >= 2, $message);
    return $name;
}

function ini_bytes(string $value): int
{
    $number = (int) $value;
    $suffix = strtolower(substr(trim($value), -1));
    return $number * (['g' => 1073741824, 'm' => 1048576, 'k' => 1024][$suffix] ?? 1);
}

<?php
declare(strict_types=1);

namespace Vitamet\Submit;

require_once __DIR__ . '/utils/airtablePost.php';

run('con', static function (): array {
    require_post('application/json', JSON_LIMIT);
    $body = read_json();
    if (envelope($body, ['name', 'email', 'subject', 'message', 'formSource', 'utm', 'website'])) {
        return accepted();
    }
    $source = require_source($body, ['consulta_contacto']);
    $sourceUtm = classify_utm($body);
    $name = normalize_name($body->name ?? null);
    $email = normalize_email($body->email ?? null);
    require_input(isset($body->subject) && in_array($body->subject, ['asesoria', 'servicios', 'otro'], true), 'El asunto no es válido.');
    $raw = $body->message ?? null;
    $messageError = 'El mensaje debe contener entre 10 y 5000 caracteres.';
    require_input(is_string($raw) && js_length($raw) <= 5000 && !preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $raw), $messageError);
    $message = js_trim(str_replace(["\r\n", "\r"], "\n", $raw));
    require_input(js_length($message) >= 10, $messageError);
    $config = load_config(__DIR__ . '/../../env-vitamet.php', __DIR__ . '/..', 'CON');
    try {
        create_record($config, ['name' => $name, 'email' => $email, 'subject' => $body->subject,
            'text' => $message, 'source' => $source, 'source_utm' => $sourceUtm]);
        return accepted();
    } catch (AirtableError $error) {
        return record_error('con', $error);
    }
});

<?php
declare(strict_types=1);

namespace Vitamet\Submit;

require_once __DIR__ . '/utils/airtablePost.php';

run('email', static function (): array {
    require_post('application/json', JSON_LIMIT);
    $body = read_json();
    if (envelope($body, ['email', 'formSource', 'utm', 'website'])) {
        return accepted();
    }
    $email = normalize_email($body->email ?? null);
    $source = require_source($body, ['newsletter_blog', 'asesoria_contacto']);
    $sourceUtm = classify_utm($body);
    // Ruta confirmada: /home/compraru/VITAMET/backend -> /home/compraru/env-vitamet.php.
    $config = load_config(__DIR__ . '/../../env-vitamet.php', __DIR__ . '/..', 'MAIL');
    try {
        create_record($config, ['email' => $email, 'source' => $source, 'source_utm' => $sourceUtm], JSON_LIMIT);
        return accepted();
    } catch (AirtableError $error) {
        provider_log('email', 'create_record', $error);
        return [$error->timedOut ? 504 : 502, ['success' => false,
            'message' => 'No se pudo procesar la solicitud. Inténtalo más tarde.']];
    }
});

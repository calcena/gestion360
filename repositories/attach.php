<?php
require_once __DIR__ . '/../helpers/helper.php';
debug_mode();

function createAdjunto($params) {
    global $db;
    if (!isset($db)) {
        $db = conectar();
    }

    $vehiculo_id = $params['vehiculo_id'];
    $mantenimiento_id = $params['mantenimiento_id'];
    $ruta = $params['ruta'];

    $stmt = $db->prepare("
        INSERT INTO adjunto (
            ruta,
            created_at,
            is_active
        ) VALUES (?, ?, ?, datetime('now'), 1)
    ");

    $stmt->execute([
        $vehiculo_id,
        $mantenimiento_id,
        $ruta
    ]);

    return $db->lastInsertId();
}
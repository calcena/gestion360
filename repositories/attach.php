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

function delete_attachment($params) {
    global $db;
    $db = conectar();
    
    // Validate required parameters
    if (!isset($params['envio_id'])) {
        throw new Exception("Missing required parameter: envio_id");
    }
    
    $envio_id = intval($params['envio_id']);
    
    // Check if envio exists and get current attachment
    $check_stmt = $db->prepare("SELECT archivo FROM adjunto WHERE envio_id = ? AND activo = true ORDER BY registro DESC LIMIT 1");
    $check_stmt->execute([$envio_id]);
    $current = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$current) {
        return true; // Nothing to delete
    }
    
    // Soft delete by setting activo to false (or you could use DELETE)
    $stmt = $db->prepare("UPDATE adjunto SET activo = false WHERE envio_id = ? AND archivo = ?");
    $result = $stmt->execute([$envio_id, $current['archivo']]);
    
    if (!$result) {
        throw new Exception("Database error in delete_attachment");
    }
    
    // Log the deletion
    if ($stmt->rowCount() > 0) {
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        guardar_log($envio_id, $usuario_id, 'DELETE', 'adjunto', $current['archivo'], null);
    }
    
    return $stmt->rowCount() > 0;
}
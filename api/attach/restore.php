<?php
$root = dirname(dirname(__DIR__));
require_once $root . '/helpers/config.php';
require_once $root . '/database/DatabaseConnection.php';
header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) $input = $_POST;

$envio_id = $input['envio_id'] ?? null;
$archivo = $input['archivo'] ?? null;

if (!$envio_id || !$archivo) {
    echo json_encode(['success' => false, 'message' => 'envio_id y archivo requeridos']);
    exit;
}

try {
    $db = conectar();
    
    $baseName = preg_replace('/\.\d+\.pdf$/i', '', $archivo);
    $versionTimestamp = round(microtime(true) * 1000);
    
    $stmt = $db->prepare('INSERT INTO adjunto (registro, envio_id, archivo, uuid_original, version_timestamp) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([date('Y-m-d H:i:s'), intval($envio_id), $archivo, $baseName, $versionTimestamp]);
    echo json_encode(['success' => true, 'message' => 'Versión restaurada correctamente']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

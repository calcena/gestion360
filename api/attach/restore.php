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

$attachmentsDir = $root . '/attachments/';
$logFile = $root . '/logs/restore.log';

function logMsg($msg) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}

logMsg("Inicio - archivo: $archivo, envio_id: $envio_id");

try {
    $db = conectar();
    
    // El archivo seleccionado es ej: uuid.timestamp.pdf
    // Extraer el uuid base (quitar .timestamp.pdf)
    $baseName = preg_replace('/\.\d+\.pdf$/i', '', $archivo);
    // Si aún termina en .pdf, quitárselo para obtener el uuid base
    if (str_ends_with(strtolower($baseName), '.pdf')) {
        $baseName = substr($baseName, 0, -4);
    }
    $versionTimestamp = round(microtime(true) * 1000);
    
    // Archivo de versión a restaurar
    $versionFile = $attachmentsDir . $archivo;
    // Archivo destino (el principal sin timestamp)
    $targetFile = $attachmentsDir . $baseName . '.pdf';
    
    logMsg("versionFile: $versionFile");
    logMsg("targetFile: $targetFile");
    logMsg("baseName: $baseName");
    logMsg("existe versionFile: " . (file_exists($versionFile) ? 'SI' : 'NO'));
    
    if (file_exists($versionFile)) {
        // Si son el mismo archivo, no necesitamos copiar
        if ($versionFile === $targetFile) {
            logMsg("Archivo versión es igual al actual, solo registramos en BD");
            $archivoRestaurado = $archivo;
            // Usar version_timestamp = 0 para marcar como actual
            $versionTimestamp = 0;
        } elseif (copy($versionFile, $targetFile)) {
            logMsg("Copia exitosa");
            $archivoRestaurado = $baseName . '.pdf';
            // Usar version_timestamp = 0 para marcar como archivo actual
            $versionTimestamp = 0;
        } else {
            logMsg("Error al copiar archivo");
            echo json_encode(['success' => false, 'message' => 'Error al copiar el archivo']);
            exit;
        }
    } else {
        logMsg("Archivo de versión no encontrado");
        echo json_encode(['success' => false, 'message' => 'Archivo de versión no encontrado: ' . $archivo]);
        exit;
    }
    
    $stmt = $db->prepare('INSERT INTO adjunto (registro, envio_id, archivo, uuid_original, version_timestamp) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([date('Y-m-d H:i:s'), intval($envio_id), $archivoRestaurado, $baseName, $versionTimestamp]);
    logMsg("Insertado en BD: $archivoRestaurado");
    echo json_encode(['success' => true, 'message' => 'Versión restaurada correctamente']);
} catch (Exception $e) {
    logMsg("Excepcion: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

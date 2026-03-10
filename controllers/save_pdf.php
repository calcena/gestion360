<?php
$root = dirname(__DIR__);
require_once $root . '/helpers/helper.php';

header('Content-Type: application/json');

$logDir = $root . '/logs';
if (!file_exists($logDir)) {
    @mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/save_pdf_debug.log';
file_put_contents($logFile, "[" . date('c') . "] save_pdf.php called\n", FILE_APPEND);
file_put_contents($logFile, "POST keys: " . implode(',', array_keys($_POST)) . "\n", FILE_APPEND);
file_put_contents($logFile, "FILES keys: " . implode(',', array_keys($_FILES)) . "\n", FILE_APPEND);
if (isset($_FILES['pdf_file'])) {
    $f = $_FILES['pdf_file'];
    file_put_contents($logFile, "pdf_file name=" . ($f['name'] ?? 'null') . " size=" . ($f['size'] ?? 'null') . " tmp=" . ($f['tmp_name'] ?? 'null') . " error=" . ($f['error'] ?? 'null') . "\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$fileName = isset($_POST['file_name']) ? $_POST['file_name'] : '';
$versionTimestamp = isset($_POST['version_timestamp']) ? $_POST['version_timestamp'] : null;

// Log file name for debugging
file_put_contents($logFile, "Processing file_name: " . $fileName . "\n", FILE_APPEND);

// Validate file name - ensure it ends with .pdf and doesn't contain path traversal
if (empty($fileName)) {
    file_put_contents($logFile, "ERROR: File name is empty\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Nombre de archivo vacío']);
    exit;
}

if (!preg_match('/\.pdf$/i', $fileName)) {
    file_put_contents($logFile, "ERROR: File name does not end with .pdf: " . $fileName . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'El archivo debe terminar en .pdf']);
    exit;
}

if (preg_match('/[\/\\\\]/', $fileName)) {
    file_put_contents($logFile, "ERROR: File name contains path separators: " . $fileName . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Nombre de archivo inválido (path traversal detected)']);
    exit;
}

// Sanitize file name to prevent path traversal
$fileName = basename($fileName);

$uploadDir = $root . '/attachments/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE   => 'El archivo excede el límite permitido.',
        UPLOAD_ERR_FORM_SIZE  => 'El archivo excede el límite del formulario.',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió parcialmente.',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo.',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal.',
        UPLOAD_ERR_CANT_WRITE => 'Error al escribir en disco.',
        UPLOAD_ERR_EXTENSION  => 'Extensión bloqueó la subida.',
    ];
    $code = $_FILES['pdf_file']['error'] ?? UPLOAD_ERR_NO_FILE;
    $msg  = $errors[$code] ?? 'Error desconocido.';
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

$file = $_FILES['pdf_file'];

if (isset($_POST['annotations_meta'])) {
    $meta = substr($_POST['annotations_meta'], 0, 4000);
    file_put_contents($logFile, "annotations_meta: " . $meta . "\n", FILE_APPEND);
}

if ($file['type'] !== 'application/pdf' && !str_ends_with(strtolower($file['name']), '.pdf')) {
    echo json_encode(['success' => false, 'message' => 'Solo se permiten archivos PDF']);
    exit;
}

if ($file['size'] > 20 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'Máx. 20 MB.']);
    exit;
}

$ext = 'pdf';
$baseName = preg_replace('/\.\d+\.pdf$/i', '', $fileName);
$newFileName = $fileName;

if ($versionTimestamp) {
    $newFileName = $baseName . '.' . $versionTimestamp . '.pdf';
}

$targetPath = $uploadDir . $newFileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo en el servidor.']);
    exit;
}

$savedSize = filesize($targetPath);
echo json_encode([
    'success' => true,
    'message' => 'PDF guardado correctamente',
    'data'    => [
        'file_name' => $newFileName,
        'uploaded_size' => $file['size'],
        'saved_size' => $savedSize,
    ]
]);

if (isset($_POST['envio_id']) && is_numeric($_POST['envio_id'])) {
    require_once $root . '/database/DatabaseConnection.php';
    try {
        $db = conectar();
        $envioId = intval($_POST['envio_id']);
        
        $stmt = $db->prepare("SELECT id, archivo FROM adjunto WHERE envio_id = ? ORDER BY registro DESC LIMIT 1");
        $stmt->execute([$envioId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            $originalUuid = $baseName;
            if (!$versionTimestamp) {
                $originalUuid = preg_replace('/\.\d+\.pdf$/i', '', $row['archivo']);
                if ($originalUuid === $row['archivo']) {
                    $originalUuid = preg_replace('/\.pdf$/i', '', $row['archivo']);
                }
            }
            
            $ins = $db->prepare("INSERT INTO adjunto (registro, envio_id, archivo, uuid_original, version_timestamp) VALUES (?, ?, ?, ?, ?)");
            $ins->execute([date('Y-m-d H:i:s'), $envioId, $newFileName, $originalUuid, $versionTimestamp]);
            file_put_contents($logFile, "adjunto version inserted for envio_id={$envioId} -> {$newFileName}, original={$originalUuid}, ts={$versionTimestamp}\n", FILE_APPEND);
        } else {
            $ins = $db->prepare("INSERT INTO adjunto (registro, envio_id, archivo, uuid_original, version_timestamp) VALUES (?, ?, ?, ?, ?)");
            $ins->execute([date('Y-m-d H:i:s'), $envioId, $newFileName, $baseName, $versionTimestamp]);
            file_put_contents($logFile, "adjunto created for envio_id={$envioId} -> {$newFileName}\n", FILE_APPEND);
        }
    } catch (Exception $e) {
        file_put_contents($logFile, "DB update error: " . $e->getMessage() . "\n", FILE_APPEND);
    }
}

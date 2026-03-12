<?php
$root = dirname(__DIR__);
require_once $root . '/helpers/config.php';
require_once $root . '/database/DatabaseConnection.php';
require_once $root . '/helpers/helper.php';
require_once $root . '/models/attach.php';

global $db;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

get_session_status();

$action = defined('ACTION') ? ACTION : ($_GET ? array_keys($_GET)[0] : '');

function handle_uploadAttachment()
{
    header('Content-Type: application/json');
    
    $uploadDir = __DIR__ . '/../attachments/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'No se pudo crear la carpeta de adjuntos']);
            exit;
        }
    }

    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el límite permitido.',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el límite del formulario.',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente.',
            UPLOAD_ERR_NO_FILE => 'No se seleccionó ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal.',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir en disco.',
            UPLOAD_ERR_EXTENSION => 'Extensión bloqueó la subida.',
        ];
        $code = $_FILES['archivo']['error'] ?? UPLOAD_ERR_NO_FILE;
        $msg = $errors[$code] ?? 'Error desconocido.';
        echo json_encode(['success' => false, 'message' => $msg]);
        exit;
    }

    $file = $_FILES['archivo'];

    $allowedTypes = ['application/pdf'];
    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Solo se permiten archivos PDF.']);
        exit;
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Máx. 5 MB.']);
        exit;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $uuid = new_guui_generator();
    $safeName = $uuid . '.' . $ext;
    $targetPath = $uploadDir . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo.']);
        exit;
    }

    try {
        echo json_encode([
            'success' => true,
            'message' => 'Archivo',
            'data' => [
                'file_name' => $safeName,
                'file_path' => 'attachments/' . $safeName
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error BD adjunto: " . $e->getMessage());
        @unlink($targetPath);
        echo json_encode([
            'success' => false,
            'message' => 'Archivo subido, pero no se pudo registrar. Contacte al administrador.'
        ]);
    }
}

function handle_deleteAttachment()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = delete_attachment($params);
        echo json_encode([
            'success' => true,
            'content' => $entity
        ]);
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// === Enrutar según acción ===
switch ($action) {
    case 'delete':
    case 'deleteAttachment':
        handle_deleteAttachment();
        break;
    default:
        handle_uploadAttachment();
        break;
}
?>
<?php
require_once '../../helpers/helper.php';
require_once '../../helpers/config.php';

header('Content-Type: application/json');

// Iniciar sesión usando la función del helper (configura el path correctamente para hosting)
get_session_status();

if (!defined('DB_PATH')) {
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && $line[0] !== '#') {
                list($key, $value) = array_map('trim', explode('=', $line, 2));
                if ($key === 'DB_PATH') {
                    define('DB_PATH', $value);
                    break;
                }
            }
        }
    }
    
    if (!defined('DB_PATH')) {
        define('DB_PATH', __DIR__ . '/../../database/app.db');
    }
}

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user']['id'];

$action = $_GET['action'] ?? '';
if (empty($action)) {
    foreach ($_GET as $key => $value) {
        if ($value === '' || $value === null) {
            $action = $key;
            break;
        }
    }
}

try {
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$data = $input['data'] ?? [];

switch ($action) {
    case 'getFotos':
        getFotos($db, $data);
        break;
    
    case 'addFoto':
        addFoto($db, $data, $userId);
        break;
    
    case 'deleteFoto':
        deleteFoto($db, $data, $userId);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        break;
}

function getFotos($db, $data) {
    $envioId = $data['envio_id'] ?? 0;
    
    if (!$envioId) {
        echo json_encode(['success' => false, 'message' => 'ID de envío no válido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT f.*, strftime('%Y-%m-%d %H:%M:%S', f.registro) as registro
            FROM foto f
            WHERE f.envio_id = ? AND f.activo = 1
            ORDER BY f.registro DESC
        ");
        $stmt->execute([$envioId]);
        $fotos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'fotos' => $fotos ?: []
        ]);
    } catch (PDOException $e) {
        error_log("Error getting fotos: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al obtener fotos: ' . $e->getMessage()]);
    }
}

function addFoto($db, $data, $userId) {
    $envioId = $data['envio_id'] ?? 0;
    $imageData = $data['image'] ?? '';
    
    if (!$envioId) {
        echo json_encode(['success' => false, 'message' => 'ID de envío no válido']);
        return;
    }
    
    if (empty($imageData)) {
        echo json_encode(['success' => false, 'message' => 'Imagen no proporcionada']);
        return;
    }
    
    try {
        $uuid = new_guui_generator();
        
        $extension = 'jpg';
        if (strpos($imageData, 'data:image/png') !== false) {
            $extension = 'png';
        }
        
        $filename = $uuid . '.' . $extension;
        $uploadDir = __DIR__ . '/../../photos/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $imageBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
        $imageBinary = base64_decode($imageBase64);
        
        $filePath = $uploadDir . $filename;
        if (file_put_contents($filePath, $imageBinary) === false) {
            throw new Exception('Error al guardar la imagen');
        }
        
        $stmt = $db->prepare("
            INSERT INTO foto (envio_id, uuid, registro, activo)
            VALUES (?, ?, datetime('now'), 1)
        ");
        $stmt->execute([$envioId, $filename]);
        
        $fotoId = $db->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Foto guardada correctamente', 
            'fotoId' => $fotoId,
            'uuid' => $filename
        ]);
    } catch (PDOException $e) {
        error_log("Error adding foto: " . $e->getMessage());
        $errorMessage = (strpos($e->getMessage(), 'no such table') !== false) 
            ? 'Error de base de datos' 
            : 'Error al guardar foto: ' . $e->getMessage();
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    } catch (Exception $e) {
        error_log("Error saving foto file: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al guardar archivo: ' . $e->getMessage()]);
    }
}

function deleteFoto($db, $data, $userId) {
    $fotoId = $data['foto_id'] ?? 0;
    
    if (!$fotoId) {
        echo json_encode(['success' => false, 'message' => 'ID de foto no válido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("SELECT uuid FROM foto WHERE id = ?");
        $stmt->execute([$fotoId]);
        $foto = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$foto) {
            echo json_encode(['success' => false, 'message' => 'Foto no encontrada']);
            return;
        }
        
        $stmt = $db->prepare("UPDATE foto SET activo = 0 WHERE id = ?");
        $stmt->execute([$fotoId]);
        
        $filePath = __DIR__ . '/../../photos/' . $foto['uuid'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        echo json_encode(['success' => true, 'message' => 'Foto eliminada correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar foto']);
    }
}

<?php
require_once '../../helpers/helper.php';
require_once '../../helpers/config.php';

header('Content-Type: application/json');

// Iniciar sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Asegurar que DB_PATH esté definido
if (!defined('DB_PATH')) {
    // Intentar cargar el .env manualmente si no está definido
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
    
    // Si aún no está definido, usar valor por defecto
    if (!defined('DB_PATH')) {
        define('DB_PATH', __DIR__ . '/../../database/app.db');
    }
}

// Verificar autenticación
if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user']['id'];
$userName = $_SESSION['user']['nombre'] ?? 'Usuario';

// Obtener la acción solicitada
// Las peticiones pueden usar ?action=getComments o ?getComments
$action = $_GET['action'] ?? '';
if (empty($action)) {
    // Buscar en los parámetros de la URL (ej: ?getComments)
    foreach ($_GET as $key => $value) {
        if ($value === '' || $value === null) {
            $action = $key;
            break;
        }
    }
}

// Conectar a la base de datos
try {
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit;
}

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);
$data = $input['data'] ?? [];

switch ($action) {
    case 'getComments':
        getComments($db, $data);
        break;
    
    case 'addComment':
        addComment($db, $data, $userId, $userName);
        break;
    
    case 'deleteComment':
        deleteComment($db, $data, $userId);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        break;
}

function getComments($db, $data) {
    $envioId = $data['envio_id'] ?? 0;
    
    if (!$envioId) {
        echo json_encode(['success' => false, 'message' => 'ID de envío no válido']);
        return;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT c.*, u.nombre as nombre_usuario
            FROM comentario c
            LEFT JOIN usuario u ON c.usuario_id = u.id
            WHERE c.envio_id = ? AND c.activo = 1
            ORDER BY c.registro DESC
        ");
        $stmt->execute([$envioId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Debug: Log comments count
        error_log("Comments found for envio_id $envioId: " . count($comments));
        
        echo json_encode([
            'success' => true,
            'comments' => $comments ?: []
        ]);
    } catch (PDOException $e) {
        error_log("Error getting comments: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al obtener comentarios: ' . $e->getMessage()]);
    }
}

function addComment($db, $data, $userId, $userName) {
    $envioId = $data['envio_id'] ?? 0;
    $comentario = trim($data['comentario'] ?? '');
    
    if (!$envioId) {
        echo json_encode(['success' => false, 'message' => 'ID de envío no válido']);
        return;
    }
    
    if (empty($comentario)) {
        echo json_encode(['success' => false, 'message' => 'El comentario no puede estar vacío']);
        return;
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO comentario (envio_id, usuario_id, descripcion, registro, activo)
            VALUES (?, ?, ?, datetime('now'), 1)
        ");
        $stmt->execute([$envioId, $userId, $comentario]);
        
        $commentId = $db->lastInsertId();
        
        // Debug: Log successful insertion
        error_log("Comment added successfully: ID $commentId for envio $envioId");
        
        echo json_encode(['success' => true, 'message' => 'Comentario añadido correctamente', 'commentId' => $commentId]);
    } catch (PDOException $e) {
        error_log("Error adding comment: " . $e->getMessage());
        // Si el mensaje de error contiene "no such table", devolver un mensaje genérico
        $errorMessage = (strpos($e->getMessage(), 'no such table') !== false) 
            ? 'Error de base de datos' 
            : 'Error al guardar comentario: ' . $e->getMessage();
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    }
}

function deleteComment($db, $data, $userId) {
    $commentId = $data['comment_id'] ?? 0;
    
    if (!$commentId) {
        echo json_encode(['success' => false, 'message' => 'ID de comentario no válido']);
        return;
    }
    
    try {
        // Verificar que el comentario pertenece al usuario o es admin
        $stmt = $db->prepare("SELECT usuario_id FROM comentario WHERE id = ?");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$comment) {
            echo json_encode(['success' => false, 'message' => 'Comentario no encontrado']);
            return;
        }
        
        // Solo permitir borrar si es el autor o es admin (role_id == 1)
        if ($comment['usuario_id'] != $userId && $_SESSION['user']['role_id'] != 1) {
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para eliminar este comentario']);
            return;
        }
        
        // En lugar de eliminar, marcar como inactivo (soft delete)
        $stmt = $db->prepare("UPDATE comentario SET activo = 0 WHERE id = ?");
        $stmt->execute([$commentId]);
        
        echo json_encode(['success' => true, 'message' => 'Comentario eliminado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar comentario']);
    }
}

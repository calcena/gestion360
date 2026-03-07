<?php

$root = dirname(__DIR__);
require_once $root . '/helpers/config.php';
require_once $root . '/database/DatabaseConnection.php';
require_once $root . '/models/usuario.php';

global $db;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = defined('ACTION') ? ACTION : ($_GET ? array_keys($_GET)[0] : '');

function handle_usuarios()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado: inicie sesión']);
        return;
    }

    try {
        $usuarios = getUsuarios();
        echo json_encode([
            'success' => true,
            'content' => $usuarios
        ]);
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Credenciales inválidas'
        ]);
    }
}

// === Enrutar según acción ===
switch ($action) {
    case 'getAll':
        handle_usuarios();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Acción no soportada en este controlador']);
}

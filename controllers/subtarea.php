<?php

$root = dirname(__DIR__);
require_once $root . '/helpers/config.php';
require_once $root . '/database/DatabaseConnection.php';
require_once $root . '/models/subtarea.php';

global $db;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = defined('ACTION') ? ACTION : ($_GET ? array_keys($_GET)[0] : '');

function handle_get_subtareas()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = get_subtareas($params);
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

function handle_get_numerador()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = get_numerador($params);
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

function handle_create_subtarea()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = create_subtarea($params);
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

function handle_get_tarea_by_id()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = get_tarea_by_id($params);
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

function handle_edit_tarea()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = edit_tarea_by_id($params);
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

function handle_register_time_init()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = register_time_init($params);
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

function handle_register_time_fin()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = register_time_fin($params);
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

function handle_tiempo_tarea()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = tiempo_tarea($params);
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

function handle_delete_tarea()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = delete_tarea($params);
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

function handle_save_comentario()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = save_comentario($params);
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

function handle_get_list_all_comentario()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = get_list_all_comentario($params);
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

function handle_get_comentario_by_id()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = get_comentario_by_id($params);
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

function handle_delete_comentario_by_id()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $params = $input['data'];

    try {
        $entity = delete_comentario_by_id($params);
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
    case 'getListAllSubtareas':
        handle_get_subtareas();
        break;
    case 'getNumeradorSubtarea':
        handle_get_numerador();
        break;
    case 'createSubtarea':
        handle_create_subtarea();
        break;
    // case 'editSubtarea':
    //     handle_edit_tarea();
    //     break;
    // case 'getSubtareaById':
    //     handle_get_tarea_by_id();
    //     break;
    // case 'registerInitTime':
    //     handle_register_time_init();
    //     break;
    // case 'stopActionTime':
    //     handle_register_time_fin();
    //     break;
    // case 'deleteTarea':
    //     handle_delete_tarea();
    //     break;
    // case 'saveComentario':
    //     handle_save_comentario();
    //     break;
    // case 'getListAllComentarios':
    //     handle_get_list_all_comentario();
    //     break;
    // case 'getComentarioById':
    //     handle_get_comentario_by_id();
    //     break;
    // case 'deleteComentarioById':
    //     handle_delete_comentario_by_id();
    //     break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Acción no soportada en este controlador']);
}

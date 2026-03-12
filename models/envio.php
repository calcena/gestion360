<?php
require_once __DIR__ . '/../repositories/envio.php';


function get_envios($params) {
    global $db;
    $entity = list_envios($params);
    return $entity;
}

function get_numerador($params){
    global $db;
    $entity = siguiente_numerador($params);
    return $entity;
}

function create_tarea($params){
    global $db;
    $entity = create_new_tarea($params);
    return $entity;
}

function get_tarea_by_id($params){
    global $db;
    $params['tarea_id'] = $params['envio_id'];
    $entity = get_tarea($params);
    return $entity;
}

function edit_envio_by_id($params){
    global $db;
    $entity = edit_envio($params);
    return $entity;
}

function edit_priority($params){
    global $db;
    $db = conectar();
    
    // Validate required parameters
    if (!isset($params['envio']) || !isset($params['prioridad'])) {
        throw new Exception("Missing required parameters: envio or prioridad");
    }
    
    $envio_id = intval($params['envio']);
    $prioridad_id = intval($params['prioridad']);
    
    // Check if envio exists
    $check_stmt = $db->prepare("SELECT id FROM envio WHERE id = ?");
    $check_stmt->execute([$envio_id]);
    if (!$check_stmt->fetch()) {
        throw new Exception("Envío not found: " . $envio_id);
    }
    
    $stmt = $db->prepare("UPDATE envio SET prioridad_id = ? WHERE id = ?");
    $result = $stmt->execute([$prioridad_id, $envio_id]);
    
    if (!$result) {
        throw new Exception("Database error in edit_priority");
    }
    
    // Log the change if update was successful
    if ($stmt->rowCount() > 0) {
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        
        // Get current priority for logging
        $stmt_select = $db->prepare("SELECT prioridad_id FROM envio WHERE id = ?");
        $stmt_select->execute([$envio_id]);
        $current = $stmt_select->fetch(PDO::FETCH_ASSOC);
        
        if ($current) {
            guardar_log($envio_id, $usuario_id, 'CHANGE_PRIORITY', 'prioridad_id', $current['prioridad_id'], $prioridad_id);
        }
    } else {
        // No rows updated - maybe the value is the same?
        error_log("edit_priority: No rows updated for envio_id=$envio_id, prioridad_id=$prioridad_id");
    }
    
    return $stmt->rowCount() > 0;
}

function eliminar_envio($params){
    global $db;
    $entity = elimina_envio($params);
    return $entity;
}

function exists_nuevos_envios($params){
    global $db;
    $entity = exists_envios($params);
    return $entity;
}

function save_comentario($params){
    global $db;
    $entity = save_comentario_tarea($params);
    return $entity;
}

function get_list_all_comentario($params){
    global $db;
    $entity = list_all_comentario($params);
    return $entity;
}

function get_comentario_by_id($params){
    global $db;
    $entity = comentario_by_id($params);
    return $entity;
}

function delete_comentario_by_id($params){
    global $db;
    $entity = delete_comentario($params);
    return $entity;
}

function update_envio_recibido($params){
    global $db;
    $entity = envio_recibido_ok($params);
    return $entity;
}

function get_audit_logs($params){
    global $db;
    $entity = get_envio_audit_logs($params["envio_id"]);
    return $entity;
}

function edit_state($params){
    global $db;
    $db = conectar();
    
    // Validate required parameters
    if (!isset($params['envio']) || !isset($params['estado'])) {
        throw new Exception("Missing required parameters");
    }
    
    $stmt = $db->prepare("UPDATE envio SET estado_id = ? WHERE id = ?");
    $stmt->execute([$params['estado'], $params['envio']]);
    
    // Log the change if update was successful
    if ($stmt->rowCount() > 0) {
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        
        // Get current state for logging
        $stmt_select = $db->prepare("SELECT estado_id FROM envio WHERE id = ?");
        $stmt_select->execute([$params['envio']]);
        $current = $stmt_select->fetch(PDO::FETCH_ASSOC);
        
        if ($current) {
            guardar_log($params['envio'], $usuario_id, 'CHANGE_STATE', 'estado_id', $current['estado_id'], $params['estado']);
        }
    }
    
    return $stmt->rowCount() > 0;
}



























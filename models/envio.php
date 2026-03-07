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
    $entity = get_tarea($params);
    return $entity;
}

function edit_envio_by_id($params){
    global $db;
    $entity = edit_envio($params);
    return $entity;
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



























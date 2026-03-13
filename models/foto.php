<?php
require_once __DIR__ . '/../repositories/foto.php';

function get_fotos_by_envio($params) {
    global $db;
    $entity = list_fotos_by_envio($params);
    return $entity;
}

function create_foto($params){
    global $db;
    $entity = create_new_foto($params);
    return $entity;
}

function delete_foto($params){
    global $db;
    $entity = delete_foto_by_id($params);
    return $entity;
}

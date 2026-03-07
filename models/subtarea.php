<?php
require_once __DIR__ . '/../repositories/subtarea.php';

function get_numerador($params){
    global $db;
    $entity = siguiente_numerador($params);
    return $entity;
}


function create_subtarea($params){
    global $db;
    $entity = new_subtarea($params);
    return $entity;
}

function get_subtareas($params){
    global $db;
    $entity = list_subtareas($params);
    return $entity;
}



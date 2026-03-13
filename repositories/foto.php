<?php

function list_fotos_by_envio($params)
{
    $db = conectar();
    $stmt = $db->prepare("
        SELECT f.*, u.nombre as nombre_usuario
        FROM foto f
        LEFT JOIN envio e ON f.envio_id = e.id
        LEFT JOIN usuario u ON e.emisor_id = u.id
        WHERE f.envio_id = ? AND f.activo = 1
        ORDER BY f.registro DESC
    ");
    $stmt->execute([$params["envio_id"]]);
    $entity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $entity;
}

function create_new_foto($params)
{
    $db = conectar();
    $stmt = $db->prepare("
        INSERT INTO foto (registro, envio_id, uuid, activo)
        VALUES (?, ?, ?, 1)
    ");
    $stmt->execute([$params["registro"], $params["envio_id"], $params["uuid"]]);
    
    $foto_id = $db->lastInsertId();
    return $foto_id;
}

function delete_foto_by_id($params)
{
    $db = conectar();
    $stmt = $db->prepare("UPDATE foto SET activo = 0 WHERE id = ?");
    $stmt->execute([$params["foto_id"]]);
    return true;
}

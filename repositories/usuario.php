<?php

function obtenerUsuarios()
{
    global $db;
    $stmt = $db->prepare("SELECT id, nombre, email FROM usuarios WHERE activo = 1 ORDER BY nombre ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
    return $usuarios;
}

<?php
require_once __DIR__ . '/../repositories/usuario.php';

function getUsuarios() {
    global $db;
    $usuarios = obtenerUsuarios();
    return $usuarios;
}
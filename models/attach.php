<?php
require_once __DIR__ . '/../repositories/attach.php';

function createAdjuntoModel($params) {
    global $db;
    $id = createAdjunto($params);
    return $id;
}

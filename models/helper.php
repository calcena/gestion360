<?php
require_once __DIR__ . '/../helpers/helper.php';
debug_mode();
require_once __DIR__ . '/../repositories/helper.php';

function getKilometrosByVehiculo($params)
{
    global $db;
    $entity = get_kilometros_by_vehiculo($params);
    return $entity;
}

function setKilometrosByVehiculo($params)
{
    global $db;
    $entity = set_kilometros_by_vehiculo($params);
    return $entity;
}

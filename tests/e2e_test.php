<?php
require_once __DIR__ . '/../helpers/helper.php';
require_once __DIR__ . '/../helpers/config.php';
require_once __DIR__ . '/../database/DatabaseConnection.php';

echo "=== TEST E2E: Crear, Editar y Verificar Tarea ===\n\n";

$db = conectar();

try {
    echo "PASO 1: Obtener numerador de tarea\n";
    $stmt = $db->prepare("SELECT * FROM contador WHERE id = 1");
    $stmt->execute();
    $contador = $stmt->fetch(PDO::FETCH_ASSOC);
    $numEnvio = $contador['envio'] + 1;
    echo "  - Numero de envio actual: $numEnvio\n\n";

    echo "PASO 2: Crear nueva tarea\n";
    $registro = date('Y-m-d H:i:s');
    $descripcion = "Tarea de prueba E2E - " . date('Y-m-d H:i:s');
    $prioridad_id = 1;
    $estado_id = 1;
    
    $stmt = $db->prepare("INSERT INTO envio (registro, num_envio, emisor_id, descripcion, prioridad_id, estado_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$registro, $numEnvio, 1, $descripcion, $prioridad_id, $estado_id]);
    $envio_id = $db->lastInsertId();
    
    if ($envio_id > 0) {
        echo "  - Tarea creada con ID: $envio_id\n";
        echo "  - Descripcion: $descripcion\n";
        echo "  - Estado: Pendiente (1)\n";
        
        $stmt = $db->prepare("UPDATE contador SET envio = ? WHERE id = 1");
        $stmt->execute([$numEnvio]);
        echo "  - Contador actualizado\n\n";
    } else {
        echo "  - ERROR: No se pudo crear la tarea\n";
        exit(1);
    }

    echo "PASO 3: Verificar tarea creada\n";
    $stmt = $db->prepare("SELECT * FROM envio WHERE id = ?");
    $stmt->execute([$envio_id]);
    $tarea = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($tarea && $tarea['descripcion'] === $descripcion) {
        echo "  - Tarea verificada correctamente\n";
        echo "  - ID: " . $tarea['id'] . "\n";
        echo "  - Num_envio: " . $tarea['num_envio'] . "\n";
        echo "  - Descripcion: " . $tarea['descripcion'] . "\n";
        echo "  - Estado ID: " . $tarea['estado_id'] . "\n\n";
    } else {
        echo "  - ERROR: La tarea no se encuentra\n";
        exit(1);
    }

    echo "PASO 4: Editar tarea (cambiar descripcion y estado)\n";
    $nueva_descripcion = "Tarea de prueba E2E - MODIFICADA - " . date('Y-m-d H:i:s');
    $nuevo_estado = 2;
    $nueva_prioridad = 2;
    
    $stmt = $db->prepare("UPDATE envio SET descripcion = ?, estado_id = ?, prioridad_id = ? WHERE id = ?");
    $stmt->execute([$nueva_descripcion, $nuevo_estado, $nueva_prioridad, $envio_id]);
    
    echo "  - Nueva descripcion: $nueva_descripcion\n";
    echo "  - Nuevo estado: En curso (2)\n";
    echo "  - Nueva prioridad: Alta (2)\n\n";

    echo "PASO 5: Verificar tarea editada\n";
    $stmt = $db->prepare("SELECT * FROM envio WHERE id = ?");
    $stmt->execute([$envio_id]);
    $tarea_editada = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($tarea_editada && $tarea_editada['descripcion'] === $nueva_descripcion && $tarea_editada['estado_id'] == $nuevo_estado) {
        echo "  - Tarea editada correctamente\n";
        echo "  - ID: " . $tarea_editada['id'] . "\n";
        echo "  - Num_envio: " . $tarea_editada['num_envio'] . "\n";
        echo "  - Descripcion: " . $tarea_editada['descripcion'] . "\n";
        echo "  - Estado ID: " . $tarea_editada['estado_id'] . "\n";
        echo "  - Prioridad ID: " . $tarea_editada['prioridad_id'] . "\n\n";
    } else {
        echo "  - ERROR: Los cambios no se guardaron correctamente\n";
        exit(1);
    }

    echo "PASO 6: Verificar registro en audit log\n";
    $stmt = $db->prepare("SELECT * FROM envio_audit WHERE envio_id = ? ORDER BY id DESC LIMIT 5");
    $stmt->execute([$envio_id]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($logs) > 0) {
        echo "  - Se encontraron " . count($logs) . " registros de audit\n";
        foreach ($logs as $log) {
            $accion = isset($log['accion']) ? $log['accion'] : 'N/A';
            $campo = isset($log['campo']) ? $log['campo'] : 'N/A';
            $valor_anterior = isset($log['valor_anterior']) ? $log['valor_anterior'] : '';
            $valor_nuevo = isset($log['valor_nuevo']) ? $log['valor_nuevo'] : '';
            echo "    - Accion: $accion, Campo: $campo, Anterior: $valor_anterior -> Nuevo: $valor_nuevo\n";
        }
    } else {
        echo "  - ADVERTENCIA: No se encontraron registros de audit\n";
    }
    
    echo "\n=== TEST E2E COMPLETADO CON EXITO ===\n";
    echo "La tarea ID $envio_id fue creada, editada y verificada correctamente.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

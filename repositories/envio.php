<?php

function guardar_log($envio_id, $usuario_id, $accion, $campo = null, $valor_anterior = null, $valor_nuevo = null) {
    try {
        $db = conectar();
        // Use the new envio_audit table instead of envio_logs
        $stmt = $db->prepare("
            INSERT INTO envio_audit (envio_id, usuario_id, accion, campo, valor_anterior, valor_nuevo, registro)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        ");
        $stmt->execute([$envio_id, $usuario_id, $accion, $campo, $valor_anterior, $valor_nuevo]);
    } catch (Exception $e) {
        // Log error but don't fail the operation
        error_log("Error guardando log de auditoría: " . $e->getMessage());
    }
}

function list_envios($params)
{
    $db = conectar();

    // 1. Usamos el operador null coalescing (??) para evitar que pasen valores NULL a trim()
    $usuario_id = $params['usuario_id'] ?? null;
    $filtro_estados = $params["filtro_estados"] ?? "";
    $buscador = $params["buscador"] ?? "";

    $where_clauses = [];
    $execute_params = [];

    // 2. Filtro de estados (Seguro)
    if (!empty($filtro_estados)) {
        $safe_estados = preg_replace('/[^0-9,]/', '', $filtro_estados);
        if (!empty($safe_estados)) {
            // Usamos e.id o x.estado_id dependiendo de tu esquema,
            // pero mantenemos e.id para coincidir con tu INNER JOIN
            $where_clauses[] = "x.estado_id IN ($safe_estados)";
        }
    }

    // 3. Buscador corregido (Evita el error Deprecated y sincroniza parámetros)
    if (strlen(trim($buscador ?? '')) > 0) {
        $where_clauses[] = "x.descripcion LIKE ?";
        $execute_params[] = "%" . $buscador . "%";
        // Eliminamos el segundo $execute_params[] = $termino; ya que solo hay un "?"
    }

    // 4. Construcción dinámica del WHERE
    // Añadimos espacios alrededor de "AND" para evitar errores de sintaxis SQL
    if (!empty($where_clauses)) {
        $where_sql = "WHERE " . implode(" AND ", $where_clauses) . " AND x.activo = true";
    } else {
        $where_sql = "WHERE x.activo = true";
    }

    if ($where_sql === null || $where_sql === '') {
        $where_sql = "WHERE x.activo = true";
    }

    $sql_base = "
        SELECT
            x.id,
            x.registro AS envio_registro,
            x.num_envio,
            x.descripcion AS envio_descripcion,
            x.recibido,
            e.nombre AS estado_nombre,
            e.color_bg AS estado_color_bg,
            e.color_text AS estado_color_text,
            p.nombre AS prioridad_nombre,
            p.icono AS prioridad_icono,
            (SELECT COUNT(id) FROM comentario WHERE envio_id = x.id AND activo = true) AS count_comentarios,
            (SELECT COUNT(id) FROM foto WHERE envio_id = x.id AND activo = true) AS count_fotos,
            p.bg_class,
            (SELECT archivo FROM adjunto a2 WHERE a2.envio_id = x.id ORDER BY 
                CASE WHEN a2.version_timestamp IS NULL OR a2.version_timestamp = 0 THEN 1 ELSE 0 END,
                COALESCE(a2.version_timestamp, (strftime('%%s', a2.registro) * 1000)) DESC, a2.registro DESC LIMIT 1) as adjunto
        FROM
            envio x
        INNER JOIN prioridad p ON x.prioridad_id = p.id
        INNER JOIN estado e ON x.estado_id = e.id
        -- left join removed; adjunto pulled via subquery to return latest version
        %s
        ORDER BY e.orden, p.orden, x.registro
    ";

    $sql_query = sprintf($sql_base, $where_sql);

    $stmt = $db->prepare($sql_query);
    $stmt->execute($execute_params);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function siguiente_numerador($params)
{
    global $db;
    $db = conectar();
    $stmt = $db->prepare("
                                select
                                *
                                from
                                contador
                                ");
    $stmt->execute();
    $entity = $stmt->fetch(PDO::FETCH_ASSOC);
    return $entity;
}


function create_new_tarea($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                insert into envio (registro, num_envio, emisor_id,  descripcion, prioridad_id, estado_id)
                                values (?,?,?,?,?,?)
                                ");
    $stmt->execute([$params["registro"], $params["num_envio"],1 , $params["descripcion"], $params["prioridad_id"], $params["estado_id"]]);

    $envio_id = $db->lastInsertId();
    
    if ($envio_id > 0) {
        $stmt_contador = $db->prepare("
                                update contador set envio=?
                                where id = 1");
        $stmt_contador->execute([$params["envio"]]);
        
        // Log the creation
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        guardar_log($envio_id, $usuario_id, 'CREATE', 'envio', null, json_encode([
            'num_envio' => $params["num_envio"],
            'descripcion' => $params["descripcion"],
            'prioridad_id' => $params["prioridad_id"],
            'estado_id' => $params["estado_id"]
        ]));
        
        // Only insert attachment if a file was provided
        if (!empty($params["archivo"])) {
            $stmt_attach = $db->prepare("
                                    insert into adjunto (registro, envio_id, archivo)
                                    values (?,?,?)
                                    ");
            $stmt_attach->execute([$params["registro"], $envio_id, $params["archivo"]]);
        }
    }
    
    return $envio_id;
}


function get_tarea($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                select
                                t.*,
								(select inicio from tiempo where tarea_id = ? order by registro desc limit 1) as tiempo_inicio,
								(select fin from tiempo where tarea_id = ? order by registro desc limit 1) as tiempo_fin
                                from
                                tarea as t
                                where id= ?
                                ");
    $stmt->execute([$params["tarea_id"], $params["tarea_id"], $params["tarea_id"]]);
    $entity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $entity;
}

function get_envio_by_id($params)
{
    $db = conectar();
    $stmt = $db->prepare("
        SELECT e.*, p.nombre as prioridad_nombre,
        (SELECT archivo FROM adjunto a2 WHERE a2.envio_id = e.id ORDER BY COALESCE(a2.version_timestamp, (strftime('%s', a2.registro) * 1000)) DESC, a2.registro DESC LIMIT 1) as adjunto
        FROM envio e
        LEFT JOIN prioridad p ON e.prioridad_id = p.id
        WHERE e.id = ?
    ");
    $stmt->execute([$params["envio_id"]]);
    $entity = $stmt->fetch(PDO::FETCH_ASSOC);
    return $entity;
}



function edit_envio($params)
{
    global $db;
    $db = conectar();
    
    // Get current values for logging
    $stmt_select = $db->prepare("SELECT * FROM envio WHERE id = ?");
    $stmt_select->execute([$params["envio"]]);
    $current = $stmt_select->fetch(PDO::FETCH_ASSOC);
    
    if (!$current) {
        return false;
    }
    
    // Build update query based on provided parameters
    $update_fields = [];
    $update_params = [];
    
    // Handle both 'estado' and 'estado_id' parameters
    $estado = isset($params["estado_id"]) ? $params["estado_id"] : (isset($params["estado"]) ? $params["estado"] : null);
    if ($estado !== null) {
        $update_fields[] = "estado_id = ?";
        $update_params[] = $estado;
    }
    
    // Handle both 'prioridad' and 'prioridad_id' parameters
    $prioridad = isset($params["prioridad_id"]) ? $params["prioridad_id"] : (isset($params["prioridad"]) ? $params["prioridad"] : null);
    if ($prioridad !== null) {
        $update_fields[] = "prioridad_id = ?";
        $update_params[] = $prioridad;
    }
    
    if (isset($params["descripcion"])) {
        $update_fields[] = "descripcion = ?";
        $update_params[] = $params["descripcion"];
    }
    
    if (isset($params["num_envio"])) {
        $update_fields[] = "num_envio = ?";
        $update_params[] = $params["num_envio"];
    }
    
    if (empty($update_fields)) {
        return true; // Nothing to update
    }
    
    $update_params[] = $params["envio"]; // Add envio_id for WHERE clause
    
    $sql = "UPDATE envio SET " . implode(", ", $update_fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($update_params);
    
    // Log each field change
    $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
    
    if ($estado !== null && $current['estado_id'] != $estado) {
        guardar_log($params["envio"], $usuario_id, 'CHANGE_STATE', 'estado_id', $current['estado_id'], $estado);
    }
    
    if ($prioridad !== null && $current['prioridad_id'] != $prioridad) {
        guardar_log($params["envio"], $usuario_id, 'CHANGE_PRIORITY', 'prioridad_id', $current['prioridad_id'], $prioridad);
    }
    
    if (isset($params["descripcion"]) && $current['descripcion'] != $params["descripcion"]) {
        guardar_log($params["envio"], $usuario_id, 'UPDATE', 'descripcion', $current['descripcion'], $params["descripcion"]);
    }
    
    if (isset($params["num_envio"]) && $current['num_envio'] != $params["num_envio"]) {
        guardar_log($params["envio"], $usuario_id, 'UPDATE', 'num_envio', $current['num_envio'], $params["num_envio"]);
    }
    
    return true;
}

function get_envio_audit_logs($envio_id)
{
    $db = conectar();
    $stmt = $db->prepare("
        SELECT 
            ea.id,
            ea.registro,
            ea.usuario_id,
            u.nombre as usuario_nombre,
            ea.envio_id,
            ea.accion,
            ea.campo,
            ea.valor_anterior,
            ea.valor_nuevo
        FROM envio_audit ea
        LEFT JOIN usuario u ON ea.usuario_id = u.id
        WHERE ea.envio_id = ? AND ea.activo = true
        ORDER BY ea.registro DESC
    ");
    $stmt->execute([$envio_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Placeholder functions for tiempo tracking (if needed in the future)
function register_time_init($params) {
    // Placeholder - tiempo table doesn't exist yet
    return true;
}

function register_time_fin($params) {
    // Placeholder - tiempo table doesn't exist yet
    return true;
}

function tiempo_tarea($params) {
    // Placeholder - tiempo table doesn't exist yet
    return [];
}

function exists_envios($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                select count(id) as counter_envio,
                                GROUP_CONCAT(id) AS lista_ids
                                from envio
                                where recibido = 0
                                ");
    $stmt->execute([]);
    $entity = $stmt->fetch(PDO::FETCH_ASSOC);
    return $entity;
}

function save_comentario_tarea($params)
{
    $db = conectar();
    if ($params["es_nuevo"]) {
        $stmt = $db->prepare("
                                insert into comentario (registro, usuario_id, tarea_id, subtarea_id, descripcion)
                                values (?,?,?,?,?)
                                ");
        $stmt->execute([$params["registro"], $params["usuario_id"], $params["tarea_id"], $params["subtarea_id"], $params["descripcion"]]);
    } else {
        $stmt = $db->prepare("
                                update comentario set registro= ?, usuario_id=?,tarea_id=?, subtarea_id=?, descripcion=?
                                where id= ?
                                ");
        $stmt->execute([$params["registro"], $params["usuario_id"], $params["tarea_id"], $params["subtarea_id"], $params["descripcion"], $params["id"]]);
    }


    return true;
}

function comentario_by_id($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                    SELECT
                                    *
                                    from comentario
                                    where id =?
                                    limit 1
                                ");
    $stmt->execute([$params["comentario_id"]]);
    $entity = $stmt->fetch(PDO::FETCH_ASSOC);
    return $entity;
}

function delete_comentario($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                    update comentario set activo=false
                                    where id = ?
                                ");
    $stmt->execute([$params["comentario_id"]]);
    return true;
}


function elimina_envio($params)
{
    // Validate envio_id
    if (!isset($params["envio"]) || empty($params["envio"])) {
        throw new Exception("ID de envío no proporcionado");
    }
    
    $envio_id = intval($params["envio"]);
    if ($envio_id <= 0) {
        throw new Exception("ID de envío inválido");
    }
    
    $db = conectar();
    
    // Get current values for logging before deletion
    $stmt_select = $db->prepare("SELECT id, num_envio, activo FROM envio WHERE id = ?");
    $stmt_select->execute([$envio_id]);
    $current = $stmt_select->fetch(PDO::FETCH_ASSOC);
    
    if (!$current) {
        throw new Exception("Envío no encontrado");
    }
    
    $stmt = $db->prepare("DELETE FROM envio WHERE id = ?");
    $stmt->execute([$envio_id]);
    
        // Log the deletion
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        guardar_log($envio_id, $usuario_id, 'DELETE', 'envio', json_encode($current), null);
    
    return true;
}

function list_all_comentario($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                    SELECT
                                        CASE
                                            WHEN subtarea_id IS NULL THEN 'TAREA'
                                            ELSE 'SUBTAREA'
                                        END AS tipo_comentario,
                                        T1.id,
                                        T1.registro,
                                        T1.usuario_id,
                                        T1.tarea_id,
                                        T1.subtarea_id,
                                        T1.descripcion,
                                        st.num_subtarea
                                    FROM
                                        comentario AS T1
                                    left join subtarea st
                                        on T1.subtarea_id = st.id
                                    WHERE
                                        T1.tarea_id = ?
                                    AND
                                        T1.activo = true
                                    ORDER BY
                                        T1.subtarea_id asc, T1.registro DESC;
                                ");
    $stmt->execute([$params["tarea_id"]]);
    $entity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $entity;
}

function envio_recibido_ok($params)
{
    $db = conectar();
    $ids = explode(',', $params["envios_nuevos"]);
    $ids = array_map('trim', $ids);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "UPDATE envio SET recibido = 1 WHERE id IN ($placeholders)";
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($ids);
        
        // Log the change for each envio
        $usuario_id = (isset($_SESSION['user']) && isset($_SESSION['user']['id'])) ? $_SESSION['user']['id'] : null;
        foreach ($ids as $envio_id) {
            guardar_log($envio_id, $usuario_id, 'UPDATE', 'recibido', 0, 1);
        }
        
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        error_log("Error en envio_recibido_ok: " . $e->getMessage());
        return false;
    }
}











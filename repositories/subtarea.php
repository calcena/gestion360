<?php

function siguiente_numerador($params)
{
    $db = conectar();
    $stmt = $db->prepare("
                                select
                                count(id) as subtarea
                                from
                                subtarea
                                where tarea_id = ?
                                ");
    $stmt->execute([$params["tarea_id"]]);
    $entity = $stmt->fetch(PDO::FETCH_ASSOC);
    return $entity;
}

function new_subtarea($params)
{
    global $db;
    $db = conectar();
    $stmt = $db->prepare("
                                insert into subtarea (
                                tarea_id,
                                registro,
                                num_subtarea,
                                reportador_id,
                                asignacion_id,
                                titulo,
                                descripcion,
                                prioridad_id,
                                estado_id,
                                organizacion_id)
                                SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, organizacion_id
                                FROM tarea
                                WHERE id = ?
                                ");
    $stmt->execute([
        $params["tarea_id"],
        $params["registro"],
        $params["num_subtarea"],
        $params["reportador_id"],
        $params["asignacion_id"],
        $params["titulo"],
        $params["descripcion"],
        $params["prioridad_id"],
        $params["estado_id"],
        $params["tarea_id"]
    ]);

    return $db->lastInsertId();
}


function list_subtareas($params)
{
    $db = conectar();

    $usuario_id = $params['usuario_id'];
    $organizacion_id = $params['organizacion_id'];
    $filtro_estados = $params["filtro_estados"];
    $filtro_organizacion = $params["filtro_organizacion"];
    $buscador = $params["buscador"];

    $where_clauses = [];
    $execute_params = [];

    if (!empty($filtro_estados)) {
        // Sanear la entrada: Solo permitimos números y comas para seguridad.
        $safe_estados = preg_replace('/[^0-9,]/', '', $filtro_estados);
        $where_clauses[] = "e.id IN ($safe_estados)";
    }

    if ($organizacion_id > 0) {
        $where_clauses[] = "st.organizacion_id = ?";
        $execute_params[] = $organizacion_id;
    } else if ($organizacion_id == 0 && $filtro_organizacion > 0) {
        $where_clauses[] = "st.organizacion_id = ?";
        $execute_params[] = $filtro_organizacion;
    }

    if (strlen(trim($buscador)) > 0) {
        $where_clauses[] = "(st.titulo LIKE ? OR st.descripcion LIKE ?)";
        $termino = "%" . $buscador . "%";
        $execute_params[] = $termino;
        $execute_params[] = $termino;
    }


    $where_sql = '';
    if (!empty($where_clauses)) {
        // Unir todas las cláusulas con ' AND '
        $where_sql = "WHERE " . implode(" AND ", $where_clauses) . "AND st.activo = true";
    } else {
        $where_sql = "WHERE st.activo = true";
    }

    $sql_base = "
        SELECT
            st.id,
            st.registro AS tarea_registro,
            st.titulo AS tarea_titulo,
            (select num_tarea from tarea where id = st.tarea_id) || '-' || st.num_subtarea as num_subtarea,
            st.descripcion AS tarea_descripcion,
            e.nombre AS estado_nombre,
            e.color_bg AS estado_color_bg,
            e.color_text AS estado_color_text,
            p.nombre AS prioridad_nombre,
            p.icono AS prioridad_icono,
            o.nombre AS organizacion_nombre,
            o.siglas AS organizacion_siglas,
            (SELECT COUNT(id) FROM comentario WHERE subtarea_id = st.id and activo = true) AS count_comentarios,
             p.bg_class
        FROM
            subtarea st
        LEFT JOIN organizacion o ON st.organizacion_id = o.id
        INNER JOIN prioridad p ON st.prioridad_id = p.id
        INNER JOIN estado e ON st.estado_id = e.id
        -- Aquí se inserta la cláusula WHERE dinámica
        %s
        ORDER BY e.orden, p.orden, st.registro
    ";

    $sql_query = sprintf($sql_base, $where_sql);

    $stmt = $db->prepare($sql_query);
    $stmt->execute($execute_params);

    $entity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $entity;
}
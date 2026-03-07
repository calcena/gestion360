create table
    role (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre text,
        activo boolean default true
    );


create table
    usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        nombre text,
        password text,
        role_id int,
        activo boolean default true
    );

create table
    adjunto (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        envio_id int,
        archivo text,
        activo boolean default true
    );

create table
    envio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        num_envio text,
        emisor_id int,
        descripcion text,
        prioridad_id int,
        estado_id int,
        finalizado_en datetime,
        recibido boolean default false,
        activo boolean default true
    );

create table
    comentario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        envio_id int,
        usuario_id int,
        descripcion text,
        activo boolean default true
    );

create table
    estado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        nombre text,
        color_bg text,
        color_text text,
        orden int,
        activo boolean default true
    );

create table
    prioridad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        nombre text,
        icono text,
        bg_class text,
        orden int,
        activo boolean default true
    );

create table
    contador (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        envio int default 0,
        longitud_envio int default 5,
        activo boolean default true
    );

create table
    audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        accion text,
        valor_anterior text,
        valor_nuevo text,
        activo boolean default true
    );


/*
CREATE TRIGGER envio_audit AFTER
UPDATE ON tarea FOR EACH ROW WHEN
-- 2. Opcional: Solo auditar si realmente hubo un cambio.
--    (Si se actualiza el registro, pero ningún valor cambia)
OLD.registro <> NEW.registro
OR OLD.num_tarea <> NEW.num_envio
OR OLD.reportador_id <> NEW.reportador_id
OR OLD.asignacion_id <> NEW.asignacion_id
OR OLD.organizacion_id <> NEW.organizacion_id
OR OLD.titulo <> NEW.titulo
OR OLD.descripcion <> NEW.descripcion
OR OLD.prioridad_id <> NEW.prioridad_id
OR OLD.estado_id <> NEW.estado_id
OR OLD.activo <> NEW.activo BEGIN
-- 3. Insertar el registro de auditoría
INSERT INTO
    audit (
        registro,
        accion,
        valor_anterior,
        valor_nuevo,
        activo
    )
VALUES
    (
        -- Fecha y hora del evento
        DATETIME ('now'),
        -- Acción (UPDATE)
        'UPDATE_TAREA',
        -- VALOR ANTERIOR (OLD) - Serializado a JSON
        JSON_OBJECT (
            'id',
            OLD.id,
            'registro',
            OLD.registro,
            'num_tarea',
            OLD.num_tarea,
            'reportador_id',
            OLD.reportador_id,
            'asignacion_id',
            OLD.asignacion_id,
            'organizacion_id',
            OLD.organizacion_id,
            'titulo',
            OLD.titulo,
            'descripcion',
            OLD.descripcion,
            'prioridad_id',
            OLD.prioridad_id,
            'estado_id',
            OLD.estado_id,
            'activo',
            OLD.activo
        ),
        -- VALOR NUEVO (NEW) - Serializado a JSON
        JSON_OBJECT (
            'id',
            NEW.id,
            'registro',
            NEW.registro,
            'num_tarea',
            NEW.num_tarea,
            'reportador_id',
            NEW.reportador_id,
            'asignacion_id',
            NEW.asignacion_id,
            'organizacion_id',
            NEW.organizacion_id,
            'titulo',
            NEW.titulo,
            'descripcion',
            NEW.descripcion,
            'prioridad_id',
            NEW.prioridad_id,
            'estado_id',
            NEW.estado_id,
            'activo',
            NEW.activo
        ),
        -- El campo 'activo' de la tabla 'audit' se usa aquí
        1 -- O TRUE
    );

END;
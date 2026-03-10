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

create table
    envio_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registro datetime,
        usuario_id int,
        envio_id int,
        accion text, -- CREATE, UPDATE, DELETE, CHANGE_STATE, CHANGE_PRIORITY
        campo text,
        valor_anterior text,
        valor_nuevo text,
        activo boolean default true
    );

-- Trigger para auditar cambios en envio
CREATE TRIGGER envio_audit_update AFTER
UPDATE ON envio FOR EACH ROW WHEN
OLD.registro <> NEW.registro
OR OLD.num_envio <> NEW.num_envio
OR OLD.emisor_id <> NEW.emisor_id
OR OLD.descripcion <> NEW.descripcion
OR OLD.prioridad_id <> NEW.prioridad_id
OR OLD.estado_id <> NEW.estado_id
OR OLD.finalizado_en <> NEW.finalizado_en
OR OLD.recibido <> NEW.recibido
OR OLD.activo <> NEW.activo BEGIN
INSERT INTO
    envio_audit (
        registro,
        usuario_id,
        envio_id,
        accion,
        campo,
        valor_anterior,
        valor_nuevo
    )
VALUES
    (
        DATETIME ('now'),
        -- Note: usuario_id would need to be passed from application context
        -- This requires application-level logging instead of pure SQL trigger
        NULL,
        NEW.id,
        'UPDATE',
        'envio',
        JSON_OBJECT (
            'registro',
            OLD.registro,
            'num_envio',
            OLD.num_envio,
            'emisor_id',
            OLD.emisor_id,
            'descripcion',
            OLD.descripcion,
            'prioridad_id',
            OLD.prioridad_id,
            'estado_id',
            OLD.estado_id,
            'finalizado_en',
            OLD.finalizado_en,
            'recibido',
            OLD.recibido,
            'activo',
            OLD.activo
        ),
        JSON_OBJECT (
            'registro',
            NEW.registro,
            'num_envio',
            NEW.num_envio,
            'emisor_id',
            NEW.emisor_id,
            'descripcion',
            NEW.descripcion,
            'prioridad_id',
            NEW.prioridad_id,
            'estado_id',
            NEW.estado_id,
            'finalizado_en',
            NEW.finalizado_en,
            'recibido',
            NEW.recibido,
            'activo',
            NEW.activo
        )
    );

END;

-- Trigger para auditar cambios de estado en envio
CREATE TRIGGER envio_state_change AFTER
UPDATE ON envio FOR EACH ROW WHEN OLD.estado_id <> NEW.estado_id BEGIN
INSERT INTO
    envio_audit (
        registro,
        usuario_id,
        envio_id,
        accion,
        campo,
        valor_anterior,
        valor_nuevo
    )
VALUES
    (
        DATETIME ('now'),
        NULL,
        NEW.id,
        'CHANGE_STATE',
        'estado_id',
        OLD.estado_id,
        NEW.estado_id
    );

END;

-- Trigger para auditar cambios de prioridad en envio
CREATE TRIGGER envio_priority_change AFTER
UPDATE ON envio FOR EACH ROW WHEN OLD.prioridad_id <> NEW.prioridad_id BEGIN
INSERT INTO
    envio_audit (
        registro,
        usuario_id,
        envio_id,
        accion,
        campo,
        valor_anterior,
        valor_nuevo
    )
VALUES
    (
        DATETIME ('now'),
        NULL,
        NEW.id,
        'CHANGE_PRIORITY',
        'prioridad_id',
        OLD.prioridad_id,
        NEW.prioridad_id
    );

END;

-- Trigger para auditar creación de envio
CREATE TRIGGER envio_create AFTER
INSERT ON envio FOR EACH ROW BEGIN
INSERT INTO
    envio_audit (
        registro,
        usuario_id,
        envio_id,
        accion,
        campo,
        valor_anterior,
        valor_nuevo
    )
VALUES
    (
        DATETIME ('now'),
        NULL,
        NEW.id,
        'CREATE',
        'envio',
        NULL,
        JSON_OBJECT (
            'registro',
            NEW.registro,
            'num_envio',
            NEW.num_envio,
            'emisor_id',
            NEW.emisor_id,
            'descripcion',
            NEW.descripcion,
            'prioridad_id',
            NEW.prioridad_id,
            'estado_id',
            NEW.estado_id
        )
    );

END;

-- Trigger para auditar eliminación de envio
CREATE TRIGGER envio_delete AFTER
DELETE ON envio FOR EACH ROW BEGIN
INSERT INTO
    envio_audit (
        registro,
        usuario_id,
        envio_id,
        accion,
        campo,
        valor_anterior,
        valor_nuevo
    )
VALUES
    (
        DATETIME ('now'),
        NULL,
        OLD.id,
        'DELETE',
        'envio',
        JSON_OBJECT (
            'id',
            OLD.id,
            'num_envio',
            OLD.num_envio,
            'activo',
            OLD.activo
        ),
        NULL
    );

END;
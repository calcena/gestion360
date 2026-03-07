insert into role (nombre)
values ('administrador');
insert into role (nombre)
values ('gestor');
insert into role (nombre)
values ('coordinador');
insert into role (nombre)
values ('usuario');

--#######################################################
-- 0 tiene disponible todas las organizaciones
insert into usuario (nombre, password, role_id)
values('dcc', '1012', 2);
insert into usuario (nombre, password, role_id)
values('victor', 'victor9', 3);
insert into usuario (nombre, password, role_id)
values('testuser', '1234', 4);

--#######################################################

insert into estado (nombre, color_bg, color_text, orden)
values ('Pendiente','bg-danger', 'text-light', 1);
insert into estado (nombre, color_bg, color_text, orden)
values ('En curso','bg-primary', 'text-light', 2);
insert into estado (nombre, color_bg, color_text, orden)
values ('Finalizado','bg-success','text-light',5);

--#######################################################

insert into prioridad (nombre, icono, bg_class, orden)
values ('Normal','low_level.png', 'bg-white',5);
insert into prioridad (nombre, icono, bg_class, orden)
values ('Alta','medium_level.png','bg-white', 4);
insert into prioridad (nombre, icono, bg_class, orden)
values ('Urgente','high_level.png','bg-white', 3);

--#######################################################

insert into contador (envio, longitud_envio)
values(0, 5);
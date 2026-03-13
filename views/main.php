<?php
require_once '../helpers/helper.php';
require_once '../helpers/config.php';
$GLOBALS['pathUrl'] = '../';
$GLOBALS['navigation_deep'] = 0;
$GLOBALS['hide_action_menu'] = 0;
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
?>

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href="../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
  <link href="../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
  <link rel="apple-touch-icon" href="../assets/images/icons/pwa-192.png">
  <meta name="theme-color" content="#0d6efd">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Gestion360">
  <script src="../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="../services/helpers/helper.js?<?php random_file_enumerator() ?>"></script>
  <script src="../services/main/main.js?<?php random_file_enumerator() ?>"></script>
  <script src="../services/components/sitebar.js?<?php random_file_enumerator() ?>"></script>
  <script src="../services/translate/translate.js?<?php random_file_enumerator() ?>"></script>
  <script src="../services/logs/logs.js?<?php random_file_enumerator() ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <title>Gestión de Pedidos</title>
</head>

<body class="main-body" onload="initMain()">

  <!-- Top bar -->
  <div class="main-topbar d-flex justify-content-between align-items-center px-3 py-2">
    <div class="d-flex align-items-center gap-2">
      <i class="fas fa-seedling main-topbar-icon"></i>
      <span class="main-topbar-title">Gestión de Tareas</span>
    </div>
    <div class="d-flex align-items-center gap-3">
      <div class="form-check form-switch mb-0 d-flex align-items-center gap-2">
        <input class="form-check-input main-switch" type="checkbox" id="checkFinalizado" onchange="checkFinalizado()">
        <label class="form-check-label main-switch-label" for="checkFinalizado">Finalizados</label>
      </div>
      <img class="icon-menu icon-menu-inline" src="../assets/images/icons/menu.png" onclick="showLateralMenu()">
    </div>
  </div>

  <!-- Cards container -->
  <div class="container-fluid main-cards-container px-3 pt-3" id="card_main_container">
  </div>

  <?php include __DIR__ . '/components/sidebar.php'; ?>

  <!-- Action panel -->
  <div class="position-fixed start-0 top-0 h-100 bg-white shadow-lg d-flex flex-column action-panel-container"
    id="action-panel">

    <div class="action-panel-header d-flex justify-content-between align-items-center px-3 py-2">
      <span class="action-panel-title"><i class="fas fa-tasks me-2"></i>Acciones</span>
      <button type="button" class="btn-close btn-close-white" id="close-panel"></button>
    </div>

    <div class="d-flex justify-content-center gap-2 px-3 py-2">
      <span id="menu_lateral_num_envio" class="badge badge-envio"></span>
      <span id="menu_lateral_estado" class="badge"></span>
    </div>

    <div class="d-flex flex-column gap-3 p-3">
      <hr class="my-1">
      <?php if ($_SESSION['user']['role_id'] == 1 || $_SESSION['user']['role_id'] == 2): ?>
          <div class="action-panel-item" onclick="editarEnvio()">
        <img class="me-2" src="../assets/images/icons/pencil.png" width="20"> Editar tarea
      </div>
      <div class="action-panel-item" onclick="eliminarEnvio()">
        <img class="me-2" src="../assets/images/icons/papelera.png" width="20"> Eliminar tarea
      </div>
    <?php endif; ?>
    <div class="action-panel-item" onclick="gotoComentarioEnvio()">
    <img class="me-2" src="../assets/images/icons/comment.png" width="20"> Comentarios
  </div>
  <div class="action-panel-item" onclick="gotoFotoEnvio()">
    <i class="fas fa-camera me-2 action-panel-camera-icon"></i> Fotos
  </div>
  <hr class="my-1">
  <div id="estados" class="">
    <div class="status-option" onclick="changeStatus('pendiente')">
      <span class="status-dot status-dot-pendiente"></span> Pendiente
    </div>
    <div class="status-option mt-3" onclick="changeStatus('en_curso')">
      <span class="status-dot status-dot-en_curso"></span> En curso
    </div>
    <div class="status-option mt-3" onclick="changeStatus('finalizado')">
      <span class="status-dot status-dot-finalizado"></span> Finalizado
    </div>
  </div>
  </div>
  </div>

</body>

</html>
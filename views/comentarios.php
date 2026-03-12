<?php
require_once '../helpers/helper.php';
require_once '../helpers/config.php';
$GLOBALS['pathUrl'] = '../';
$GLOBALS['navigation_deep'] = 1;
$GLOBALS['hide_action_menu'] = 0;
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
$envio_id = isset($_GET['envio_id']) ? intval($_GET['envio_id']) : 0;
$num_envio = isset($_GET['num_envio']) ? $_GET['num_envio'] : '';
?>

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href="../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
  <link href="../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
  <script src="../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="../services/comentarios/comentarios.js?<?php random_file_enumerator() ?>"></script>
  <title>Comentarios - Tarea <?php echo htmlspecialchars($num_envio); ?></title>
  <style>
    .comment-card {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 12px;
      margin-bottom: 10px;
      border-left: 3px solid #2e7d32;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.85rem;
      color: #666;
    }
    .comment-text {
      font-size: 0.9rem;
      color: #333;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .comment-author {
      font-weight: 600;
      color: #2e7d32;
    }
    .comment-time {
      color: #999;
      font-size: 0.8rem;
    }
    .comment-input-area {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .no-comments {
      text-align: center;
      color: #999;
      padding: 20px;
      font-style: italic;
    }
  </style>
</head>

<body class="main-body">

  <!-- Top bar -->
  <div class="main-topbar d-flex justify-content-between align-items-center px-3 py-2">
    <div class="d-flex align-items-center gap-2">
      <span class="main-topbar-title">Comentarios - Tarea <?php echo htmlspecialchars($num_envio); ?></span>
    </div>
    <div class="d-flex align-items-center gap-3">
      <a href="main.php" class="btn btn-sm btn-primary">
        <i class="fas fa-arrow-left me-1"></i> Volver
      </a>
    </div>
  </div>

   <!-- Comentarios container -->
   <div class="container-fluid py-3 comments-container" id="comments-app" data-envio-id="<?php echo $envio_id; ?>" data-num-envio="<?php echo htmlspecialchars($num_envio, ENT_QUOTES); ?>">
    <!-- Input para nuevo comentario -->
    <div class="comment-input-area">
      <div class="mb-2">
        <textarea id="new-comment-text" class="form-control" rows="3" placeholder="Escribe tu comentario aquí..."></textarea>
      </div>
      <div class="d-flex justify-content-end">
        <button id="btn-send-comment" class="btn btn-primary btn-sm">
          <i class="fas fa-paper-plane me-1"></i> Enviar</button>
      </div>
    </div>

    <!-- Lista de comentarios -->
    <div id="comments-list">
      <div class="no-comments">Cargando comentarios...</div>
    </div>
  </div>

</body>
</body>
</html>

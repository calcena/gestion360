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
  <script>
    const envioId = <?php echo $envio_id; ?>;
    const numEnvio = '<?php echo addslashes($num_envio); ?>';
    const currentUserId = <?php echo isset($_SESSION['user']['id']) ? intval($_SESSION['user']['id']) : 0; ?>;
  </script>
  <script src="../services/envios/comentario.js?<?php random_file_enumerator() ?>"></script>
  <script src="../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <title>Comentarios - Tarea <?php echo htmlspecialchars($num_envio); ?></title>
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
  <div class="container-fluid py-3 comments-container">
    <!-- Input para nuevo comentario -->
    <div class="comment-input-area">
      <div class="mb-2">
        <textarea id="new-comment-text" class="form-control" rows="3"
          placeholder="Escribe tu comentario aquí..."></textarea>
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
</body>

</html>
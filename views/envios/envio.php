<?php
require_once '../../helpers/helper.php';
require_once '../../helpers/config.php';
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
$modo = $_GET['modo'];
$envio_id = $_GET['envio_id'] ?? null;
$navigation_deep = 2;
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta http-equiv='cache-control' content='no-cache'>
    <meta http-equiv='expires' content='0'>
    <meta http-equiv='pragma' content='no-cache'>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="../../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="../../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
    <link rel="apple-touch-icon" href="<?php echo get_app_base_path(); ?>assets/images/icons/pwa-192.png">
    <meta name="theme-color" content="#0d6efd">
    <meta name="mobile-web-app-capable" content="yes">
    <script src="../../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/helpers/helper.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/components/sitebar.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/envios/envio.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/translate/translate.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/logs/logs.js?<?php random_file_enumerator() ?>"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <title><?php echo ($modo === 'edit' ? 'Editar' : 'Nueva') . ' Tarea - ' . APP_NAME ?></title>
</head>

<body>
    <!-- Top bar -->
    <div class="main-topbar d-flex justify-content-between align-items-center px-3 py-2">
        <div class="d-flex align-items-center gap-2">
            <span class="main-topbar-title"><?php echo ($modo === 'edit' ? 'Editar Tarea' : 'Nueva Tarea'); ?></span>
        </div>
        <div class="d-flex align-items-center gap-2">
        </div>
    </div>

    <div class="container mt-4">
        <!-- Número de tarea -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title"><span id="num_envio_display">-</span></h5>
                    </div>
                </div>
            </div>
        </div>

        <!-- Descripción -->
        <div class="row mb-3">
            <div class="col-12">
                <label for="envio_descripcion" class="form-label fw-bold">Descripción</label>
                <textarea id="envio_descripcion" class="form-control" rows="5" placeholder="Describe la tarea..."></textarea>
            </div>
        </div>

        <!-- Prioridad, Adjunto y Estado -->
        <div class="row mb-3">
            <div class="col-6 col-md-6 d-flex flex-column justify-content-center">
                <label for="select_prioridad_accion" class="form-label fw-bold">Prioridad</label>
                <select class="form-select" id="select_prioridad_accion">
                    <option value="1">Normal</option>
                    <option value="2">Alta</option>
                    <option value="3">Urgente</option>
                </select>
            </div>
            <div class="col-6 col-md-6">
                <label class="form-label fw-bold">Documento Adjunto</label>
                <div class="d-flex justify-content-center gap-2 align-items-center">
                    <input type="file" id="file_input" class="d-none" accept="application/pdf">
                    <img src="../../assets/images/icons/upload.png"
                         id="pdf_icon_input"
                         alt="Adjuntar PDF"
                         style="cursor: pointer; width: 32px; height: 32px;"
                         onclick="document.getElementById('file_input').click()">
                    <?php if ($modo == "edit"): ?>
                    <button type="button" class="btn btn-outline-danger btn-sm" id="btn_delete_attach">
                        <i class="fas fa-trash"></i>
                    </button>
                    <?php endif; ?>
                </div>
                <small class="text-muted d-none d-md-block">Solo PDF</small>
            </div>
            <?php if ($modo == "edit"): ?>
            <div class="col-12 col-md-12 mt-2 mt-md-0">
                <label for="select_status_accion" class="form-label fw-bold">Estado</label>
                <select class="form-select" id="select_status_accion">
                    <option value="1">Pendiente</option>
                    <option value="2">En curso</option>
                    <option value="3">Finalizado</option>
                </select>
            </div>
            <?php endif; ?>
        </div>

        <!-- Botones de acción -->
        <div class="row mt-4">
            <div class="col-6 d-grid">
                <button type="button" class="btn btn-secondary btn-lg" onclick="cancelAction()">
                    <i class="fas fa-times me-2"></i>Cancelar
                </button>
            </div>
            <div class="col-6 d-grid">
                <button type="button" class="btn btn-primary btn-lg" onclick="saveAction()">
                    <i class="fas fa-save me-2"></i>Guardar
                </button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="container footer-location text-center mt-4">
        <?php
        $source = 'main';
        include_once("../components/footer.php");
        ?>
    </div>

    <?php include __DIR__ . '/../components/sidebar.php'; ?>
</body>

</html>

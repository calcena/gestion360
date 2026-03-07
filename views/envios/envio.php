<?php
require_once '../../helpers/helper.php';
require_once '../../helpers/config.php';
$GLOBALS['pathUrl'] = '../../';
$GLOBALS['navigation_deep'] = 1;
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
$modo = $_GET['modo'];
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv='cache-control' content='no-cache'>
    <meta http-equiv='expires' content='0'>
    <meta http-equiv='pragma' content='no-cache'>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="../../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
    <link href="../../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
    <script src="../../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/helpers/helper.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/components/sitebar.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/envios/envio.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/translate/translate.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/logs/logs.js?<?php random_file_enumerator() ?>"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <title><?php echo APP_NAME . '_' . APP_VERSION ?></title>
</head>

<body onload="initEnvios()" data-mode="<?php echo htmlspecialchars($modo, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="container">
        <div class="row mt-2">
            <div class="col-12 d-flex justify-content-center">
                <h3 id="num_envio" class="text-primary"></h3>
            </div>
        </div>
        <div class="row">
            <div class="row">
                <div class="col-12">
                    <label for="">Descripción</label>
                    <textarea id="envio_descripcion" class="form-control" type="text" rows="4"></textarea>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col d-flex justify-content-around">
                <img id="img_delete" style="height: 2rem" src="../../assets/images/icons/papelera.png" alt=""
                    onclick="deleteAttachFile()">
                <input type="file" id="file_input" style="display: none;" accept="application/pdf">
                <img id="img_attach" style="height: 2.3rem;" src="../../assets/images/icons/upload.png" alt=""
                    onclick="attachFile()">
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-3 w-50">
                <label for="" class="form-label">Prioridad</label>
                <select class="form-select acciones-contextual" name="" id="select_prioridad_accion"
                    onchange="changePriority(this.value)">
                    <option value="1">Normal</option>
                    <option value="2">Alta</option>
                    <option value="3">Urgente</option>
                </select>
            </div>
            <div class="col-3 w-50">
                <?php
                if ($modo == "edit") {
                    echo '<label for="" class="form-label">Estado</label>
                <select class="form-select acciones-contextual" name="" id="select_status_accion"
                    onchange="changeState(this.value)">
                    <option value="1">Pendiente</option>
                    <option value="2">En curso</option>
                    <option value="3">Finalizado</option>
                </select>';
                }
                ?>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-12 d-flex justify-content-around">
                <img class="icon-table" src="../../assets/images/icons/cancelar.png" alt="" onclick="cancelAction()">
                <img class="icon-table " src="../../assets/images/icons/save.png" alt="" onclick="saveAction()">
            </div>
        </div>
    </div>
    <div class="container footer-location text-center">
        <?php
        $source = 'main';
        include_once("../components/footer.php"); ?>
    </div>
    <?php include __DIR__ . '/../components/sidebar.php'; ?>
</body>

</html>
<?php
require_once '../../helpers/helper.php';
require_once '../../helpers/config.php';
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);

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
    <link rel="stylesheet" href="../../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="../../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
    <link rel="apple-touch-icon" href="<?php echo get_app_base_path(); ?>assets/images/icons/pwa-192.png">
    <meta name="theme-color" content="#0d6efd">
    <meta name="mobile-web-app-capable" content="yes">
    <script src="../../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/helpers/helper.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/components/sitebar.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/comentarios/comentario.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/translate/translate.js?<?php random_file_enumerator() ?>"></script>
    <script src="../../services/logs/logs.js?<?php random_file_enumerator() ?>"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body>
    <div class="container">
        <div class="row tabla-comentarios">
            <div class="col-12">
                <table class="table table-responsive">
                    <thead class="bg-secondary text-light">
                        <th></th>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th></th>
                    </thead>
                    <tbody id="tbody_comentarios">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <hr>
    <div class="container">
        <div class="row">
            <div class="col">
                <select class="form-select" name="" id="selector_subtarea">
                </select>
            </div>
        </div>
        <div class="row mt-1">
            <div class="col">
                <textarea id="comentario_descripcion" class="form-control" type="text" rows="4"></textarea>
            </div>
        </div>
        <hr>
         <div class="row mt-2">
            <div class="col-12 d-flex justify-content-around">
                <img class="icon-table" src="../../assets/images/icons/cancelar.png" alt="">
                <img class="icon-table " src="../../assets/images/icons/save.png" alt="">
            </div>
        </div>
    </div>
</body>

</html>
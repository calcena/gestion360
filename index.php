<?php
require_once __DIR__ . '/helpers/config.php';
require_once __DIR__ . '/helpers/helper.php';
$GLOBALS['pathUrl'] = '';
exit_session();
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
$_SESSION['base_project'] = dirname(__FILE__);
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
    <link href="assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
    <link href="assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
    <link rel="manifest" href="<?php echo $GLOBALS['pathUrl']; ?>manifest.json">
    <link rel="apple-touch-icon" href="<?php echo $GLOBALS['pathUrl']; ?>assets/images/icons/pwa-192.png">
    <meta name="theme-color" content="#0d6efd">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Gestion360">
    <script src="assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
    <script src="services/logs/logs.js?<?php random_file_enumerator() ?>"></script>
    <script src="services/translate/translate.js?<?php random_file_enumerator() ?>"></script>
    <script src="services/login/pwa.js?<?php random_file_enumerator() ?>"></script>
    <script src="services/login/login.js?<?php random_file_enumerator() ?>"></script>
    <title><?php echo APP_NAME . '_' . APP_VERSION ?></title>
</head>

<body>
    <div class="container">
        <div class="login-container">
            <div id="output"></div>
            <div><img class="avatar" src="./assets/images/logo.png?<?php random_file_enumerator() ?>" /></div>
            <div class="form-box">
                <input id="username" name="user" type="text" placeholder="Usuario">
                <input id="pass" name="pass" type="password" placeholder="Contraseña">
                <button id="btn_acceder" class="btn login-button btn-block login btn-acceder">
                    Acceder
                </button>
            </div>
            <span id="warn_credentials" class="mt-3 d-none text-danger fw-bolder"></span>
        </div>
    </div>
    <div class="container text-center">
        <div class="mensaje-login" id="mensaje"></div>
    </div>
    <div class="container footer-location text-center">
        <?php
        $source = '';
        include_once("./views/components/footer.php");
        ?>
    </div>
</body>

</html>
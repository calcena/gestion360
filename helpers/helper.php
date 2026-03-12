<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Polyfill for getallheaders
if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            } elseif ($name === 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($name === 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

function random_file_enumerator()
{
    $number = rand(1, 10000000000);
    echo $number;
}

function exit_session()
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_unset();
        session_destroy();
    }
}

function get_session_status()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function get_app_base_path()
{
    // Find the project root directory (where index.php resides)
    $dir = __DIR__;
    $max_iterations = 10;
    $iterations = 0;
    while (!file_exists($dir . '/index.php') && $dir != dirname($dir) && $iterations < $max_iterations) {
        $dir = dirname($dir);
        $iterations++;
    }
    
    // Convert filesystem path to URL path relative to document root
    $doc_root = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $dir = str_replace('\\', '/', realpath($dir));
    $doc_root = str_replace('\\', '/', realpath($doc_root));
    
    if ($dir && $doc_root && strpos($dir, $doc_root) === 0) {
        $url_path = substr($dir, strlen($doc_root));
        $url_path = str_replace('\\', '/', $url_path);
        $url_path = trim($url_path, '/');
        if ($url_path === '') {
            return '/';
        }
        return '/' . $url_path . '/';
    }
    
    // Fallback: detect from SCRIPT_NAME
    $script_name = $_SERVER['SCRIPT_NAME'] ?? '';
    $script_dir = dirname($script_name);
    if ($script_dir === '/' || $script_dir === '\\' || $script_dir === '.') {
        return '/';
    }
    return $script_dir . '/';
}

function debug_mode()
{
    if (APP_ENV == "local" || APP_ENV == "dev") {
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    }
}

function show_envoironment_message()
{
    if (APP_ENV == "local") {
        echo '<div class="container">';
        echo '<div class="bg-primary">';
        echo '<h2 class="env-banner">Entorno LOCAL</h2>';
        echo '</div>';
        echo '</div>';
    }
    if (APP_ENV == "qa" || APP_ENV == "dev") {
        echo '<div class="container">';
        echo '<div class="bg-danger">';
        echo '<h2 class="env-banner">Entorno de DESARROLLO/QA</h2>';
        echo '</div>';
        echo '</div>';
    }
}

function new_guui_generator()
{
    $bytes = random_bytes(16);
    $bytes[6] = chr(ord($bytes[6]) & 0x0f | 0x40);
    $bytes[8] = chr(ord($bytes[8]) & 0x3f | 0x80);
    $hex = bin2hex($bytes);
    return sprintf(
        '%08s-%04s-%04s-%04s-%12s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function check_security()
{
    if (!isset($_SESSION['user'])) {
        header('Location: /index.php');
        exit;
    }
}

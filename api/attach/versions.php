<?php
$root = dirname(dirname(__DIR__));
require_once $root . '/helpers/config.php';
require_once $root . '/database/DatabaseConnection.php';
header('Content-Type: application/json');

$input = [];
// Accept JSON body or form data
$raw = file_get_contents('php://input');
if ($raw) {
    $j = json_decode($raw, true);
    if (is_array($j)) $input = $j;
}

if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}

$envio_id = null;
if (isset($input['data']) && isset($input['data']['envio_id'])) {
    $envio_id = intval($input['data']['envio_id']);
} elseif (isset($input['envio_id'])) {
    $envio_id = intval($input['envio_id']);
} elseif (isset($_GET['envio_id'])) {
    $envio_id = intval($_GET['envio_id']);
}

if (!$envio_id) {
    echo json_encode(['success' => false, 'message' => 'envio_id requerido']);
    exit;
}

try {
    $db = conectar();
    $stmt = $db->prepare('SELECT id, registro, archivo, version_timestamp FROM adjunto WHERE envio_id = ? ORDER BY COALESCE(version_timestamp, (strftime(\'%s\', registro) * 1000)) DESC, registro DESC');
    $stmt->execute([$envio_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

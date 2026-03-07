<?php
// 1. Encabezados de limpieza y acceso
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/xml; charset=UTF-8");

$url = "https://www.aemet.es/xml/municipios_h/localidad_h_08030.xml";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
// Forzamos a que cURL no intente convertir la codificación automáticamente
curl_setopt($ch, CURLOPT_ENCODING, '');

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
} else {
    // 2. Reparar caracteres mal formados antes del echo
    // Convertimos de ISO-8859-1 (que suele usar AEMET en XML) a UTF-8
    $response = mb_convert_encoding($response, 'UTF-8', 'ISO-8859-1');

    // 3. Eliminar posibles espacios en blanco al inicio para evitar errores de parseo
    echo trim($response);
}

curl_close($ch);
?>
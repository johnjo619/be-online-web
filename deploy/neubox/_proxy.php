<?php
/**
 * Proxy mismo-origen para Be Online en Neubox. Replica los location de nuestro
 * nginx para que la web (mismo build que en el servidor propio) funcione sin
 * CORS ni problemas de X-Frame. Upstreams FIJOS: no es un proxy abierto.
 */
// El catalogo SEPOMEX ya NO es un tercero: lo servimos nosotros desde el disco
// de `front` (32,292 CPs del archivo oficial de Correos de Mexico), y
// beonline.celink.mx lo expone en la MISMA ruta. El proveedor gratuito
// sepomex.nitrostudio.com.mx se cayo el 2026-07-09 y estuvo devolviendo 502
// sin que nadie se enterara: `lookupCp` es fail-silent, asi que la unica senal
// era que la captura de direccion dejo de autocompletar estado, ciudad y
// colonia — en una tienda que cobra con Stripe live.
$MAP = [
    '/api-proxy/'     => 'https://api-crm.igou.mx/',
    '/map-proxy/'     => 'https://api-crm.igou.mx/map/',
    '/map-api/'       => 'https://api-crm.igou.mx/map-api/',
    '/sepomex-proxy/' => 'https://beonline.celink.mx/sepomex-proxy/',
];
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$base = null; $rest = '';
foreach ($MAP as $prefix => $up) {
    if (strncmp($uri, $prefix, strlen($prefix)) === 0) { $base = $up; $rest = substr($uri, strlen($prefix)); break; }
}
if ($base === null) { http_response_code(404); exit('proxy: ruta no permitida'); }
$target = $base . ltrim($rest, '/');

$ch = curl_init($target);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_ENCODING       => '',            // curl descomprime gzip
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
]);
$fwd = [];
foreach (['platform','odoocompanyid','authorization','accept','x-requested-with'] as $h) {
    $k = 'HTTP_' . strtoupper(str_replace('-','_',$h));
    if (isset($_SERVER[$k])) $fwd[] = $h . ': ' . $_SERVER[$k];
}
if (!empty($_SERVER['CONTENT_TYPE'])) $fwd[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
curl_setopt($ch, CURLOPT_HTTPHEADER, $fwd);
if (in_array($method, ['POST','PUT','PATCH','DELETE'], true)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}
$resp = curl_exec($ch);
if ($resp === false) { http_response_code(502); exit('proxy: error upstream'); }
$hsize  = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$rawh   = substr($resp, 0, $hsize);
$body   = substr($resp, $hsize);
curl_close($ch);
http_response_code($status);
foreach (explode("\r\n", $rawh) as $line) {
    if (stripos($line, 'Content-Type:')  === 0) header($line, true);
    if (stripos($line, 'Cache-Control:') === 0) header($line, true);
    if (stripos($line, 'Set-Cookie:')    === 0) header($line, false);
    // X-Frame-Options NO se reenvia: el mapa queda mismo-origen y embebible.
}
echo $body;

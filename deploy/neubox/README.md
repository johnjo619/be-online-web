# Deploy de beonline.mx en Neubox (hosting cPanel WordPress reemplazado)

`beonline.mx` (apex) vive en hosting cPanel de Neubox, NO en nuestra infra. Este folder tiene
los artefactos para servir la tienda Astro ahí, replicando los proxies de nuestro nginx con PHP.

## Archivos
- `_proxy.php` → va en `public_html/_proxy.php`. Proxy mismo-origen a api-crm.igou.mx + sepomex.
- `htaccess.txt` → va en `public_html/.htaccess`. Rewrite de los puentes + no-cache HTML + 404.

## Deploy
1. `npm run build` (build normal, mismo-origen — usa /api-proxy).
2. Subir `dist/*` por FTPS (ftp.beonline.mx:21, cuenta FTP con dir `public_html`) a `public_html/`.
3. Subir `_proxy.php` y `.htaccess`.
4. NO tocar `public_html/.well-known/` (SSL) ni `_wp_backup_*` (WordPress viejo).
5. Verificar `https://beonline.mx/` PELONA (caché AccelerateWP).

Detalle completo en la memoria `project_beonline_mx_deploy_neubox_wordpress_2026-08-18`.

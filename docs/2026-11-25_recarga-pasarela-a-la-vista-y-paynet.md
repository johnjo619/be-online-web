# /recarga/: lo que aparece al elegir la pasarela queda a la vista, y PayNet no es OXXO (25-nov-2026)

Mismo arreglo que pandamovil.mx (Celinkmx/pandamovil-web#133, publicado el 25-nov), pedido por el dueño para Be Online.

## Formulario a la vista

En el celular, al tocar una pasarela, lo que aparece (formulario de tarjeta, ficha de PayNet, «cargando», error) se
dibujaba DEBAJO de la lista de pasarelas, fuera de la pantalla, y la página no bajaba: el cliente sólo veía la
palomita. En pandamovil.mx (mismo componente) el formulario empezaba 154 px abajo del borde en iPhone 14 y Pixel 7.

`src/components/react/wizard/PaymentStep.tsx`: lo que aparece vive en una zona de pago (`data-zona-pago`); al elegir,
si no asoma al menos 120 px (`ASOMO_MINIMO_PX`), la página baja hasta ella debajo de la barra fija (`scroll-mt-24`).
Sin animación si el teléfono pide menos movimiento; si ya se veía, no se mueve. Nada preseleccionado y el foco no
entra a los campos de tarjeta.

## PayNet no es OXXO

Be Online SÍ tiene PayNet (`openpayStore`, la cuenta de Openpay): su referencia se paga en 7-Eleven, Walmart,
Farmacias del Ahorro, Soriana, Chedraui y otras de su red, nunca en OXXO. El logo ya se corrigió en #16; faltaba:

- Subtítulo del selector: «Pago en efectivo» → «7-Eleven, Walmart y más · 24-48 h» (sin cortes de renglón).
- Ficha (`OxxoReference`): caía en «Paga en OXXO · Acude a cualquier tienda OXXO» cuando el backend no mandaba su
  lista (en `/recarga/` no la manda) y en la tienda se titulaba «Pago en OXXO». Ahora exige `tienda: 'oxxo' |
  'paynet'` sin valor por omisión, con los textos de app_web.
- El error de init de PayNet ya no dice «OXXO».

## Pruebas

`tests/e2e/recarga.spec.ts`, bloque «lo que se elige se ve»: Tarjeta y PayNet a la vista en el celular, la página no
se mueve si ya se ve (escritorio alto) y PayNet sin OXXO. Con el código anterior fallan las dos de PayNet; la de
Tarjeta pasa también sin el arreglo porque en las pruebas el SDK de Stripe está bloqueado y el formulario no ocupa
lugar (el comportamiento real se verificó en iPhone y Pixel sobre el build). Suite completa: fallan sólo las 4 de
`tienda.spec.ts` que ya fallaban en la base (ver #16).

## Publicar

Va encima de #16 (y éste de `deploy/neubox-tarjeta`): se publica todo junto en Neubox por FTPS (`npm run build` y
subir `dist/*` a `public_html/` conservando `_proxy.php`, `.htaccess`, `.well-known/` y `_wp_backup_*`; verificar la
home pelona por la caché de AccelerateWP). Falta una cuenta FTP de Neubox que funcione.

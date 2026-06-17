# Plan — Estructura completa sitio Be Online (Astro)

**Fecha:** 2026-05-05
**Proyecto:** [sitios-web/pandamovil/](../../) (Astro 4.16, React 18, Tailwind 3)
**Estado base:** Fase 1 (View Transitions + `/telefonia-movil`) ya ejecutada y aprobada.

## 1. Contexto y decisiones

### Por que esta expansion
El sitio se vuelve hibrido multi-page con efecto one-page (View Transitions ya activo). Aprovechamos para reorganizar el menu, completar el flujo de contratacion conectado al ecommerce CRM, portar los flujos de portabilidad/recarga del portal cautivo y completar el footer con todas las paginas legales que regulacion exige.

### Decisiones tomadas (por el usuario)
| # | Decision | Eleccion |
|---|---|---|
| 1 | Inventario CRM listo | **Telefonia + Internet hogar + MiFi** — los 3 servicios contratables |
| 2 | Recarga + Portabilidad | **Reusar `/activar/`** (ya tiene wizard ICCID + SelectFlow funcionando) |
| 3 | Mapa cobertura | **iframe a `api.celink.mx/map/pandamovil`** (MVP rapido, migrable despues a componente nativo) |
| 4 | URLs apps moviles | Usuario las pasa antes de implementar el footer |

## 2. Estructura final del sitio

### Menu superior
```
[Logo Panda]   Servicios▾   Contrata   Cobertura   Activar/Recargar   FAQ        [Comprar Plan]
                  │
                  ├── Telefonia Movil      → /telefonia-movil
                  ├── Internet en Casa     → /internet-en-casa
                  └── Internet Portatil    → /internet-portatil
```

- "Servicios" es dropdown — hover en desktop, accordion en mobile
- "Tienda" se renombra a **"Contrata"** y apunta a `/contrata` (era `/tienda/`)
- "Cobertura" deja de ser anchor `/#cobertura`, pasa a pagina `/cobertura`
- "FAQ" sigue como anchor del index (no necesita pagina propia por ahora)
- CTA "Comprar Plan" sigue, lleva a `/contrata`

### Mapa de paginas
| Ruta | Tipo | Estado | Contenido principal |
|---|---|---|---|
| `/` | Landing | Existe (refactor en Fase 3) | Hero, social proof, service cards, FAQ, CTA |
| `/telefonia-movil` | Servicio | **Existe (Fase 1)** | PlanSelector + FAQ |
| `/internet-en-casa` | Servicio | **Crear** | HBBSelector + FAQ |
| `/internet-portatil` | Servicio | **Crear** | MiFi + planes + FAQ |
| `/contrata` | Flujo compra | **Refactor** de `/tienda/` | Wizard nuevo: servicio → device → plan → portabilidad? → datos → pago → confirmacion |
| `/activar` | Flujo activa/recarga/porta | **Existe — restyle** | Wizard ICCID + SelectFlow (ya funciona) con diseno nuevo |
| `/cobertura` | Servicio | **Crear** | iframe full-height a `api.celink.mx/map/pandamovil` |
| `/portabilidad` | Atajo | **Crear** | Redirect 302 → `/activar?flow=portar` |
| `/recarga` | Atajo | **Crear** | Redirect 302 → `/activar?flow=recargar` |
| Legales nuevas | Estaticas | **Crear** | Tarifas registradas, Codigo practicas, PUJ, Colaboracion seguridad |
| `/descarga-app` | Estatica | **Crear** | App Store + Play Store badges, screenshots |

## 3. Fases de ejecucion

### Fase 2 — Servicios restantes (continua de la aprobada)
**Objetivo:** completar las 3 paginas de servicios + cobertura.

| Paso | Archivo | Reusa |
|---|---|---|
| 2.1 | Crear [src/pages/internet-en-casa.astro](../../src/pages/internet-en-casa.astro) | `HBBSelector.tsx` |
| 2.2 | Crear [src/pages/internet-portatil.astro](../../src/pages/internet-portatil.astro) | `MiFi.astro` + `PlanSelector` (filtrado a planes MiFi) |
| 2.3 | Crear [src/pages/cobertura.astro](../../src/pages/cobertura.astro) | iframe `https://api.celink.mx/map/pandamovil` (height 80vh, sin bordes) |
| 2.4 | Update [Header.astro](../../src/components/astro/Header.astro): menu Servicios dropdown | — |

### Fase 3 — Footer completo (alta prioridad legal)
**Objetivo:** footer con TODAS las secciones que regulacion IFT exige + branding.

Estructura final del Footer:
```
┌──────────────────────────────────────────────────────────────┐
│ Logo + tagline                                               │
│                                                               │
│ Apps moviles:  [App Store badge]  [Play Store badge]         │
│                                                               │
├── divider ──────────────────────────────────────────────────┤
│ Legales:                                                     │
│   - Aviso de privacidad           → /aviso-de-privacidad     │
│   - Carta de Derechos Minimos     → /carta-derechos-arco     │
│   - Colaboracion Seguridad/Just.  → /colaboracion-seguridad  │
├── divider ──────────────────────────────────────────────────┤
│ Regulatorios:                                                │
│   - Tarifas registradas           → /tarifas-registradas     │
│   - Codigo de practicas comerc.   → /codigo-practicas        │
│   - Terminos y condiciones        → /terminos-y-condiciones  │
│   - Politica de uso justo (PUJ)   → /politica-uso-justo      │
├── divider ──────────────────────────────────────────────────┤
│ Social media:                                                │
│   [FB] [IG] [YT] [TT]   "¿Quieres un amigo panda?"          │
├── divider ──────────────────────────────────────────────────┤
│ Descarga nuestra app  [App Store]  [Play Store]              │
│                                                               │
│ © 2026 Panda Movil — Operado por Celink Telecom              │
└──────────────────────────────────────────────────────────────┘
```

| Paso | Archivo | Accion |
|---|---|---|
| 3.1 | [Footer.astro](../../src/components/astro/Footer.astro) | Reescribir con la estructura completa, divisores visibles, letras pequenas (`text-xs`), agregar YouTube SVG |
| 3.2 | Crear `src/pages/colaboracion-seguridad.astro` | Texto regulatorio (lo proporcionas o tomamos plantilla IFT) |
| 3.3 | Crear `src/pages/tarifas-registradas.astro` | Tabla con tarifas registradas ante IFT (link a doc IFT o PDF en `assets/pdf/`) |
| 3.4 | Crear `src/pages/codigo-practicas.astro` | Texto regulatorio del Codigo de Practicas Comerciales |
| 3.5 | Crear `src/pages/politica-uso-justo.astro` | Texto PUJ (gigas, throttling, etc.) |
| 3.6 | Crear `src/pages/descarga-app.astro` | Hero + badges + screenshots + features |
| 3.7 | Agregar a `src/data/` (nuevo `social.ts` y `apps.ts`) | URLs centralizados |

### Fase 4 — Refactor `/contrata` (flujo unificado de compra)
**Objetivo:** wizard que cubra los 3 servicios + portabilidad opcional.

Pasos del nuevo wizard en `/contrata`:
```
Step 0  → Selector de servicio (3 cards: Telefonia / Internet hogar / Internet portatil)
Step 1  → Sub-seleccion segun servicio:
            - Telefonia      → SIM o eSIM
            - Internet hogar → solo modem (sin sub-tipo)
            - Internet port. → MiFi device
Step 2  → Plan picker (filtrado por servicio + tipo SIM)
            usa /api/public/ecommerce/plans?family={Movilidad|HBB|MiFi}
Step 3  → ¿Portar numero?  (solo si Telefonia)
            checkbox + si SI: campo NIP 4 digitos + MSISDN actual
Step 4  → Datos cliente (nombre, email, telefono, [direccion si SIM fisica o modem o MiFi])
Step 5  → Selector gateway (Stripe / OXXO via OpenPay / MercadoPago)
Step 6  → Pago inline o redirect
Step 7  → Confirmacion (fetch /orders/{uuid}/status — ICCID, dn, link eSIM si aplica)
```

| Paso | Archivo | Accion |
|---|---|---|
| 4.1 | Crear `src/pages/contrata.astro` (clon de `tienda/index.astro`) | Reusar layout, importar nuevo wizard |
| 4.2 | Refactor `src/components/react/TiendaFlow.tsx` → renombrar a `ContratacionFlow.tsx` | Agregar Step 0 (servicio) + Step 3 (portabilidad opcional) + Step 7 (confirmacion completa) |
| 4.3 | Update `src/lib/api.ts` | Aceptar `family_type` parametrizado en `getPlans` y agregar `portability_nip` al payload de `createOrder` |
| 4.4 | Crear redirect `src/pages/tienda/index.astro` → 301 a `/contrata` | Mantener compatibilidad con anuncios viejos |
| 4.5 | Update [Header.astro](../../src/components/astro/Header.astro) | "Tienda" → "Contrata" |

**Endpoints CRM a usar (ya documentados):**
- `GET /api-proxy/api/public/ecommerce/plans?family_type=Panda&type=Movilidad` — listar planes
- `POST /api-proxy/api/public/ecommerce/orders` — crear orden con `{customer_*, items[], payment_method, portability_nip?}`
- `GET /api-proxy/api/public/ecommerce/orders/{uuid}/status` — confirmacion final
- `POST /api-proxy/api/ecommerce/{stripe|mercadopago|openpay}/init` con `{order_uuid}` — iniciar pago

### Fase 5 — Restyle `/activar` (Recarga + Portabilidad)
**Objetivo:** la pagina actual `/activar/` ya tiene el wizard funcional (ICCID → SelectFlow → activar/recargar/portar/cambiar_nir). Solo le aplicamos el diseno del sitio nuevo.

| Paso | Archivo | Accion |
|---|---|---|
| 5.1 | Auditar [src/pages/activar/index.astro](../../src/pages/activar/index.astro) y su `ActivationWizard` | Listar componentes que usa |
| 5.2 | Adaptar visuales (colores panda-red, fonts Unbounded/Poppins, Cards con shadow consistente) | Sin tocar logica — solo classes Tailwind |
| 5.3 | Crear `src/pages/recarga.astro` y `src/pages/portabilidad.astro` | Redirect 302 a `/activar?flow=recargar` y `?flow=portar` (cliente JS lee query param y salta al SelectFlow correcto) |
| 5.4 | Update `ActivationWizard` para leer `?flow=` del URL y pre-seleccionar accion | Pequeno useEffect inicial |
| 5.5 | Update [Header.astro](../../src/components/astro/Header.astro) | Cambiar "Activar" → "Activar / Recargar" |

**Nota importante:** los endpoints del wizard de activar (`page/getMsisdnBy`, `page/portabilidad`, `page/portabilidadState`) son DIFERENTES a los del ecommerce de `/contrata`. Son los del portal cautivo. El proxy `/api-proxy` ya apunta a `api.celink.mx` que sirve ambos.

### Fase 6 — Refactor home `/`
**Objetivo:** el index deja de ser one-page con todo, pasa a landing real.

| Paso | Archivo | Accion |
|---|---|---|
| 6.1 | [index.astro](../../src/pages/index.astro) | Quitar PlanSelector, InternetCasa, MiFi, Portabilidad (ya estan en su pagina). Mantener Hero, SocialProof, HowItWorks, Advantages, FAQ, DownloadApp, CtaFinal |
| 6.2 | Crear `src/components/astro/ServiceCards.astro` (4 cards grandes) | Telefonia / Internet hogar / Internet portatil / Portabilidad → linkean a su pagina |
| 6.3 | Insertar ServiceCards entre HeroBanner y SocialProof | Reemplaza visualmente el PlanSelector como "punto de entrada" |

## 4. Banner del home (DynamicBanner) — ya conectado al CRM

**Estado actual (verificado):**
- [DynamicBanner.tsx](../../src/components/react/DynamicBanner.tsx) ya consume `/api-proxy/api/page/banners/?company_id=1&section=top&limit=5`
- Rota cada 6s, dismissible (sessionStorage `panda-banner-dismissed`), setea `--banner-h` para offset del Header
- Se gestiona desde el CRM en la tabla de banners de Odoo (modulo Page Banners)

**Mejoras sugeridas (Fase 7, opcional):**
- Soporte para `section=hero` adicional (banner debajo del hero)
- Webhook para invalidar cache (hoy requiere refresh)
- Programacion por fecha de inicio/fin (si el CRM ya lo soporta verificar y exponerlo)

## 5. Archivos criticos

### A crear
| Archivo | Fase |
|---|---|
| `src/pages/internet-en-casa.astro` | 2 |
| `src/pages/internet-portatil.astro` | 2 |
| `src/pages/cobertura.astro` | 2 |
| `src/pages/colaboracion-seguridad.astro` | 3 |
| `src/pages/tarifas-registradas.astro` | 3 |
| `src/pages/codigo-practicas.astro` | 3 |
| `src/pages/politica-uso-justo.astro` | 3 |
| `src/pages/descarga-app.astro` | 3 |
| `src/data/social.ts` (URLs FB/IG/YT/TT) | 3 |
| `src/data/apps.ts` (URLs App Store + Play Store) | 3 |
| `src/pages/contrata.astro` | 4 |
| `src/pages/recarga.astro` | 5 |
| `src/pages/portabilidad.astro` | 5 |
| `src/components/astro/ServiceCards.astro` | 6 |

### A modificar
| Archivo | Fase | Cambio |
|---|---|---|
| `src/components/astro/Header.astro` | 2/4/5 | Menu Servicios dropdown, "Tienda"→"Contrata", "Activar"→"Activar/Recargar" |
| `src/components/astro/Footer.astro` | 3 | Reescritura completa |
| `src/components/react/TiendaFlow.tsx` → `ContratacionFlow.tsx` | 4 | Step 0 servicio + Step 3 portabilidad + Step 7 confirmacion |
| `src/lib/api.ts` | 4 | `getPlans` parametrizado, `createOrder` acepta `portability_nip` |
| `src/pages/tienda/index.astro` | 4 | Convertir en redirect 301 a `/contrata` |
| `src/pages/activar/index.astro` y wizard | 5 | Restyle + leer `?flow=` del URL |
| `src/pages/index.astro` | 6 | Limpiar secciones movidas, agregar ServiceCards |

## 6. Componentes/funciones a reutilizar (NO crear)

- [PlanSelector.tsx](../../src/components/react/PlanSelector.tsx) — telefonia movil
- [HBBSelector.tsx](../../src/components/react/HBBSelector.tsx) — internet en casa
- [MiFi.astro](../../src/components/astro/MiFi.astro) — internet portatil
- [DynamicBanner.tsx](../../src/components/react/DynamicBanner.tsx) — banner CRM (ya funciona)
- [api.ts](../../src/lib/api.ts) `createOrder`, `ecommerceStripeInit`, `ecommerceMercadoPagoInit`, `ecommerceOxxoInit`, `getOrderStatus`
- Wizard de activar (no tocar logica, solo restyle) — `src/pages/activar/`
- [SEOHead.astro](../../src/components/astro/SEOHead.astro) y `BaseLayout.astro`
- Schemas en [lib/schema.ts](../../src/lib/schema.ts) — agregar uno por servicio

## 7. Consideraciones tecnicas

- **Paginas legales nuevas:** el TEXTO regulatorio lo provee el usuario (legal/operaciones). Si no esta listo, dejamos placeholder con anchor `[CONTENIDO PENDIENTE — solicitar a legal]` y la pagina existe (link en footer no se rompe).
- **Iframe cobertura:** verificar que `api.celink.mx/map/pandamovil` permite iframe (sin `X-Frame-Options: DENY`). Si bloquea, fallback a screenshot + boton "Abrir mapa".
- **Redirects /tienda → /contrata:** usar `Astro.redirect('/contrata', 301)` en `tienda/index.astro` para preservar SEO de tienda. Mantener tambien `/tienda/cualquier-cosa` redirigido si hay sub-rutas.
- **Wizard `/activar?flow=`:** preserva compatibilidad con `/activar` directo (sin query param, muestra el SelectFlow normal).
- **View Transitions:** todas las paginas nuevas DEBEN usar `transition:persist` en banner/header/footer y `transition:name="panda-main"` en `<main>` (igual que `index.astro` y `telefonia-movil.astro` ya hacen).
- **Mobile menu:** el dropdown de Servicios necesita variante mobile (accordion en menu hamburguesa). Hoy `Header.astro` no tiene menu mobile expuesto — es ITEM SEPARADO por planificar despues.
- **Family type por servicio en API:** verificar con backend (Mr. JJ) si el endpoint `/api/public/ecommerce/plans` acepta `?type=Internet en casa` y `?type=MiFi` o si los nombres de tipo difieren. Si difieren, mapear en `api.ts`.

## 8. Verificacion (end-to-end por fase)

Por cada fase nueva:

1. **Build limpio:** `npm run build` en `sitios-web/pandamovil/` (Node 22 via `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`) — sin warnings nuevos
2. **Sitemap:** abrir `dist/sitemap-index.xml` y confirmar que las URLs nuevas estan listadas
3. **SEO check:** cada pagina nueva con `<title>` unico, `<meta description>` unico, `<h1>` unico
4. **Dev test manual:** navegar entre todas las paginas via menu — efecto one-page suave, banner/header/footer no parpadean
5. **Debug bridge:** `tail_events` y `get_screenshot` para confirmar consola limpia
6. **Flujos de pago end-to-end (Fase 4):**
   - Telefonia eSIM con tarjeta (Stripe test mode)
   - Internet hogar con OXXO (OpenPay)
   - Telefonia + portabilidad (verificar que `portability_nip` llega al backend)
   - Confirmacion muestra ICCID/dn/link eSIM
7. **Mobile real:** Safari iOS + Chrome Android via `npm run dev -- --host`
8. **Auditoria legal:** todos los links del footer abren — incluso si son placeholder, no deben dar 404

## 9. Orden propuesto de ejecucion

```
Fase 2 (servicios + cobertura)        → 1 sesion corta
Fase 3 (footer + paginas legales)     → 1 sesion (necesita textos legales)
Fase 5 (restyle activar)              → 1 sesion corta
Fase 4 (refactor /contrata)           → 2 sesiones (es el flujo mas grande)
Fase 6 (refactor home con ServiceCards)→ 1 sesion corta
```

Despues de cada fase: pausa, prueba en browser, ajusta, sigue. Si algo no convence, paramos antes de invertir mas.

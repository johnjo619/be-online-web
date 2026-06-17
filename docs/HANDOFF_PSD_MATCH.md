# Handoff — PSD pixel-perfect match para páginas de servicio

## Contexto

Cliente entregó `docs/IMAGENES DE BANNER-PANDA/Servicios-Panda Movil.psd` (578MB)
con 4 artboards (uno por página de servicio). Necesita que las 4 páginas web
sean visualmente idénticas al PSD.

Trabajo previo (Claude Code) llevó a ~70% match estructural, pero no logró
pixel-perfect. Cliente quiere handoff a humano/diseñador.

## Estado actual del repo

- Branch: `prerelease`
- Último commit funcional: `a1154ba`
- URL test: https://webtest.pandamovil.mx/telefonia-movil/
- Stack: Astro 4 + Tailwind + React (algunos componentes)
- Deploy: SSH a `ssh front` (GitHub Actions sin minutos)

## Material disponible

### Assets PSD ya extraídos
- `audit/psd-artboards/00-telefonia-movil-1920x6686.png` (composite full)
- `audit/psd-artboards/01-internet-en-casa-1920x4763.png`
- `audit/psd-artboards/02-internet-portatil-1920x5062.png`
- `audit/psd-artboards/03-cobertura-1920x4645.png`
- `audit/psd-artboards/*-1440.png` (resized para webtest viewport)

### Banners WebP listos
`public/img/banners/services/`:
- telefonia-01 a telefonia-06 (hero, banner, mano, sunset, etc.)
- internet-casa-01 a 04
- mifi-01 a 03
- cobertura-02, cobertura-03

### Layer dump del PSD
- `/tmp/psd-full.txt` — texto exacto + posiciones + sizes de cada layer
- Script Python para re-extraer: usa `psd-tools` en venv `/tmp/psd-venv`

### Herramientas instaladas
```bash
/tmp/psd-venv/bin/python  # con psd-tools + aggdraw
/opt/homebrew/bin/magick  # ImageMagick para cropear/resize
```

## Estructura REAL del PSD telefonia móvil (verificada con slices)

1. Header (white) + Mi PandaMovil CTA red
2. Sub-nav (Telefonía móvil active pill)
3. Hero RED + joven con celular + iconos sociales (telefonia-01)
4. Planes de Movilidad — WHITE bg + tabs + 3 cards
5. **Cómo funciona** — RED bg + panda+chico (telefonia-02) + 3 steps blanco
6. **Qué incluye** — WHITE bg + 4 cards
7. **Plan Xpress, Mensual o Anual** — WHITE bg + 3 cards
8. **eSIM o SIM física** — PINK bg + mano+iconos (telefonia-03) + 2 cards
9. **¿Para quién es PandaMovil?** — SUNSET bg (telefonia-04) + 4 cards CONTACTO
10. **3 columnas** Sin contratos / Cobertura nacional / Atención humana — WHITE
11. **También te puede interesar** — gray bg + 3 cards cross-sell
12. **Preguntas Frecuentes** — accordion
13. **CTA Final "Tu nuevo plan, en minutos"** — dark photo bg + 2 buttons
14. **Footer** — Dark navy con badges Apple/Google adentro (NO standalone section)

## Componentes Astro actuales (que necesitan ajuste)

- `src/components/astro/Movil*.astro` — sections custom para telefonia
- `src/components/astro/ServiceShell.astro` — wrapper común
- `src/components/astro/HeroBanner.tsx` — hero (acepta `fallbackImage` prop)
- `src/components/astro/PlanCard.tsx` + `PlanSelector.tsx` — planes
- Los Movil*Astro tienen issues de spacing, colors, font-sizes vs PSD

## Lo que falta para pixel-perfect

1. **Spacing exacto** — medir cada padding/margin del PSD layer offsets
2. **Font sizes exactos** — PSD usa ~30px H2, ~45px H1, 11-13px body
3. **Colors exactos** — verificar con eyedropper en PSD
4. **Border-radius, shadows, gradients** — extraer de PSD
5. **Card layouts** — verificar dimensiones exactas
6. **Imágenes posicionadas exactamente** como en PSD layers

## Sugerencias de workflow para próximo dev

**Opción A — Diseñador + dev pair:**
- Diseñador abre PSD en Photoshop con ruler/measure
- Dev hace match por sección en CSS

**Opción B — Figma export:**
- Importar PSD a Figma
- Usar Figma inspect para CSS exacto (auto-extrae padding/font-size/colors)
- Copy/paste tokens a Tailwind

**Opción C — Plugin browser eyedropper:**
- Cropear cada sección del PSD a screenshot
- Eyedropper para colors
- DevTools para medir spacing del PSD render vs webtest

## Comandos útiles

```bash
# Re-extraer del PSD
/tmp/psd-venv/bin/python -c "
from psd_tools import PSDImage
psd = PSDImage.open('/Users/amendoza/AI_CELINK_DEV/docs/IMAGENES DE BANNER-PANDA/Servicios-Panda Movil.psd')
# psd[0..3] = los 4 artboards
"

# Cropear sección específica del PSD composite
/opt/homebrew/bin/magick audit/psd-artboards/00-telefonia-movil-1920x6686.png \
  -crop 1920x500+0+1670 +repage /tmp/seccion.png

# Build local + dev
npm run dev   # localhost:4321
npm run build # → dist/

# Deploy a webtest (SSH, Actions sin minutos)
git push origin prerelease
ssh front "cd /home/ubuntu/pandamovil-web-prerelease && git fetch && git reset --hard origin/prerelease && npm run build"
```

## Commits recientes

- `a1154ba` — fix: quita Mayoristas + DownloadApp del ServiceShell (no en PSD)
- `4c8b8a4` — fix: bgs corregidos (Cómo funciona=telefonia-02, Qué incluye=white)
- `c748719` — fix: remove extras + add eSIM bg + ParaQuien sunset bg
- `63ca707` — Plan Xpress card layout match PSD
- `5f8cc4b` — feat: add Mayoristas + DownloadApp (later removed)
- `733a635` — feat: integrate 15 PSD banners

Revisar `git log` para historia completa.

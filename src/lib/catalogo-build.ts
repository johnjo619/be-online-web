/**
 * Catalogo leido EN BUILD, para lo que tiene que viajar en el HTML estatico:
 * titles, meta descriptions y JSON-LD.
 *
 * En el navegador el catalogo se pide por /api-proxy (mismo origen). Aqui no
 * hay navegador ni proxy de nginx, asi que se va directo al backend.
 *
 * Si el CRM no responde NO se rompe el build ni se inventan numeros: devuelve
 * null y quien lo llama omite el precio. Un precio inventado en el <title> o en
 * el JSON-LD es peor que no ponerlo.
 */
const API = 'https://api-crm.igou.mx';
const COMPANY_ID = 3;

export interface ResumenCatalogo {
  min: number;
  max: number;
  total: number;
  /** Minimo de las ofertas de 30 dias (lo que la gente entiende por "al mes"). */
  minMensual: number | null;
}

let cache: Record<string, ResumenCatalogo | null> = {};

export async function resumenCatalogo(tipo = 'Movilidad'): Promise<ResumenCatalogo | null> {
  if (tipo in cache) return cache[tipo];

  try {
    const res = await fetch(
      `${API}/api/odoo/product/findbytype?type=${encodeURIComponent(tipo)}`,
      {
        headers: {
          Accept: 'application/json',
          platform: 'web',
          odoocompanyid: String(COMPANY_ID),
        },
      },
    );
    if (!res.ok) throw new Error(String(res.status));

    const json = (await res.json()) as { data?: Array<{ offers?: Array<Record<string, unknown>> }> };
    const ofertas = (json.data || []).flatMap((g) => g.offers || []);
    const montos = ofertas.map((o) => Number(o.amount) || 0).filter((n) => n > 0);
    if (!montos.length) throw new Error('sin ofertas');

    const mensuales = ofertas
      .filter((o) => o.interval === 'day' && Number(o.interval_count) === 30)
      .map((o) => Number(o.amount) || 0)
      .filter((n) => n > 0);

    cache[tipo] = {
      min: Math.min(...montos),
      max: Math.max(...montos),
      total: montos.length,
      minMensual: mensuales.length ? Math.min(...mensuales) : null,
    };
  } catch {
    cache[tipo] = null;
  }

  return cache[tipo];
}

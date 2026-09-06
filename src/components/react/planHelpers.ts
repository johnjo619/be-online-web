import type { Plan } from '../../lib/types';

export type ServiceType = 'movil' | 'mifi';

export function isTruthy(val: unknown): boolean {
  return val === true || val === 1;
}

// ── Segmento: quien lleva voz y SMS y quien no ───────────────────────────────
/**
 * MiFi e "Internet en casa" son SOLO DATOS: el aparato es un modem, no lleva
 * minutos ni SMS. Se pregunta por las DOS columnas con OR, no una como
 * respaldo de la otra:
 *  - `type` es la llave con la que el backend filtra el catalogo, asi que esta
 *    poblada por construccion (si no lo estuviera, el catalogo saldria vacio).
 *  - `service_category` es nullable y hasta 2026-09-06 nada la mantenia, asi
 *    que su ausencia no prueba nada — pero cuando dice "mifi" hay que creerle.
 * Se compara en minusculas y con los alias previos a la migracion
 * 2024_10_26_170126 ('mifi', 'hbb'), que `offers.type` NUNCA normalizo: siguen
 * vivos en factories y en datos.
 *
 * NO se miran `call_is_unlimit` ni `call_national_limit`: medido en produccion
 * el 2026-09-06, `call_national_limit` vale 0 en el 100% de las ofertas (tambien
 * en las de Movilidad) y hay 26 ofertas de MiFi con `call_is_unlimit = 1`. Los
 * flags por oferta no son de fiar; la senal buena es el segmento.
 */
const CATEGORIAS_SOLO_DATOS = ['mifi', 'internet_casa'];
const TIPOS_SOLO_DATOS = ['mifi', 'hbb', 'internet en casa'];

const norm = (v: unknown): string => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/** Fuente de segmento: una oferta del catalogo, o un `{ type }` sintetico. */
export interface SenalDeSegmento {
  type?: string | null;
  service_category?: string | null;
}

/**
 * ¿Esta oferta/linea es de un producto que NO lleva voz ni SMS?
 *
 * FAIL-SAFE: solo devuelve true ante una senal EXPLICITA de datos, nunca por
 * omision. Ante senal ausente o desconocida se asume telefonia y se muestra:
 * ocultarle los minutos a una linea de Movilidad por un dato faltante es peor
 * que el ruido inverso.
 */
export function esSoloDatos(src?: SenalDeSegmento | null): boolean {
  if (!src) return false;
    const t = norm(src.type);
    // `type` MANDA en los dos sentidos: si viene, `service_category` ni se mira. Con un OR
    // bastaria una sola senal sucia —una oferta de Movilidad con service_category='mifi'
    // capturado a mano— para esconderle los minutos a un plan de telefonia, que es el lado
    // que mas se nota. El backend decide igual: TipoLineaPolicy solo consulta `type`.
    if (t) return TIPOS_SOLO_DATOS.includes(t);
    return CATEGORIAS_SOLO_DATOS.includes(norm(src.service_category));
}

/** El complemento, que es lo que se pregunta al pintar. */
export function tieneVozYSms(src?: SenalDeSegmento | null): boolean {
  return !esSoloDatos(src);
}

export function getDataText(p: Plan): string {
  if (isTruthy(p.data_is_unlimit)) return p.data_national_limit ? `${p.data_national_limit}` : '∞';
  return p.data_national_limit ? `${p.data_national_limit}` : '0';
}

/**
 * Minutos y SMS: `null` cuando NO hay dato real, y quien pinta omite la tile.
 *
 * Antes el ternario era `limite ? limite : 'Ilimitados'`, y como
 * `call_national_limit` vale 0 en todas las ofertas del CRM el fallback se
 * disparaba SIEMPRE: la tarjeta anunciaba "Ilimitados" sin que nadie lo
 * hubiera dicho. Un 0 no es un infinito; ausencia de dato tampoco.
 */
export function getMinutesText(p: Plan): string | null {
  if (isTruthy(p.call_is_unlimit)) return 'Ilimitados';
  return p.call_national_limit ? `${p.call_national_limit}` : null;
}

export function getSMSText(p: Plan): string | null {
  if (isTruthy(p.sms_is_unlimit)) return 'Ilimitados';
  return p.sms_national_limit ? `${p.sms_national_limit}` : null;
}

export function getPlanDuration(p: Plan): string {
  const count = p.interval_count || 1;
  const interval = p.interval || 'month';
  if (interval === 'month') return count === 1 ? '30 días' : `${count * 30} días`;
  if (interval === 'year') return count === 1 ? '1 año' : `${count} años`;
  return p.card_footer || '30 días';
}

export function getActiveSocialNetworks(p: Plan): string[] {
  const map: Record<string, unknown> = {
    whatsapp: p.rs_included_whatsapp,
    facebook: p.rs_included_facebook,
    instagram: p.rs_included_instagram,
    tiktok: p.rs_included_tiktok,
    messenger: p.rs_included_messenger,
    youtube: p.rs_included_youtube,
    telegram: p.rs_included_telegram,
    snapchat: p.rs_included_snapchat,
    x: p.rs_included_x,
  };
  return Object.keys(map).filter((k) => isTruthy(map[k]));
}

export function cleanPlanName(name: string): string {
  return name.replace(/\b(XPRESS|MENSUAL|ANUAL)\b/gi, '').trim();
}

export function getChunkSize(): number {
  if (typeof window === 'undefined') return 3;
  const w = window.innerWidth;
  if (w < 640) return 1;
  if (w < 1024) return 2;
  return 3;
}

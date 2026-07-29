import type { Plan } from '../../lib/types';

export type ServiceType = 'movil' | 'mifi';

export function isTruthy(val: unknown): boolean {
  return val === true || val === 1;
}

export function getDataText(p: Plan): string {
  if (isTruthy(p.data_is_unlimit)) return p.data_national_limit ? `${p.data_national_limit}` : '∞';
  return p.data_national_limit ? `${p.data_national_limit}` : '0';
}

export function getMinutesText(p: Plan): string {
  if (isTruthy(p.call_is_unlimit)) return 'Ilimitados';
  return p.call_national_limit ? `${p.call_national_limit}` : 'Ilimitados';
}

export function getSMSText(p: Plan): string {
  if (isTruthy(p.sms_is_unlimit)) return 'Ilimitados';
  return p.sms_national_limit ? `${p.sms_national_limit}` : 'Ilimitados';
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

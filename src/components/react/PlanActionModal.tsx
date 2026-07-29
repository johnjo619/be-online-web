/**
 * PlanActionModal — selector "Contratar nueva" vs "Recargar mi línea actual"
 * que se abre cuando el usuario hace clic en "¡Lo quiero!" desde una card de
 * plan en cualquier sección (PlanSelector, MiFi, etc).
 *
 * Reglas:
 *  - Contratar nueva línea  →  /tienda/?plan={id}&service={key}  (TiendaFlow lo lee)
 *  - Recargar línea actual  →  /activar/?flow=recargar  (el usuario captura ICCID en el wizard)
 *
 * Sin librerías de modal (Radix/HeadlessUI) — un dialog simple con backdrop +
 * trap básico, focus al primer botón.
 */

import { useEffect, useRef } from 'react';
import type { Plan } from '../../lib/types';
import { type ServiceType, getPlanDuration } from './planHelpers';

interface Props {
  open: boolean;
  plan: (Plan & { selectedDuration?: string; selectedPrice?: string }) | null;
  service: ServiceType;
  onClose: () => void;
}

const SERVICE_LABEL: Record<ServiceType, string> = {
  movil: 'Telefonía móvil',
  mifi: 'Internet portátil',
};

export default function PlanActionModal({ open, plan, service, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstBtnRef = useRef<HTMLAnchorElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Bloquea scroll del body mientras modal está abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Foco al primer CTA
    setTimeout(() => firstBtnRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !plan) return null;

  const planLabel = plan.card_title || plan.display_name || plan.name;

  const rawPrice = plan.selectedPrice || plan.amount || 0;
  const price = typeof rawPrice === 'string' ? rawPrice.replace(/[$,]/g, '') : Number(rawPrice).toFixed(0);

  const duration = plan.selectedDuration || getPlanDuration(plan);

  const contratarHref = `/tienda/?plan=${encodeURIComponent(String(plan.id))}&service=${service}`;
  const recargarHref = `/activar/?flow=recargar&plan=${encodeURIComponent(String(plan.id))}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-action-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-9 h-9 rounded-full text-panda-gray hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <p className="font-poppins text-[11px] uppercase tracking-wider text-panda-gray mb-1">
            {SERVICE_LABEL[service]}
          </p>
          <h2 id="plan-action-title" className="font-unbounded text-xl font-bold text-panda-dark">
            {planLabel}
          </h2>
          <p className="font-poppins text-sm text-panda-gray mt-1">
            <span className="font-bold text-panda-red">${price} MXN</span>
            {duration ? ` · ${duration}` : ''}
          </p>
        </div>

        <p className="font-poppins text-sm text-panda-dark text-center mb-5">
          ¿Es para una línea nueva o ya tienes una con Be Online?
        </p>

        {/* Acciones */}
        <div className="space-y-3">
          {/* Contratar nueva */}
          <a
            ref={firstBtnRef}
            href={contratarHref}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-panda-red hover:bg-panda-red-dark text-white shadow-lg shadow-panda-red/30 transition-colors no-underline"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-poppins font-bold text-sm">Contratar línea nueva</p>
              <p className="font-poppins text-xs opacity-90 leading-snug">
                eSIM o SIM física. Activación en minutos.
              </p>
            </div>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Recargar línea existente */}
          <a
            href={recargarHref}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-panda-dark text-panda-dark transition-colors no-underline"
          >
            <div className="w-10 h-10 rounded-xl bg-panda-surface flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-panda-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-poppins font-bold text-sm">Recargar mi línea actual</p>
              <p className="font-poppins text-xs text-panda-gray leading-snug">
                Ya tengo línea Be Online. Aplica este plan a mi chip.
              </p>
            </div>
            <svg className="w-4 h-4 text-panda-gray transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <p className="font-poppins text-[11px] text-panda-gray text-center mt-5">
          Sin contratos · Cancelas cuando quieras
        </p>
      </div>
    </div>
  );
}

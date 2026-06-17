import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Plan } from '../../lib/types';
import { cleanPlanName, getChunkSize } from './planHelpers';
import PlanCard from './PlanCard';
import PlanActionModal from './PlanActionModal';

// ── API ────────────────────────────────────────────────
async function fetchHBBPlans(): Promise<Plan[]> {
  const res = await fetch('/api-proxy/api/odoo/product/findbytype?type=Internet%20en%20casa&family_type=Panda', {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', platform: 'web', odoocompanyid: '1' },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  if (!json.data || !Array.isArray(json.data)) return [];
  return json.data.flatMap((group: { name: string; offers: Plan[] }) =>
    (group.offers || []).map((offer) => ({ ...offer, display_name: cleanPlanName(offer.name), group_name: group.name })),
  );
}

// ── Main Component ─────────────────────────────────────
interface HBBSelectorProps {
  /** Si true, oculta el header interno "Internet en Casa" (úsalo cuando la
   *  página ya tiene su propio header arriba para evitar duplicación). */
  hideHeader?: boolean;
}

export default function HBBSelector({ hideHeader = false }: HBBSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [chunkSize, setChunkSize] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  // Modal: Contratar nueva línea vs Recargar línea actual
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchHBBPlans()
      .then((data) => { setPlans(data); setFetchLoading(false); })
      .catch(() => { setFetchError('No se pudieron cargar los planes'); setFetchLoading(false); });
  }, []);

  useEffect(() => {
    const handle = () => setChunkSize(getChunkSize());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const chunkedPlans = useMemo(() => {
    const chunks: Plan[][] = [];
    for (let i = 0; i < plans.length; i += chunkSize) {
      chunks.push(plans.slice(i, i + chunkSize));
    }
    return chunks;
  }, [plans, chunkSize]);

  const totalPages = chunkedPlans.length;

  useEffect(() => { setActiveIndex(0); }, [chunkSize]);

  const goTo = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(idx);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating]);

  const prev = () => goTo(activeIndex <= 0 ? totalPages - 1 : activeIndex - 1);
  const next = () => goTo(activeIndex >= totalPages - 1 ? 0 : activeIndex + 1);

  return (
    <section id="internet" className={`px-4 ${hideHeader ? 'py-0' : 'py-16 md:py-24 bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {!hideHeader && (
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl sm:text-4xl font-bold text-panda-dark mb-4">
              Internet en Casa
            </h2>
            <p className="text-lg text-panda-gray font-poppins max-w-2xl mx-auto">
              Lleva internet de alta velocidad a tu hogar, sin instalaciones complicadas ni contratos
            </p>
          </div>
        )}

        {fetchLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-panda-red/30 border-t-panda-red rounded-full animate-spin" />
            <p className="text-panda-gray mt-4 font-poppins">Cargando planes...</p>
          </div>
        )}
        {fetchError && (
          <div className="max-w-2xl mx-auto my-8 px-6 py-10 rounded-2xl bg-gradient-to-br from-panda-surface to-white border border-gray-100 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-panda-red/10 mb-4">
              <svg className="w-7 h-7 text-panda-red" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <h3 className="font-unbounded text-xl font-bold text-panda-dark mb-2">Planes HBB próximamente</h3>
            <p className="font-poppins text-sm text-panda-gray mb-6 max-w-md mx-auto">
              Nuestros planes de Internet en Casa estarán disponibles en breve. Mientras tanto, contáctanos para conocer la oferta personalizada para tu zona.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="https://wa.me/524424401925?text=Hola%2C%20quiero%20info%20de%20Internet%20en%20Casa%20HBB" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-panda-red text-white font-bold text-sm hover:bg-panda-red-dark transition-colors shadow-md font-poppins">
                Contactar por WhatsApp
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="tel:*777" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-panda-dark text-panda-dark font-bold text-sm hover:bg-panda-surface transition-colors font-poppins">
                Llamar *777
              </a>
            </div>
          </div>
        )}

        {!fetchLoading && !fetchError && totalPages > 0 && (
          <div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex items-center gap-3 bg-white backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-gray-100">
                  <button
                    onClick={prev}
                    disabled={isAnimating}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-panda-red/10 text-panda-red hover:bg-panda-red/20 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {chunkedPlans.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goTo(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeIndex === idx ? 'w-5 bg-panda-red' : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-panda-gray min-w-[36px] text-center">
                    {activeIndex + 1} / {totalPages}
                  </span>

                  <button
                    onClick={next}
                    disabled={isAnimating}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-panda-red/10 text-panda-red hover:bg-panda-red/20 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-[380px] sm:min-h-[420px]">
              <div
                className="flex gap-4 sm:gap-6 justify-center py-4 transition-opacity duration-300 flex-wrap"
                key={`hbb-page-${activeIndex}`}
              >
                {(chunkedPlans[activeIndex] || []).map((plan) => (
                  <PlanCard key={plan.id} plan={plan} service="hbb" onSelect={() => setModalPlan(plan)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {!fetchLoading && !fetchError && plans.length === 0 && (
          <p className="text-center text-panda-gray font-poppins py-8">No hay planes disponibles.</p>
        )}

        {/* Benefits strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {[
            { icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: 'Sin instalación' },
            { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Activa al instante' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Sin contratos' },
            { icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0', text: 'WiFi para todos' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-panda-gray font-poppins text-sm">
              <div className="w-8 h-8 rounded-lg bg-panda-red/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-panda-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon} />
                </svg>
              </div>
              {b.text}
            </div>
          ))}
        </div>
      </div>

      {/* Modal "Contratar nueva línea vs Recargar mi línea" */}
      <PlanActionModal
        open={modalPlan !== null}
        plan={modalPlan}
        service="hbb"
        onClose={() => setModalPlan(null)}
      />
    </section>
  );
}

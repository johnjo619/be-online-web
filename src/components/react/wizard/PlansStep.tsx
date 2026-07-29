import { useState, useEffect, useMemo, useCallback } from 'react';
import { getPlansByMsisdn } from '../../../lib/api';
import type { Plan } from '../../../lib/types';
import PlanCard from '../PlanCard';
import { getChunkSize, type ServiceType } from '../planHelpers';

interface PlansStepProps {
  msisdn: string;
  simType?: string;
  onSelect: (plan: Plan) => void;
}

/** Mapea el simType del wizard al ServiceType del PlanCard. */
function simTypeToService(simType?: string): ServiceType {
  if (!simType) return 'movil';
  const s = simType.toLowerCase();
  if (s.includes('mifi')) return 'mifi';
  return 'movil';
}

export default function PlansStep({ msisdn, simType, onSelect }: PlansStepProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIdx, setPageIdx] = useState(0);
  const [chunkSize, setChunkSize] = useState(3);
  const [animating, setAnimating] = useState(false);

  const service = simTypeToService(simType);

  useEffect(() => {
    getPlansByMsisdn(msisdn, '', simType || '')
      .then((data) => { setPlans(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los planes'); setLoading(false); });
  }, [msisdn, simType]);

  useEffect(() => {
    const handle = () => setChunkSize(getChunkSize());
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const chunks = useMemo(() => {
    const c: Plan[][] = [];
    for (let i = 0; i < plans.length; i += chunkSize) c.push(plans.slice(i, i + chunkSize));
    return c;
  }, [plans, chunkSize]);

  const totalPages = chunks.length;

  useEffect(() => { setPageIdx(0); }, [chunkSize]);

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);
      setPageIdx(idx);
      setTimeout(() => setAnimating(false), 400);
    },
    [animating],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-3 border-[#ec3143] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) return <p className="text-center text-red-500 py-4">{error}</p>;
  if (plans.length === 0) return <p className="text-center text-[#7a7a7a] py-4">No hay planes disponibles.</p>;

  return (
    <div>
      <h3 className="font-unbounded text-lg font-semibold text-[#0f172a] mb-6 text-center">
        Elige tu plan
      </h3>

      <div
        className="flex flex-wrap gap-4 justify-center transition-opacity duration-300"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {(chunks[pageIdx] || []).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            service={service}
            onSelect={() => onSelect(plan)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => goTo(pageIdx <= 0 ? totalPages - 1 : pageIdx - 1)}
            className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
          >
            <svg className="w-4 h-4 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-[#7a7a7a]">{pageIdx + 1}/{totalPages}</span>
          <button
            onClick={() => goTo(pageIdx >= totalPages - 1 ? 0 : pageIdx + 1)}
            className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
          >
            <svg className="w-4 h-4 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

import type { Plan, SimType } from '../../lib/types';

interface OrderSummaryProps {
  plan: Plan;
  simType: SimType;
}

export default function OrderSummary({ plan, simType }: OrderSummaryProps) {
  const price = Number(plan.amount) || 0;
  const simLabel = simType === 'esim' ? 'eSIM Digital' : 'SIM Física';
  const simPrice = 0; // Both free

  return (
    <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2">
      <p className="font-poppins text-xs font-bold text-[#0f172a] uppercase tracking-wider">
        Resumen
      </p>
      <div className="flex justify-between text-sm font-poppins">
        <span className="text-[#7a7a7a]">{plan.display_name || plan.name}</span>
        <span className="text-[#0f172a] font-semibold">${price.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm font-poppins">
        <span className="text-[#7a7a7a]">{simLabel}</span>
        <span className="text-[#0f172a]">${simPrice.toFixed(2)}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 flex justify-between">
        <span className="font-poppins text-sm font-bold text-[#0f172a]">Total</span>
        <span className="font-poppins text-lg font-bold text-[#1a1e29]">
          ${(price + simPrice).toFixed(2)} MXN
        </span>
      </div>
    </div>
  );
}

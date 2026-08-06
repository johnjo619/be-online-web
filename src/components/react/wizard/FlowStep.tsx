import type { WizardFlow, IccidValidation } from '../../../lib/types';

interface FlowStepProps {
  actions: IccidValidation;
  onSelect: (flow: WizardFlow) => void;
}

const FLOW_OPTIONS: {
  key: WizardFlow;
  label: string;
  desc: string;
  icon: string;
  actionKey: keyof IccidValidation;
}[] = [
  { key: 'activar', label: 'Activar mi línea', desc: 'Primera activación de tu SIM', icon: '📱', actionKey: 'activar' },
  { key: 'recargar', label: 'Recargar saldo', desc: 'Agrega saldo a tu línea activa', icon: '🔄', actionKey: 'recargar' },
  { key: 'portar', label: 'Portar mi número', desc: 'Trae tu número de otra compañía', icon: '🔀', actionKey: 'portar' },
  { key: 'cambiar_nir', label: 'Cambiar región', desc: 'Cambia tu lada/región', icon: '📍', actionKey: 'cambiar_nir' },
];

export default function FlowStep({ actions, onSelect }: FlowStepProps) {
  const available = FLOW_OPTIONS.filter((opt) => actions[opt.actionKey]);

  return (
    <div className="max-w-sm mx-auto">
      <h3 className="font-unbounded text-lg font-semibold text-[#142035] mb-6 text-center">
        ¿Qué deseas hacer?
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {available.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center cursor-pointer transition-all hover:border-[#142035] hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-[#142035]/10 flex items-center justify-center mx-auto mb-3 text-xl">
              {opt.icon}
            </div>
            <p className="font-unbounded text-sm font-semibold text-[#142035]">{opt.label}</p>
            <p className="font-poppins text-[11px] text-[#7a7a7a] mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>

      {available.length === 0 && (
        <p className="text-center text-[#7a7a7a] font-poppins text-sm">
          No hay acciones disponibles para esta línea.
        </p>
      )}
    </div>
  );
}

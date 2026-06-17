import type { SimType } from '../../lib/types';

interface SimEsimPickerProps {
  selected: SimType;
  onChange: (type: SimType) => void;
}

export default function SimEsimPicker({ selected, onChange }: SimEsimPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* eSIM Digital — recomendado */}
      <button
        type="button"
        onClick={() => onChange('esim')}
        className={`relative rounded-2xl border-2 p-5 text-left transition-all overflow-hidden ${
          selected === 'esim'
            ? 'border-panda-red bg-gradient-to-br from-panda-red/5 to-white shadow-lg shadow-panda-red/15 -translate-y-0.5'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Badge recomendado */}
        <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Recomendado
        </span>

        {/* Icono grande */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          selected === 'esim' ? 'bg-panda-red text-white' : 'bg-panda-red/10 text-panda-red'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        <p className="font-unbounded text-base font-bold text-panda-dark">eSIM Digital</p>
        <p className="font-poppins text-xs text-panda-gray mt-1 leading-relaxed">
          Activación al instante. Recibes un QR por correo y escaneas desde tu celular.
        </p>

        {/* Mini-features */}
        <ul className="mt-4 space-y-1.5">
          <li className="flex items-center gap-2 text-[11px] text-panda-dark font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Sin envío, sin esperas
          </li>
          <li className="flex items-center gap-2 text-[11px] text-panda-dark font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Listo en menos de 5 minutos
          </li>
        </ul>

        {/* Radio indicador */}
        <span className={`absolute bottom-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected === 'esim' ? 'border-panda-red bg-panda-red' : 'border-gray-300'
        }`}>
          {selected === 'esim' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </span>
      </button>

      {/* SIM Física */}
      <button
        type="button"
        onClick={() => onChange('sim')}
        className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
          selected === 'sim'
            ? 'border-panda-red bg-gradient-to-br from-panda-red/5 to-white shadow-lg shadow-panda-red/15 -translate-y-0.5'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Icono grande */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          selected === 'sim' ? 'bg-panda-red text-white' : 'bg-panda-red/10 text-panda-red'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zm2 4h4m-4 4h4m4-4h4m-4 4h4" />
          </svg>
        </div>

        <p className="font-unbounded text-base font-bold text-panda-dark">SIM Física</p>
        <p className="font-poppins text-xs text-panda-gray mt-1 leading-relaxed">
          Te llega el chip a tu domicilio en 2-5 días hábiles. Compatible con cualquier teléfono.
        </p>

        {/* Mini-features */}
        <ul className="mt-4 space-y-1.5">
          <li className="flex items-center gap-2 text-[11px] text-panda-dark font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Envío gratis
          </li>
          <li className="flex items-center gap-2 text-[11px] text-panda-dark font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Funciona en cualquier celular
          </li>
        </ul>

        {/* Radio indicador */}
        <span className={`absolute bottom-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected === 'sim' ? 'border-panda-red bg-panda-red' : 'border-gray-300'
        }`}>
          {selected === 'sim' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </span>
      </button>
    </div>
  );
}

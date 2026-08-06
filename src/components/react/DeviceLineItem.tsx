/**
 * DeviceLineItem — line item visual para el sidebar del checkout.
 *
 * Se usa para mostrar el dispositivo (equipo MiFi) y el envío como
 * conceptos separados del PlanCard. Mismo lenguaje visual que el resto
 * del checkout: rounded-2xl + gradient sutil + ícono + precio mono.
 */

interface Props {
  name: string;
  price: number;
  /** Tipo de ícono a mostrar */
  icon: 'router' | 'mifi' | 'truck' | 'sim';
  /** Subtítulo opcional (ej. "Llega en 2-5 días hábiles") */
  hint?: string;
  /** Etiqueta superior pequeña (ej. "Equipo" o "Envío") */
  badge?: string;
}

export default function DeviceLineItem({ name, price, icon, hint, badge }: Props) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center gap-3 shadow-sm">
      {/* Ícono */}
      <div className="w-11 h-11 rounded-xl bg-panda-red/10 flex items-center justify-center flex-shrink-0">
        <span className="text-panda-red">
          <Icon name={icon} />
        </span>
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        {badge && (
          <p className="font-poppins text-[10px] uppercase tracking-wider text-panda-gray font-semibold">
            {badge}
          </p>
        )}
        <p className="font-unbounded text-sm font-bold text-panda-dark leading-tight truncate">
          {name}
        </p>
        {hint && (
          <p className="font-poppins text-[11px] text-panda-gray mt-0.5">
            {hint}
          </p>
        )}
      </div>

      {/* Precio */}
      <div className="text-right flex-shrink-0">
        <span className="font-mono font-bold text-base text-panda-red tabular-nums">
          ${price.toFixed(0)}
        </span>
        <span className="font-mono text-[10px] text-panda-gray ml-0.5">MXN</span>
      </div>
    </div>
  );
}

function Icon({ name }: { name: Props['icon'] }) {
  const cls = 'w-5 h-5';
  switch (name) {
    case 'router':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2zm2 4h.01M11 16h2m-7-4V8a2 2 0 012-2h8a2 2 0 012 2v4" />
        </svg>
      );
    case 'mifi':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    case 'truck':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case 'sim':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zm2 4h4m-4 4h4m4-4h4m-4 4h4" />
        </svg>
      );
  }
}

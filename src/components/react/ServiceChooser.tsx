/**
 * ServiceChooser — primer step del flujo de contratación.
 *
 * Visualmente homologado con SimEsimPicker / CustomerForm:
 *  - SectionHeader con número 01 + ícono + título display + subtítulo
 *  - Cards rounded-2xl border-2, hover lift, gradient sutil al seleccionar,
 *    icono que cambia a fondo rojo sólido, mini-features con checks verdes,
 *    radio circular abajo a la derecha
 *  - Toggle dispositivo con la misma estética
 *  - CTA "Continuar" con gradient + sombra prominente
 */

export type Service = 'movil' | 'hbb' | 'mifi';

interface Feature { text: string }

interface ServiceMeta {
  key: Service;
  title: string;
  subtitle: string;
  features: Feature[];
  /** Cómo se llama el dispositivo asociado, en español. */
  deviceLabel: string;
  deviceWithCopy: string;
  deviceWithoutCopy: string;
  /** Si false, no muestra toggle (móvil siempre incluye chip). */
  hasDeviceToggle: boolean;
  priceFrom: string;
  iconPath: string;
}

const SERVICES: ServiceMeta[] = [
  {
    key: 'movil',
    title: 'Telefonía móvil',
    subtitle: 'Plan prepago con eSIM o SIM física, redes ilimitadas y llamadas a USA y Canadá.',
    features: [
      { text: 'Redes sociales sin contar tus datos' },
      { text: 'Llamadas a México, USA y Canadá' },
    ],
    deviceLabel: 'Chip',
    deviceWithCopy: '',
    deviceWithoutCopy: '',
    hasDeviceToggle: false,
    priceFrom: '$50',
    iconPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  },
  {
    key: 'hbb',
    title: 'Internet en casa',
    subtitle: 'Wi-Fi 4G LTE sin instalación, sin técnicos. Router a domicilio.',
    features: [
      { text: 'Hasta 32 dispositivos' },
      { text: 'Sin obra ni cables' },
    ],
    deviceLabel: 'Router 4G LTE',
    deviceWithCopy: 'Te enviamos el router en 2-4 días',
    deviceWithoutCopy: 'Ya tengo router compatible',
    hasDeviceToggle: true,
    priceFrom: '$199',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    key: 'mifi',
    title: 'Internet portátil',
    subtitle: 'Wi-Fi de bolsillo, batería 12 horas, hasta 10 dispositivos.',
    features: [
      { text: 'Cabe en tu mochila' },
      { text: 'Recargable USB-C' },
    ],
    deviceLabel: 'Equipo MiFi',
    deviceWithCopy: 'Te enviamos el MiFi en 2-4 días',
    deviceWithoutCopy: 'Ya tengo MiFi compatible',
    hasDeviceToggle: true,
    priceFrom: '$149',
    iconPath: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  },
];

interface Props {
  selectedService: Service | null;
  includeDevice: boolean;
  onSelect: (service: Service, includeDevice: boolean) => void;
  onContinue: () => void;
}

export default function ServiceChooser({ selectedService, includeDevice, onSelect, onContinue }: Props) {
  const selected = SERVICES.find((s) => s.key === selectedService);

  return (
    <div className="space-y-7">
      {/* Section header — mismo estilo que checkout */}
      <SectionHeader
        number="01"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        title="¿Qué servicio quieres contratar?"
        subtitle="Elige uno. Si necesitas más de uno, repite el proceso (combinas dos = 15% off automático)."
      />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICES.map((s) => {
          const isActive = selectedService === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key, s.hasDeviceToggle ? includeDevice : true)}
              className={`relative text-left rounded-2xl border-2 p-5 pb-14 transition-all overflow-hidden ${
                isActive
                  ? 'border-panda-red bg-gradient-to-br from-panda-red/5 to-white shadow-lg shadow-panda-red/15 -translate-y-0.5'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Icono grande 48×48 */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                isActive ? 'bg-panda-red text-white' : 'bg-panda-red/10 text-panda-red'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
                </svg>
              </div>

              {/* Título y subtítulo */}
              <p className="font-unbounded text-base font-bold text-panda-dark">{s.title}</p>
              <p className="font-poppins text-xs text-panda-gray mt-1 leading-relaxed">{s.subtitle}</p>

              {/* Mini-features */}
              <ul className="mt-3 space-y-1.5">
                {s.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-panda-dark font-medium">
                    <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* Precio mono inferior izquierda + radio inferior derecha */}
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                <div>
                  <span className="font-poppins text-[10px] uppercase tracking-wider text-panda-gray">desde</span>
                  <div className="font-mono text-lg font-bold text-panda-red leading-none mt-0.5">
                    {s.priceFrom} <span className="text-[10px] font-normal text-panda-gray">MXN</span>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isActive ? 'border-panda-red bg-panda-red' : 'border-gray-300'
                }`}>
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toggle dispositivo — mismo lenguaje visual */}
      {selected?.hasDeviceToggle && (
        <div className="space-y-4">
          <SectionHeader
            number="02"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
            title={`¿Necesitas ${selected.deviceLabel}?`}
            subtitle={`Puedes incluir el equipo o usar uno propio compatible.`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sí, incluir dispositivo */}
            <button
              type="button"
              onClick={() => onSelect(selected.key, true)}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                includeDevice
                  ? 'border-panda-red bg-gradient-to-br from-panda-red/5 to-white shadow-lg shadow-panda-red/15 -translate-y-0.5'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                includeDevice ? 'bg-panda-red text-white' : 'bg-panda-red/10 text-panda-red'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-poppins text-sm font-bold text-panda-dark">
                Sí, incluir {selected.deviceLabel}
              </p>
              <p className="font-poppins text-xs text-panda-gray mt-1 leading-relaxed">
                {selected.deviceWithCopy}
              </p>
              <span className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                includeDevice ? 'border-panda-red bg-panda-red' : 'border-gray-300'
              }`}>
                {includeDevice && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>

            {/* No, solo el plan */}
            <button
              type="button"
              onClick={() => onSelect(selected.key, false)}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                !includeDevice
                  ? 'border-panda-red bg-gradient-to-br from-panda-red/5 to-white shadow-lg shadow-panda-red/15 -translate-y-0.5'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                !includeDevice ? 'bg-panda-red text-white' : 'bg-panda-red/10 text-panda-red'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="font-poppins text-sm font-bold text-panda-dark">
                No, solo el plan
              </p>
              <p className="font-poppins text-xs text-panda-gray mt-1 leading-relaxed">
                {selected.deviceWithoutCopy}
              </p>
              <span className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                !includeDevice ? 'border-panda-red bg-panda-red' : 'border-gray-300'
              }`}>
                {!includeDevice && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* CTA Continuar — mismo estilo que botón Pagar del checkout */}
      {selectedService && (
        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onContinue}
            className="group w-full sm:w-auto sm:inline-flex sm:mx-auto rounded-2xl bg-gradient-to-r from-panda-red to-panda-red-dark text-white font-bold py-4 px-8 text-base shadow-lg shadow-panda-red/40 hover:shadow-xl hover:shadow-panda-red/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            Ver planes disponibles
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── SectionHeader (mismo estilo que TiendaFlow checkout) ─────── */

function SectionHeader({
  number, icon, title, subtitle,
}: { number?: string; icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      {number && (
        <span className="font-unbounded text-xs font-bold text-panda-red bg-panda-red/10 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
          {number}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-unbounded text-base sm:text-lg font-bold text-panda-dark flex items-center gap-2">
          {icon && <span className="text-panda-red">{icon}</span>}
          {title}
        </p>
        {subtitle && <p className="font-poppins text-xs sm:text-sm text-panda-gray mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Mapea un Service del UI a `type` válido del CRM (verificado contra api.celink.mx 2026-05-06). */
export const SERVICE_TO_CRM_TYPE: Record<Service, string> = {
  movil: 'Movilidad',
  hbb:   'Internet en casa',
  mifi:  'MiFi',
};

/** Etiqueta legible del servicio. */
export const SERVICE_LABEL: Record<Service, string> = {
  movil: 'Telefonía móvil',
  hbb:   'Internet en casa',
  mifi:  'Internet portátil',
};

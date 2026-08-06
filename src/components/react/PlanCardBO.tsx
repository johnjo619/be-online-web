/**
 * PlanCardBO — la tarjeta de plan con el diseño de la home, pero alimentada
 * por el catálogo real del CRM.
 *
 * La home (PlanSelector) dibuja estas tarjetas con datos hardcodeados; la
 * tienda usaba otra tarjeta heredada del fork, roja (token `panda-red`), que
 * no pega con el amarillo/navy de Be Online. Este componente reusa el diseño
 * de la home para que contratar se vea igual que ver los planes.
 *
 * El color no viene del backend: se asigna por posición desde la misma paleta
 * que usa la home, de forma estable dentro de una misma lista.
 */
import type { Plan } from '../../lib/types';
import {
  getDataText,
  getMinutesText,
  getSMSText,
  getPlanDuration,
  getActiveSocialNetworks,
  cleanPlanName,
  isTruthy,
} from './planHelpers';
import NetworkIcon from './NetworkIcon';
import movies from '@/assets/images/popcorn.png';

/** Misma paleta y orden que PlanSelector en la home. */
const PALETTE = [
  { body: '#142035', header: '#FFCD54', icon: '#142035' },
  { body: '#EF4B23', header: '#142035', icon: '#ffffff' },
  { body: '#00A799', header: '#142035', icon: '#ffffff' },
  { body: '#FFCD54', header: '#142035', icon: '#142035', text: '#142035' },
  { body: '#7473C0', header: '#142035', icon: '#ffffff' },
  { body: '#E96BB0', header: '#142035', icon: '#ffffff' },
];

/**
 * El CRM nombra las ofertas como "4GB BO EXPLORER" o "BOMOBILE 12GB anual".
 * La tarjeta necesita los GB en el círculo y el nombre en el encabezado, así
 * que se separan. Si no hay patrón de GB se cae al texto de datos del plan.
 */
function splitName(plan: Plan): { badge: string; title: string } {
  const raw = cleanPlanName(plan.display_name || plan.name || '');
  const m = raw.match(/(\d+\s*GB)/i);
  const badge = m ? m[1].toUpperCase().replace(/\s+/g, ' ') : getDataText(plan);
  const title = raw.replace(/(\d+\s*GB)/i, '').replace(/\s{2,}/g, ' ').trim();
  return { badge, title: title || raw };
}

interface Props {
  plan: Plan;
  /** Posición en la lista — solo decide el color. */
  index?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function PlanCardBO({ plan, index = 0, isSelected = false, onSelect }: Props) {
  const c = PALETTE[index % PALETTE.length];
  const { badge, title } = splitName(plan);
  const networks = getActiveSocialNetworks(plan);
  // El CRM manda card_footer como "por 30 dias"; la card de la home dice solo "30 dias".
  const duration = getPlanDuration(plan).replace(/^por\s+/i, '');
  const hasMovies = isTruthy((plan as unknown as Record<string, unknown>).rs_included_movies);

  const features = [
    `Minutos y SMS ${getMinutesText(plan).toLowerCase() === 'ilimitados' && getSMSText(plan).toLowerCase() === 'ilimitados' ? 'ilimitados' : `${getMinutesText(plan)} / ${getSMSText(plan)}`}`,
    'Cobertura MEX, EUA, Canadá',
    'Internet para compartir',
    networks.length > 0 ? 'Redes sociales ilimitadas' : 'Plan sin redes sociales',
  ];

  return (
    <div
      className={`relative w-full max-w-[280px] rounded-2xl shadow-xl flex flex-col transition-transform ${
        isSelected ? 'ring-4 ring-[#FFCD54] scale-[1.02]' : ''
      }`}
      style={{ backgroundColor: c.body, color: c.text || 'white' }}
    >
      {/* Círculo con los GB */}
      <div className="absolute -top-4 -left-6 w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#142035] font-black text-2xl shadow-md z-10 tracking-tighter">
        {badge}
      </div>

      {/* Nombre del plan */}
      <div
        className="rounded-t-2xl my-2 mr-4 py-3 pl-12 pr-4 text-right font-semibold text-lg tracking-wide uppercase"
        style={{ backgroundColor: c.header, color: c.header === '#FFCD54' ? '#142035' : 'white' }}
      >
        {title}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <p className="font-bold text-sm text-left mb-4 tracking-wider">
          {`${badge} de 4.5G LTE`}
        </p>

        <ul className="text-xs space-y-1.5 mb-2 leading-tight">
          {features.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>

        {/* Redes sociales incluidas */}
        {networks.length > 0 && (
          <div className="flex justify-center items-center gap-1.5 mb-2 flex-wrap">
            {networks.map((network) => (
              <div
                key={network}
                className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center"
                style={{ backgroundColor: c.header, color: c.icon }}
              >
                <NetworkIcon network={network} className="w-3.5 h-3.5" />
              </div>
            ))}
            {hasMovies && <img src={movies.src} alt="" className="w-12 relative -top-2" />}
          </div>
        )}

        {/* Duración y precio — mismo tratamiento que la home */}
        <div className="relative flex-grow flex flex-col justify-center items-center gap-3 pt-2">
          <div className="absolute left-1/2 w-0.5 bg-[#FFCD54] -translate-x-1/2 h-5 top-1/2 -translate-y-1/2"></div>
          <button
            type="button"
            onClick={onSelect}
            aria-label={`Contratar ${title} — ${duration} por $${Number(plan.amount || 0).toFixed(0)} pesos`}
            className="relative z-10 w-full flex justify-center items-center text-md font-bold cursor-pointer hover:scale-105 transition-transform group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFCD54] rounded"
          >
            <span className="flex-1 text-right group-hover:text-white/80 pr-4 whitespace-nowrap">{duration}</span>
            <span className="flex-1 text-left underline decoration-2 underline-offset-4 group-hover:text-white/80 pl-4">
              ${Number(plan.amount || 0).toFixed(0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

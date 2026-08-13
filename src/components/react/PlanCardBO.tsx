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
} from './planHelpers';
import NetworkIcon from './NetworkIcon';
import CineGratis from './CineGratis';

/**
 * Color por NOMBRE de plan, igual que la home: la referencia de marca fija el
 * color de cada plan, asi que no puede depender de la posicion en la lista.
 */
const COLOR_POR_PLAN: Record<string, string> = {
  'BO EXPLORER': '#142035',
  'BO MERCURY': '#EF4B23',
  'BO APOLO': '#00A799',
  'BO ASTEROID': '#468BBC',
  'BO SUPERNOVA': '#7473C0',
  'BO COSMOS': '#E96BB0',
};

const RESPALDO = ['#142035', '#EF4B23', '#00A799', '#468BBC', '#7473C0', '#E96BB0'];

function colorDePlan(nombre: string, i: number): string {
  const clave = Object.keys(COLOR_POR_PLAN).find((k) => nombre.toUpperCase().includes(k));
  return clave ? COLOR_POR_PLAN[clave] : RESPALDO[i % RESPALDO.length];
}

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
  const { badge, title } = splitName(plan);
  const cuerpo = colorDePlan(title, index);
  const c = {
    body: cuerpo,
    header: cuerpo === '#142035' ? '#FFCD54' : '#142035',
    icon: cuerpo === '#142035' ? '#142035' : '#ffffff',
  };
  const networks = getActiveSocialNetworks(plan);
  // El CRM manda card_footer como "por 30 dias"; la card de la home dice solo "30 dias".
  const duration = getPlanDuration(plan).replace(/^por\s+/i, '');

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
      style={{ backgroundColor: c.body, color: 'white' }}
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
          <div className="flex justify-center items-center gap-1 mb-2 flex-wrap">
            {networks.map((network) => (
              <div
                key={network}
                className="w-[22px] h-[22px] shrink-0 rounded-full border border-white/20 flex items-center justify-center"
                style={{ backgroundColor: c.header, color: c.icon }}
              >
                <NetworkIcon network={network} className="w-3.5 h-3.5" />
              </div>
            ))}
            <CineGratis compacto />
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

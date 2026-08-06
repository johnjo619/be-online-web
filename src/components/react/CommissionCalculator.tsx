import { useMemo, useState } from 'react';

/**
 * Calculadora de comisiones dinámica para landing /distribuidor/.
 *
 * Modelo (basado en flyer oficial):
 *  - 20% sobre la activación (one-time, en la primera recarga)
 *  - 20% adicional en portabilidad (bono extra solo para clientes que portaron)
 *  - 10% mensual recurrente sobre TODAS las recargas de clientes activos
 *  - 5% en compra de tiempo aire (no incluido en cálculo simplificado — el
 *    usuario lo ve mencionado como "extra" en el breakdown final)
 *
 * Variables ajustables:
 *  - activacionesPorMes (10–500)
 *  - ticketPromedio MXN (recarga típica, 50–290, default $99)
 *  - mesProyectado (1–12)
 *  - portIn % (0–100, default 30%)
 *
 * Retención asumida: 90% mensual (típico móvil prepago). El usuario no la edita
 * para no abrumar — se menciona en la nota inferior.
 */

const RETENCION_MENSUAL = 0.9;
const COMISION_ACTIVACION = 0.20;
const COMISION_PORTABILIDAD = 0.20;
const COMISION_RECURRENTE = 0.10;
const BONUS_AIRTIME = 0.05;

/** Base de clientes activos acumulada al INICIO del mes m, con retención R. */
function clientesActivos(activacionesPorMes: number, mes: number, R = RETENCION_MENSUAL): number {
  let base = 0;
  for (let k = 1; k <= mes; k++) {
    base = base * R + activacionesPorMes;
  }
  return base;
}

function formatMXN(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

export default function CommissionCalculator() {
  const [activaciones, setActivaciones] = useState(100);
  const [ticket, setTicket] = useState(99);
  const [mes, setMes] = useState(6);
  const [portIn, setPortIn] = useState(30);

  const calc = useMemo(() => {
    const port = portIn / 100;
    const activos = clientesActivos(activaciones, mes);
    // Residuales = clientes de meses anteriores que siguen activos en este mes.
    // Total activos = residuales + nuevos de este mes.
    const nuevos = activaciones;
    const residuales = Math.max(activos - nuevos, 0);

    const comisionActivacion = activaciones * ticket * COMISION_ACTIVACION;
    const comisionPortabilidad = activaciones * port * ticket * COMISION_PORTABILIDAD;
    const comisionRecurrente = activos * ticket * COMISION_RECURRENTE;
    const totalMes = comisionActivacion + comisionPortabilidad + comisionRecurrente;

    // Serie 1..12 para el gráfico
    const serie = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const a = clientesActivos(activaciones, m);
      const ca = activaciones * ticket * COMISION_ACTIVACION;
      const cp = activaciones * port * ticket * COMISION_PORTABILIDAD;
      const cr = a * ticket * COMISION_RECURRENTE;
      return ca + cp + cr;
    });

    const acumulado12m = serie.reduce((s, v) => s + v, 0);

    return {
      activos,
      residuales,
      nuevos,
      comisionActivacion,
      comisionPortabilidad,
      comisionRecurrente,
      totalMes,
      serie,
      acumulado12m,
      maxSerie: Math.max(...serie),
    };
  }, [activaciones, ticket, mes, portIn]);

  return (
    <section id="calculadora" className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">

        {/* Encabezado */}
        <div className="text-center mb-12 sm:mb-14">
          <p className="font-poppins text-[11px] uppercase tracking-[0.2em] text-panda-red font-semibold mb-3">Simula tus ganancias</p>
          <h2 className="font-unbounded text-3xl sm:text-4xl md:text-5xl font-bold text-panda-dark mb-4 leading-tight">
            ¿Cuánto puedes ganar<br/>
            <span className="text-panda-red">como distribuidor?</span>
          </h2>
          <p className="font-poppins text-base sm:text-lg text-panda-gray max-w-2xl mx-auto">
            Mueve los controles para ver tu proyección real en tiempo real.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-10 items-start">

          {/* Controles */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7 sm:p-8 space-y-7">
            <h3 className="font-unbounded text-xl font-bold text-panda-dark mb-1">Tus parámetros</h3>

            <SliderField
              label="Activaciones por mes"
              value={activaciones}
              min={10} max={500} step={10}
              format={(v) => `${v} SIMs`}
              onChange={setActivaciones}
              hint="Cuántas líneas nuevas activas cada mes"
            />

            <SliderField
              label="Recarga promedio"
              value={ticket}
              min={50} max={290} step={5}
              format={formatMXN}
              onChange={setTicket}
              hint="Plan típico que venden tus clientes"
            />

            <SliderField
              label="Proyectar al mes"
              value={mes}
              min={1} max={12} step={1}
              format={(v) => `Mes ${v}`}
              onChange={setMes}
              hint="Ganancia residual crece con clientes acumulados"
              accent="green"
            />

            <SliderField
              label="¿Qué % son portabilidades?"
              value={portIn}
              min={0} max={100} step={5}
              format={(v) => `${v}%`}
              onChange={setPortIn}
              hint="Clientes que traen número de otra compañía"
            />
          </div>

          {/* Resultado */}
          <div className="space-y-6">

            {/* HERO RESULT — Total mes seleccionado */}
            <div className="bg-panda-red text-white rounded-3xl shadow-2xl shadow-panda-red/20 relative overflow-hidden">
              {/* TOP: ganancia */}
              <div className="px-7 sm:px-10 pt-8 sm:pt-10 pb-8 sm:pb-10 relative">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
                <p className="font-poppins text-xs uppercase tracking-[0.2em] opacity-80 mb-4 relative">
                  Tu ganancia · Mes {mes}
                </p>
                <span className="font-unbounded text-4xl sm:text-5xl md:text-6xl font-bold leading-none block tabular-nums relative">
                  {formatMXN(calc.totalMes)}
                </span>
                <p className="font-poppins text-sm opacity-85 mt-4 relative">
                  Acumulado en 12 meses: <strong className="text-white">{formatMXN(calc.acumulado12m)}</strong>
                </p>
              </div>

              {/* BOTTOM: desglose de base de clientes con separator */}
              <div className="border-t border-white/15 bg-black/15 px-7 sm:px-10 py-6">
                <p className="font-poppins text-[10px] uppercase tracking-[0.2em] opacity-75 mb-3">
                  Tu base de clientes en el mes {mes}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3">
                  <div className="text-center">
                    <p className="font-unbounded text-2xl sm:text-3xl font-bold leading-none tabular-nums">{Math.round(calc.residuales)}</p>
                    <p className="font-poppins text-[10px] uppercase tracking-wider opacity-75 mt-1">Residuales</p>
                  </div>
                  <span className="font-unbounded text-2xl opacity-50">+</span>
                  <div className="text-center">
                    <p className="font-unbounded text-2xl sm:text-3xl font-bold leading-none tabular-nums">{calc.nuevos}</p>
                    <p className="font-poppins text-[10px] uppercase tracking-wider opacity-75 mt-1">Nuevos</p>
                  </div>
                  <span className="font-unbounded text-2xl opacity-50">=</span>
                  <div className="text-center">
                    <p className="font-unbounded text-2xl sm:text-3xl font-bold leading-none tabular-nums text-panda-green">{Math.round(calc.activos)}</p>
                    <p className="font-poppins text-[10px] uppercase tracking-wider opacity-75 mt-1">Total activos</p>
                  </div>
                </div>
                <p className="font-poppins text-[11px] opacity-70 mt-4 leading-relaxed">
                  <strong>Residuales</strong> son clientes que activaste antes y siguen recargando ·
                  <strong> Nuevos</strong> son los de este mes. Ambos te generan comisiones.
                </p>
              </div>
            </div>

            {/* Breakdown 3 cards — stack en mobile, row en sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BreakdownCard
                tint="red"
                label="Activación"
                pct={`${(COMISION_ACTIVACION * 100).toFixed(0)}%`}
                amount={calc.comisionActivacion}
              />
              <BreakdownCard
                tint="amber"
                label="Portabilidad"
                pct={`${(COMISION_PORTABILIDAD * 100).toFixed(0)}%`}
                amount={calc.comisionPortabilidad}
              />
              <BreakdownCard
                tint="green"
                label="Recurrente"
                pct={`${(COMISION_RECURRENTE * 100).toFixed(0)}%`}
                amount={calc.comisionRecurrente}
                accent
              />
            </div>

            {/* Cómo crece tu ganancia mes a mes */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7 sm:p-8">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h4 className="font-unbounded font-bold text-panda-dark">Cómo crece tu ganancia</h4>
                <span className="font-poppins text-xs text-panda-gray">Tap el mes</span>
              </div>
              <p className="font-poppins text-sm text-panda-gray mb-6">
                Tu mes 12 será <strong className="text-panda-green">{(calc.serie[11] / calc.serie[0]).toFixed(1)}× más</strong> que tu primer mes — porque cada cliente activo sigue generando recargas.
              </p>

              <div className="flex items-end gap-1.5 h-40">
                {calc.serie.map((v, i) => {
                  const ratio = calc.maxSerie > 0 ? (v / calc.maxSerie) : 0;
                  const heightPct = Math.max(8, ratio * 100);
                  const isCurrent = i + 1 === mes;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMes(i + 1)}
                      title={`Mes ${i + 1}: ${formatMXN(v)}`}
                      style={{ height: `${heightPct}%` }}
                      className={`flex-1 rounded-t-lg transition-all duration-300 ease-out ${
                        isCurrent
                          ? 'bg-panda-red shadow-md shadow-panda-red/30'
                          : 'bg-gray-200 hover:bg-panda-red/50'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1.5 mt-3">
                {calc.serie.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMes(i + 1)}
                    className={`flex-1 text-center font-poppins text-[11px] py-1 rounded transition-colors ${
                      i + 1 === mes ? 'font-bold text-panda-red' : 'text-panda-gray hover:text-panda-dark'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Highlights inferiores: mes 1, mes seleccionado, mes 12 */}
              <div className="grid grid-cols-3 gap-3 mt-7 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="font-poppins text-[10px] uppercase tracking-wider text-panda-gray">Mes 1</p>
                  <p className="font-unbounded text-base font-bold text-panda-dark mt-1">{formatMXN(calc.serie[0])}</p>
                </div>
                <div className="text-center bg-panda-red/5 rounded-xl py-2">
                  <p className="font-poppins text-[10px] uppercase tracking-wider text-panda-red font-semibold">Mes {mes}</p>
                  <p className="font-unbounded text-base font-bold text-panda-red mt-1">{formatMXN(calc.totalMes)}</p>
                </div>
                <div className="text-center">
                  <p className="font-poppins text-[10px] uppercase tracking-wider text-panda-gray">Mes 12</p>
                  <p className="font-unbounded text-base font-bold text-panda-green mt-1">{formatMXN(calc.serie[11])}</p>
                </div>
              </div>
            </div>

            <p className="font-poppins text-xs text-panda-gray text-center px-4 leading-relaxed">
              Cálculo asume retención mensual del 90% (típica en móvil prepago) y no incluye el
              bonus de <strong>{(BONUS_AIRTIME * 100).toFixed(0)}%</strong> en tiempo aire — todo
              eso es ganancia extra. Resultados estimados, varían según tu zona y esfuerzo.
            </p>
          </div>
        </div>

        {/* CTA después del simulador */}
        <div className="mt-12 sm:mt-14 text-center">
          <a
            href="#solicitud"
            className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-panda-red text-white font-bold text-lg hover:bg-panda-red-dark transition-colors shadow-lg shadow-panda-red/30"
          >
            Quiero empezar a ganar
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/** Slider con label + valor formateado + barra de progreso visual. */
function SliderField({
  label, value, min, max, step, format, onChange, hint, accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
  accent?: 'red' | 'green';
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackColor = accent === 'green' ? 'bg-panda-green' : 'bg-panda-red';
  const dotColor = accent === 'green' ? 'border-panda-green' : 'border-panda-red';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="font-poppins text-sm font-semibold text-panda-dark">{label}</label>
        <span className="font-unbounded text-lg font-bold text-panda-dark">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none cursor-pointer h-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-panda-red/30"
        style={{ background: `linear-gradient(to right, ${accent === 'green' ? '#00A799' : '#142035'} 0%, ${accent === 'green' ? '#00A799' : '#142035'} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)` }}
      />
      {hint && <p className="font-poppins text-xs text-panda-gray mt-2.5">{hint}</p>}
    </div>
  );
}

function BreakdownCard({
  tint, label, pct, amount, accent,
}: {
  tint: 'red' | 'amber' | 'green';
  label: string;
  pct: string;
  amount: number;
  accent?: boolean;
}) {
  const tintMap = {
    red:   { bg: 'bg-panda-red/5',   border: 'border-panda-red/20',   text: 'text-panda-red',   pill: 'bg-panda-red text-white' },
    amber: { bg: 'bg-[#FFCD54]/5',   border: 'border-[#FFCD54]/20',   text: 'text-[#142035]',   pill: 'bg-[#FFCD54] text-white' },
    green: { bg: 'bg-panda-green/5', border: 'border-panda-green/20', text: 'text-panda-green', pill: 'bg-panda-green text-white' },
  } as const;
  const c = tintMap[tint];
  return (
    <div className={`relative rounded-2xl border ${c.border} ${c.bg} p-5 sm:p-6 ${accent ? 'ring-2 ring-panda-green/30' : ''}`}>
      <div className={`inline-block ${c.pill} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3`}>{pct}</div>
      <p className="font-poppins text-[11px] uppercase tracking-wider text-panda-gray font-semibold mb-1.5">{label}</p>
      <p className={`font-unbounded text-xl sm:text-2xl font-bold ${c.text}`}>{formatMXN(amount)}</p>
      {accent && <span className="absolute top-3 right-3 inline-block text-panda-green font-bold text-[10px] uppercase">★ mensual</span>}
    </div>
  );
}

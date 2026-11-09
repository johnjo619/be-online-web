import { appLinks } from '../../data/apps';

/**
 * Después de la compra: cómo se activan los beneficios (cine 2x1 y asistencias Be Protected).
 *
 * No se activan solos. Las asistencias necesitan los datos del titular (el proveedor, PLUUS, pide
 * CURP, RFC y domicilio para registrarlo) y los boletos de cine sólo se piden ahí. Las dos cosas se
 * hacen ÚNICAMENTE en la app Be Online o en app.beonline.mx, sección Beneficios (decisión del dueño,
 * 9-nov-2026): esta tienda no pide ni guarda esos datos.
 *
 * La página de pago no sabe qué plan se compró (el estado de la orden sólo trae total y estado),
 * por eso el texto arranca con "¿Tu plan incluye…?".
 */
const APP_WEB_BENEFICIOS = 'https://app.beonline.mx/beneficios';

export default function ActivaBeneficios() {
  return (
    <section
      aria-labelledby="activa-beneficios"
      className="text-left rounded-2xl border-2 border-[#FFCD54] bg-[#FFCD54]/15 p-5 font-poppins"
    >
      <h2 id="activa-beneficios" className="font-unbounded text-base font-bold text-[#142035] leading-snug">
        ¿Tu plan incluye cine 2x1 o Be Protected?
      </h2>
      <p className="mt-1 text-sm text-[#142035]">
        Actívalos en la app Be Online o en app.beonline.mx, en Beneficios:
      </p>
      <ul className="mt-3 space-y-2 text-sm text-[#142035]">
        <li>
          <span className="font-semibold">Asistencias:</span> registra tus datos (CURP, RFC y domicilio). Sin ellos no se
          activan.
        </li>
        <li>
          <span className="font-semibold">Cine 2x1:</span> ahí pides tus boletos.
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={APP_WEB_BENEFICIOS}
          className="inline-flex min-h-[44px] items-center px-5 rounded-full bg-[#142035] text-white text-sm font-bold"
        >
          Ir a Beneficios
        </a>
        {appLinks.map((app) => (
          <a
            key={app.store}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={app.badgeAlt}
            className="inline-flex min-h-[44px] items-center px-4 rounded-full border-2 border-[#142035] text-[#142035] text-sm font-semibold"
          >
            {app.label}
          </a>
        ))}
      </div>
    </section>
  );
}

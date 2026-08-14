/**
 * Sello "Cine Gratis" de las tarjetas de plan.
 *
 * ⚠️ PROVISIONAL — SOLO VISTA. Hoy se pinta en TODOS los planes de forma fija.
 *
 * El beneficio lo da la aseguradora/asistencia y todavia no existe la
 * integracion: no hay campo en `offers`, el API no lo manda y el CRM no tiene
 * donde prenderlo o apagarlo. Se acordo dejarlo solo en la vista web para la
 * entrega (2026-08-13).
 *
 * Cuando exista el campo del CRM, esto se vuelve condicional en UN solo lugar:
 * cambiar `<CineGratis />` por `{plan.cine && <CineGratis />}` en PlanSelector y
 * PlanCardBO, y borrar este aviso. No hay ningun otro punto que tocar.
 */
import cineGratis from '@/assets/images/cine-gratis.png';
import movies from '@/assets/images/popcorn.png';

/**
 * Planes SIN asistencia que incluyen Cine Gratis.
 *
 * En Be Protected lo llevan TODOS. En los planes normales NO: solo estos dos,
 * los que indico la marca ("no aparece el cine en el de 4 y en el de 12").
 * Vive aqui para que la home y la tienda usen la MISMA lista.
 */
export const PLANES_CON_CINE = ['BO MERCURY', 'BO APOLO'];

/** ¿Este plan lleva el sello? Tolera "4GB BO MERCURY" y "BO MERCURY". */
export function llevaCine(nombre: string | undefined): boolean {
  const n = (nombre || '').toUpperCase();
  return PLANES_CON_CINE.some((p) => n.includes(p));
}

interface Props {
  /** Tamano del sello. Las tarjetas de la tienda son mas chicas que las de la home. */
  compacto?: boolean;
  /** Posicionamiento. En la referencia va a la derecha de las redes, en la MISMA fila. */
  className?: string;
}

export default function CineGratis({ compacto = false, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
      aria-label="Incluye cine gratis"
    >
      <img
        src={movies.src}
        alt=""
        aria-hidden="true"
        className={compacto ? 'w-9' : 'w-11'}
      />
      <img
        src={cineGratis.src}
        alt="Cine gratis"
        className={compacto ? 'w-10 h-10' : 'w-[52px] h-[52px]'}
      />
    </span>
  );
}

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

interface Props {
  /** Tamano del sello. Las tarjetas de la tienda son mas chicas que las de la home. */
  compacto?: boolean;
}

export default function CineGratis({ compacto = false }: Props) {
  return (
    <span className="inline-flex items-center gap-1 shrink-0" aria-label="Incluye cine gratis">
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

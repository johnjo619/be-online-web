/**
 * PrecioDesde — pinta el precio mas bajo del catalogo REAL del CRM.
 *
 * Existe para que ningun "desde $X" quede escrito a mano. Antes habia precios
 * fijos repartidos por el sitio ($99/mes, $50, $199, $299...) que no salian de
 * ningun lado y quedaron desfasados del catalogo.
 *
 * Si el CRM no devuelve ofertas para ese tipo/grupo no inventa nada: no pinta.
 * Es a proposito — un precio inventado es peor que ningun precio.
 */
import { useEffect, useState } from 'react';
import { getPlans } from '../../lib/api';

interface Props {
  /** Tipo del CRM: 'Movilidad' | 'MiFi' | ... */
  tipo?: string;
  /** Filtra por grupo del catalogo: 'Exprés', 'Mensual', 'Anual'. */
  grupo?: string;
  /**
   * Filtra por vigencia en meses. El grupo "Anual" del CRM trae 3, 6 y 12
   * meses, asi que sin esto un "desde ... /año" mostraria el precio de 3 meses.
   */
  meses?: number;
  /** Texto tras el precio, p.ej. "/mes" o "/3 días". */
  sufijo?: string;
  /** Clases del precio. */
  className?: string;
  /** Clases del sufijo. */
  sufijoClassName?: string;
}

export default function PrecioDesde({
  tipo = 'Movilidad',
  grupo,
  meses,
  sufijo,
  className = '',
  sufijoClassName = '',
}: Props) {
  const [monto, setMonto] = useState<number | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    getPlans(tipo)
      .then((ofertas) => {
        if (cancelado) return;
        let candidatas = grupo
          ? ofertas.filter((o) => (o.group_name || '').toLowerCase() === grupo.toLowerCase())
          : ofertas;
        if (meses) {
          candidatas = candidatas.filter(
            (o) => o.interval === 'month' && Number(o.interval_count) === meses,
          );
        }
        const montos = candidatas
          .map((o) => Number(o.amount) || 0)
          .filter((n) => n > 0);
        setMonto(montos.length ? Math.min(...montos) : null);
        setListo(true);
      })
      .catch(() => {
        if (!cancelado) setListo(true);
      });
    return () => { cancelado = true; };
  }, [tipo, grupo, meses]);

  // Mientras carga deja el hueco reservado para no mover el layout.
  if (!listo) return <span className={className} aria-hidden="true">&nbsp;</span>;
  if (monto === null) return null;

  return (
    <span className={className}>
      ${monto.toLocaleString('es-MX')}
      {sufijo && <span className={sufijoClassName}>{sufijo}</span>}
    </span>
  );
}

import { useState } from 'react';
import type { Plan } from '../../lib/types';
import {
  type ServiceType,
  isTruthy,
  getDataText,
  getMinutesText,
  getSMSText,
  getPlanDuration,
  getActiveSocialNetworks,
  esSoloDatos,
} from './planHelpers';
import NetworkIcon from './NetworkIcon';

interface PlanCardProps {
  plan: Plan;
  service: ServiceType;
  /** Si se pasa, la tarjeta es seleccionable y muestra estado activo */
  isSelected?: boolean;
  /** Click en la tarjeta o el CTA. Si no se pasa y `ctaHref` está, el CTA actúa como link. */
  onSelect?: () => void;
  /** Si se pasa, el CTA es un <a href> en vez de botón. */
  ctaHref?: string;
  /** Texto del CTA. Por defecto "¡Lo quiero!" */
  ctaLabel?: string;
  /** Variante de presentación */
  variant?: 'default' | 'compact' | 'home';
}

export default function PlanCard({
  plan,
  service,
  isSelected = false,
  onSelect,
  ctaHref,
  ctaLabel,
  variant = 'default',
}: PlanCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const data = getDataText(plan);
  const duration = getPlanDuration(plan);
  const popular = isTruthy(plan.is_popular);
  const buttonLabel = ctaLabel || plan.card_button || '¡Lo quiero!';
  const isClickable = !!onSelect;
  const isHome = variant === 'home';

  const cardWidth = isHome ? 280 : variant === 'compact' ? 280 : 300;
  const cardMinHeight = isHome ? 340 : service === 'movil' ? 460 : 380;

  const handleCardClick = () => {
    if (isClickable) onSelect?.();
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex flex-col ${isClickable ? 'cursor-pointer' : ''}`}
      style={{
        background: '#FFFFFF',
        borderRadius: isHome ? '10px' : '20px',
        boxShadow: isSelected
          ? '0 12px 40px rgba(236,49,67,0.25)'
          : isHovered
            ? '0 12px 40px rgba(0,0,0,0.15)'
            : isHome
              ? '0 10px 24px rgba(21, 22, 34, 0.14)'
              : '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        transform: isSelected ? 'translateY(-6px)' : isHovered ? 'translateY(-4px)' : 'translateY(0)',
        width: '100%',
        maxWidth: `${cardWidth}px`,
        minHeight: `${cardMinHeight}px`,
        outline: isSelected ? (isHome ? '2px solid #00A799' : '3px solid #00A799') : 'none',
        outlineOffset: isHome ? '-2px' : '-3px',
        flexShrink: 0,
      }}
    >
      {/* HEADER */}
      <div
        className="relative text-center"
        style={{
          background: isHome ? '#EF4B23' : '#EF4B23',
          padding: isHome ? '18px 14px 12px' : '20px 16px',
        }}
      >
        {popular && (
          <div className={`absolute flex items-center gap-1 bg-white/20 ${isHome ? 'top-1.5 right-1.5 px-1.5 py-0.5 rounded-md' : 'top-2.5 right-2.5 px-2.5 py-1 rounded-xl'}`}>
            <svg className="w-3 h-3 text-[#FFCD54]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={`text-white font-semibold ${isHome ? 'text-[8px]' : 'text-[10px]'}`}>Popular</span>
          </div>
        )}

        <p className={`text-white/95 font-bold ${isHome ? 'text-[11px] mb-2 leading-tight' : 'text-sm mb-2'}`}>{plan.card_title || plan.display_name || plan.name}</p>

        <div className="flex items-baseline justify-center">
          <span className={`text-white font-extrabold leading-none ${isHome ? 'text-[44px]' : 'text-[52px]'}`}>{data}</span>
          <span className={`text-white/90 font-semibold ml-0.5 ${isHome ? 'text-[13px]' : 'text-xl'}`}>GB</span>
        </div>

        <div className={`inline-flex items-center gap-1 bg-white/15 ${isHome ? 'px-2.5 py-1 rounded-full mt-2' : 'px-3.5 py-1.5 rounded-2xl mt-3'}`}>
          <svg className={`${isHome ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-white font-semibold ${isHome ? 'text-[10px]' : 'text-xs'}`}>{duration}</span>
        </div>
      </div>

      {/* BODY */}
      <div className={`${isHome ? 'px-4 pb-4 pt-3 text-panda-dark' : 'px-4 py-4'} flex-1 flex flex-col`}>
        {/* Precio */}
        <div className={`flex items-baseline justify-center ${isHome ? 'mb-3' : 'mb-3.5'}`}>
          <span className={`${isHome ? 'text-[18px]' : 'text-xl'} font-semibold text-panda-red`}>$</span>
          <span className={`${isHome ? 'text-[36px]' : 'text-4xl'} font-extrabold text-panda-red mx-0.5`}>
            {Number(plan.amount || 0).toFixed(0)}
          </span>
          <span className={`${isHome ? 'text-[11px]' : 'text-sm'} font-medium text-panda-gray ml-0.5`}>MXN</span>
        </div>

        {/* Features según servicio */}
        {service === 'movil' && <MovilFeatures plan={plan} inverted={isHome} />}
        {service === 'mifi' && <MiFiFeatures />}

        {plan.card_body && (
          <p className={`${isHome ? 'text-[10px] text-panda-gray mb-3' : 'text-[11px] text-panda-gray mb-3'} text-center leading-snug`}>{plan.card_body}</p>
        )}

        {/* CTA */}
        {ctaHref ? (
          <a
            href={ctaHref}
            target={ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`${isHome ? 'py-3 min-h-[44px] rounded-lg text-white text-[13px]' : 'py-3.5 min-h-[48px] rounded-2xl text-white text-[15px]'} w-full border-none font-bold flex items-center justify-center gap-2 transition-all mt-auto no-underline`}
            style={{
              background: isSelected ? '#00A799' : '#EF4B23',
              opacity: isHovered && !isSelected ? 0.9 : 1,
              transform: isHovered && !isSelected ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {buttonLabel}
            {!isHome && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </a>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`${isHome ? 'py-3 min-h-[44px] rounded-lg text-white text-[13px]' : 'py-3.5 min-h-[48px] rounded-2xl text-white text-[15px]'} w-full border-none font-bold flex items-center justify-center gap-2 transition-all mt-auto`}
            style={{
              background: isSelected ? '#00A799' : '#EF4B23',
              opacity: isHovered && !isSelected ? 0.9 : 1,
              transform: isHovered && !isSelected ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {isSelected ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Seleccionado
              </>
            ) : (
              <>
                {buttonLabel}
                {!isHome && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes de features ──────────────────────────

function MovilFeatures({ plan, inverted = false }: { plan: Plan; inverted?: boolean }) {
  const socialNetworks = getActiveSocialNetworks(plan);
  // Doble candado: el llamador ya monta esto solo con service==='movil', pero
  // si la oferta se declara MiFi/HBB no se pinta voz ni SMS de ninguna forma.
  const soloDatos = esSoloDatos(plan);
  // Sin dato real no hay tile. El fallback viejo decia "Ilimitados" cuando
  // `call_national_limit` era 0 — que es su valor en todo el catalogo.
  const minutos = soloDatos ? null : getMinutesText(plan);
  const sms = soloDatos ? null : getSMSText(plan);
  return (
    <>
      {(minutos || sms) && (
        <div className={`flex justify-evenly gap-2 ${inverted ? 'mb-3' : 'mb-3.5'}`}>
          {minutos && (
            <FeatureMini
              label="Minutos"
              value={minutos}
              iconPath="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              inverted={inverted}
            />
          )}
          {sms && (
            <FeatureMini
              label="SMS"
              value={sms}
              iconPath="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              inverted={inverted}
            />
          )}
        </div>
      )}

      <div className={`${inverted ? 'mb-3 min-h-[50px]' : 'mb-3.5 min-h-[55px]'} flex-1`}>
        {socialNetworks.length > 0 ? (
          <>
            <p className={`${inverted ? 'text-[11px] text-panda-gray mb-2' : 'text-xs text-gray-500 mb-2.5'} font-semibold text-center`}>
              {plan.card_footer && /redes/i.test(plan.card_footer) ? plan.card_footer : 'Redes sociales incluidas'}
            </p>
            <div className={`flex justify-center flex-wrap ${inverted ? 'gap-1' : 'gap-1.5'}`}>
              {socialNetworks.map((network) => (
                <div
                  key={network}
                  className={`${inverted ? 'w-[20px] h-[20px] rounded-[5px] border border-panda-red bg-white' : 'w-[30px] h-[30px] rounded-[9px] bg-panda-red'} flex items-center justify-center`}
                >
                  <NetworkIcon network={network} className={inverted ? 'w-[12px] h-[12px] text-panda-red' : undefined} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={`${inverted ? 'text-[10px] text-panda-gray' : 'text-xs text-panda-gray'} text-center italic`}>Plan sin redes sociales</p>
        )}
      </div>
    </>
  );
}

function MiFiFeatures() {
  return (
    <div className="space-y-3 mb-3.5 flex-1">
      <FeatureRow
        title="Hasta 10 dispositivos"
        subtitle="Comparte WiFi 4G LTE"
        iconPath="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
      />
      <FeatureRow
        title="Batería 12 horas"
        subtitle="Recargable USB-C"
        iconPath="M13 10V3L4 14h7v7l9-11h-7z"
      />
      <FeatureRow
        title="Sin permanencia"
        subtitle="Cancelas cuando quieras"
        iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </div>
  );
}

function FeatureMini({ label, value, iconPath, inverted = false }: { label: string; value: string; iconPath: string; inverted?: boolean }) {
  return (
    <div className={`flex items-center ${inverted ? 'gap-1' : 'gap-2'} flex-1`}>
      <div className={`${inverted ? 'w-[24px] h-[24px] rounded-[6px] bg-panda-red/10' : 'w-[34px] h-[34px] rounded-[10px] bg-panda-red/10'} flex items-center justify-center flex-shrink-0`}>
        <svg className={`${inverted ? 'w-3.5 h-3.5 text-panda-red' : 'w-4 h-4 text-panda-red'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
        </svg>
      </div>
      <div>
        <p className={`${inverted ? 'text-[11px] text-panda-dark' : 'text-xs text-panda-dark'} font-bold leading-tight`}>{value}</p>
        <p className={`${inverted ? 'text-[11px] text-panda-gray' : 'text-[10px] text-panda-gray'} leading-tight`}>{label}</p>
      </div>
    </div>
  );
}

function FeatureRow({ title, subtitle, iconPath }: { title: string; subtitle: string; iconPath: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[34px] h-[34px] rounded-[10px] bg-panda-red/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-panda-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold text-panda-dark">{title}</p>
        <p className="text-[10px] text-panda-gray">{subtitle}</p>
      </div>
    </div>
  );
}

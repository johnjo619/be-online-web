import { useState, useEffect, useRef, useCallback } from 'react';
import { getBanners } from '../../lib/api';
import type { Banner } from '../../lib/types';

const ROTATE_MS = 7000;

interface CtaProp {
  label: string;
  href: string;
  external?: boolean;
}

interface Props {
  section?: string;
  limit?: number;
  /** Imagen de fondo de asientos de cine para el fallback. */
  fallbackImage: string;
  /** Imagen del astronauta con palomitas para el fallback. */
  fallbackSideImage: string;
  preHeadline?: string;
  headlineHighlight?: string;
  headlineMain?: string;
  subHeadline?: string;
  disclaimer?: string;
  primaryCta?: CtaProp;
  secondaryCta?: CtaProp;
  compact?: boolean;
}

const DEFAULTS = {
  section: 'home',
  limit: 10,
  preHeadline: 'El plan que rinde más:\ncontrata hoy y llévate',
  headlineHighlight: 'GRATIS',
  headlineMain: '2 BOLETOS de\nCINE AL MES',
  subHeadline: 'con tu plan de 4Gb o 12Gb.',
  disclaimer: '*Planes de 30 días en adelante.',
};

export default function HeroBanner({
  section = DEFAULTS.section,
  limit = DEFAULTS.limit,
  fallbackImage,
  fallbackSideImage,
  preHeadline = DEFAULTS.preHeadline,
  headlineHighlight = DEFAULTS.headlineHighlight,
  headlineMain = DEFAULTS.headlineMain,
  subHeadline = DEFAULTS.subHeadline,
  disclaimer = DEFAULTS.disclaimer,
  primaryCta = DEFAULTS.primaryCta,
  secondaryCta,
  compact = false,
}: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const paused = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getBanners(section, limit)
      .then((data) => {
        if (cancelled) return;
        setBanners(data);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [section, limit]);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      if (!paused.current) {
        setCurrent((c) => (c + 1) % banners.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  const goTo = useCallback((i: number) => setCurrent(i), []);

  if (!loaded || banners.length === 0) {
    const SecondaryWrapper = secondaryCta?.external ? 'a' : 'a';
    const secondaryProps = secondaryCta?.external
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};

    return (
      <section className={`relative flex items-center ${compact ? 'min-h-[420px] md:min-h-[500px] lg:min-h-[600px] pt-[48px]' : 'min-h-[460px] md:min-h-[540px] lg:min-h-[650px] pt-[72px]'} bg-[#0a1118] overflow-hidden`}>

        {/* Imagen de fondo (Asientos de cine) */}
        <img
          src={fallbackImage}
          alt="Promoción Cine"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          width="1922"
          height="754"
          loading="eager"
          fetchPriority="high"
        />

        {/* Gradiente oscuro a la izquierda para legibilidad del texto */}
        <div className="absolute inset-y-0 left-0 w-full md:w-2/3 bg-black/65 md:via-black/40 to-transparent pointer-events-none" />

        {/* Cuadrícula de dos columnas: Texto a la izquierda, Astronauta a la derecha */}
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-8 items-center w-full">
          {/* Columna de texto (lado izquierdo) */}
          <div className="text-white pt-8 md:pt-0">

            {preHeadline && (
              <p className="text-lg md:text-2xl font-poppins mb-1 leading-snug whitespace-pre-line drop-shadow-md">
                {preHeadline}
              </p>
            )}

            <h1 className={`${compact ? 'text-4xl md:text-5xl' : 'text-5xl sm:text-5xl md:text-6xl'} font-unbounded font-black leading-[1.05] drop-shadow-xl mb-3 tracking-tight`}>
              {/* "GRATIS" en amarillo dorado */}
              {headlineHighlight && <span className="text-[#FFCD54] block">{headlineHighlight}</span>}
              <span className="text-white whitespace-pre-line block">{headlineMain}</span>
            </h1>

            {subHeadline && (
              <p className="text-xl md:text-2xl font-poppins mb-1 drop-shadow-md">
                {subHeadline}
              </p>
            )}

            {disclaimer && (
              <p className="text-sm  text-white/90 font-poppins drop-shadow-md">
                {disclaimer}
              </p>
            )}
            <p className="text-[0.5rem] text-white/90 font-poppins drop-shadow-md">
              Promoción válida durante los primeros 6 meses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {primaryCta && (
                <a
                  href={primaryCta.href}
                  {...(primaryCta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`${compact ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-base'} inline-flex items-center justify-center rounded-full bg-[#142035] text-white font-bold hover:bg-black transition-colors shadow-xl`}
                >
                  {primaryCta.label}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              )}
              {secondaryCta && (
                <SecondaryWrapper
                  href={secondaryCta.href}
                  {...secondaryProps}
                  className={`${compact ? 'px-4 py-2.5 text-xs' : 'px-6 py-4 text-sm'} inline-flex items-center justify-center rounded-full border border-white/40 text-white font-medium hover:bg-white/15 transition-colors`}
                >
                  {secondaryCta.label}
                </SecondaryWrapper>
              )}
            </div>
          </div>

          {/* Columna derecha: Imagen del astronauta */}
          <div className="relative h-full flex items-center justify-center md:items-end"> {/* Ajuste para parecer sentado */}
            <img
              src={fallbackSideImage}
              alt="Astronauta con palomitas y smartphone"
              className="w-[320px] "
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>
    );
  }

  const b = banners[current];
  const Wrapper = b.link_url ? 'a' : 'div';
  const wrapperProps = b.link_url
    ? {
      href: b.link_url,
      target: b.link_target || '_self',
      ...(b.link_target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
    }
    : {};

  return (
    <section
      className={`relative ${compact ? 'min-h-[420px] md:min-h-[500px] lg:min-h-[565px] pt-[48px]' : 'min-h-[460px] md:min-h-[540px] lg:min-h-[650px] pt-[72px]'} flex items-center overflow-hidden bg-[#142035]`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {banners.map((banner, i) => (
        <picture
          key={banner.slug}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'
            }`}
        >
          {banner.images?.mobile && (
            <source media="(max-width: 639px)" srcSet={banner.images.mobile} />
          )}
          {banner.images?.tablet && (
            <source media="(max-width: 1023px)" srcSet={banner.images.tablet} />
          )}
          <img
            src={banner.images?.desktop || banner.images?.tablet || banner.images?.mobile || ''}
            alt={banner.alt || banner.title}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </picture>
      ))}

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative max-w-6xl mx-auto px-6 w-full">
        <Wrapper
          {...wrapperProps}
          className={`block ${b.link_url ? 'cursor-pointer' : ''}`}
        >
          {b.title && (
            <h2 className="font-unbounded text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 max-w-2xl drop-shadow-xl">
              {b.title}
            </h2>
          )}
          {b.link_url && (
            <span className="inline-flex items-center px-8 py-4 rounded-full bg-[#FFCD54] text-gray-900 font-bold text-lg hover:bg-[#FFCD54] transition-colors shadow-lg font-poppins">
              {b.link_text || 'Ver más'}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          )}
        </Wrapper>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === current
                ? 'bg-[#FFCD54] scale-125'
                : 'bg-white/50 hover:bg-white/80'
                }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Banner anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Banner siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
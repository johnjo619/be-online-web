import { useState, useEffect, useCallback, useRef } from 'react';
import { getBanners } from '../../lib/api';
import type { Banner } from '../../lib/types';

const STORAGE_KEY = 'panda-banner-dismissed';
const ROTATE_MS = 6000;

export default function DynamicBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const paused = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setDismissed(true);
        setLoaded(true);
        return;
      }
    } catch { /* SSR or private browsing */ }
    getBanners('top', 5)
      .then((data) => {
        setBanners(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      if (!paused.current) {
        setCurrent((c) => (c + 1) % banners.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  // Set CSS variable for header offset.
  // Mobile: h-9 = 36px, tablet+: h-11 = 44px. Updated en resize para que
  // matchee con la altura real del banner que ve el usuario.
  useEffect(() => {
    const update = () => {
      if (dismissed || banners.length === 0) {
        document.documentElement.style.setProperty('--banner-h', '0px');
        return;
      }
      const isMobile = window.matchMedia('(max-width: 639px)').matches;
      document.documentElement.style.setProperty('--banner-h', isMobile ? '36px' : '44px');
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      document.documentElement.style.setProperty('--banner-h', '0px');
    };
  }, [dismissed, banners.length]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* private browsing */ }
  }, []);

  if (!loaded || dismissed || banners.length === 0) return null;

  const b = banners[current];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-9 sm:h-11 bg-gradient-to-r from-[#ec3143] to-[#a13a42] flex items-center justify-center px-10 sm:px-12 transition-opacity duration-300"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="flex items-center gap-2 text-white font-poppins text-xs sm:text-sm font-semibold truncate">
        <span className="truncate">{b.title}</span>
        {b.link_url && (
          <a
            href={b.link_url}
            className="underline font-bold hover:no-underline whitespace-nowrap"
          >
            {b.link_text || 'Ver más'}
          </a>
        )}
      </div>

      {/* Dots for multiple banners */}
      {banners.length > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}

      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar banner"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

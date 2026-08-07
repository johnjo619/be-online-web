/** Host canónico del sitio. Hoy es el de staging (basic auth + noindex);
 *  cambiar aquí y en astro.config.mjs / robots.txt al pasar a producción. */
export const SITE_URL = 'https://beonline.celink.mx';
export const BRAND_NAME = 'Be Online';
/** Razón social que ya declaran las páginas legales. */
export const LEGAL_NAME = 'Celink Telecom S.A. de C.V.';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    legalName: LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    email: 'info@beonline.mx',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@beonline.mx',
      contactType: 'customer service',
      areaServed: 'MX',
      availableLanguage: 'Spanish',
    },
  };
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: BRAND_NAME,
    image: `${SITE_URL}/favicon.png`,
    url: SITE_URL,
    email: 'info@beonline.mx',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. Revolución 1267, piso 19, Col. Los Alpes',
      addressLocality: 'Álvaro Obregón',
      addressRegion: 'CDMX',
      postalCode: '01040',
      addressCountry: 'MX',
    },
    areaServed: { '@type': 'Country', name: 'México' },
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: SITE_URL,
    inLanguage: 'es-MX',
  };
}

export interface RangoPrecios {
  min: number;
  max: number;
  total: number;
}

/**
 * Los rangos de precio del JSON-LD se pasan desde la pagina, que los lee del
 * CRM en build (lib/catalogo-build). Antes estaban escritos a mano y quedaron
 * desfasados del catalogo. Si no llega el dato se omite `offers`: un rango
 * inventado en datos estructurados es peor que no declararlos.
 */
export function productAggregateSchema(rango?: RangoPrecios | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Planes de Telefonía Móvil Be Online',
    description: 'Planes de telefonía móvil e internet portátil MiFi con cobertura nacional en México.',
    brand: { '@type': 'Brand', name: BRAND_NAME },
    ...(rango
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'MXN',
            lowPrice: String(rango.min),
            highPrice: String(rango.max),
            offerCount: rango.total,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    category: 'Telefonía Móvil',
  };
}

export type ServiceKey = 'telefonia' | 'mifi';

export function serviceProductSchema(service: ServiceKey, rango?: RangoPrecios | null) {
  const data: Record<ServiceKey, { name: string; description: string; category: string }> = {
    'telefonia': {
      name: 'Planes de Telefonía Móvil Be Online',
      description: 'Planes prepago de telefonía móvil con redes sociales ilimitadas, cobertura 4G LTE nacional y sin contratos.',
      category: 'Mobile Phone Plan',
    },
    'mifi': {
      name: 'Internet Portátil MiFi Be Online',
      description: 'Dispositivo MiFi con plan de datos para llevar Wi-Fi a donde vayas. Hasta 10 dispositivos conectados.',
      category: 'Portable Wi-Fi',
    },
  };
  const d = data[service];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.name,
    description: d.description,
    brand: { '@type': 'Brand', name: BRAND_NAME },
    category: d.category,
    ...(rango
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'MXN',
            lowPrice: String(rango.min),
            highPrice: String(rango.max),
            offerCount: rango.total,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

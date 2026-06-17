export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Panda Movil',
    url: 'https://pandamovil.mx',
    logo: 'https://pandamovil.mx/favicon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+52-442-644-1052',
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
    name: 'Panda Movil',
    image: 'https://pandamovil.mx/favicon.png',
    url: 'https://pandamovil.mx',
    telephone: '+52-442-644-1052',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Querétaro',
      addressRegion: 'QRO',
      addressCountry: 'MX',
    },
    areaServed: { '@type': 'Country', name: 'México' },
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Panda Movil',
    url: 'https://pandamovil.mx',
    inLanguage: 'es-MX',
  };
}

export function productAggregateSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Planes de Telefonía Móvil Panda Movil',
    description: 'Planes de telefonía móvil, internet en casa y MiFi con cobertura nacional en México.',
    brand: { '@type': 'Brand', name: 'Panda Movil' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MXN',
      lowPrice: '50',
      highPrice: '599',
      offerCount: 20,
      availability: 'https://schema.org/InStock',
    },
    category: 'Telefonía Móvil',
  };
}

export type ServiceKey = 'telefonia' | 'internet-hogar' | 'mifi';

export function serviceProductSchema(service: ServiceKey) {
  const data: Record<ServiceKey, { name: string; description: string; lowPrice: string; highPrice: string; category: string; offerCount: number }> = {
    'telefonia': {
      name: 'Planes de Telefonía Móvil Be Online',
      description: 'Planes prepago de telefonía móvil con redes sociales ilimitadas, cobertura 4G LTE nacional y sin contratos.',
      lowPrice: '50',
      highPrice: '599',
      category: 'Mobile Phone Plan',
      offerCount: 12,
    },
    'internet-hogar': {
      name: 'Internet en Casa HBB Be Online',
      description: 'Internet de hogar inalámbrico HBB con tecnología 4G LTE, sin instalación de cables, sin contratos.',
      lowPrice: '199',
      highPrice: '699',
      category: 'Home Internet',
      offerCount: 4,
    },
    'mifi': {
      name: 'Internet Portátil MiFi Be Online',
      description: 'Dispositivo MiFi con plan de datos para llevar Wi-Fi a donde vayas. Hasta 10 dispositivos conectados.',
      lowPrice: '149',
      highPrice: '499',
      category: 'Portable Wi-Fi',
      offerCount: 4,
    },
  };
  const d = data[service];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.name,
    description: d.description,
    brand: { '@type': 'Brand', name: 'Panda Movil' },
    category: d.category,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MXN',
      lowPrice: d.lowPrice,
      highPrice: d.highPrice,
      offerCount: d.offerCount,
      availability: 'https://schema.org/InStock',
    },
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

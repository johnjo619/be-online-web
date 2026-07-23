export type FAQCategory = 'general' | 'telefonia' | 'internet-hogar' | 'mifi' | 'cobertura' | 'portabilidad';


export interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory[];
}


export const faqItems: FAQItem[] = [
  {
    question: "¿Qué es Be Online?",
    answer: "Be Online es un operador móvil virtual (OMV) mexicano que ofrece planes de telefonía celular, internet móvil a precios accesibles. Operamos sobre la Red Compartida nacional, brindando cobertura 4G LTE en todo México sin contratos ni plazos forzosos.",
    category: ['general']
  },
  {
    question: "¿Qué cobertura tiene Be Online?",
    answer: "Utilizamos la Red Compartida (Altán Redes) con cobertura 4G LTE en los 32 estados de la República Mexicana y más de 2,000 ciudades. Puedes consultar la cobertura exacta en tu zona desde nuestra herramienta de cobertura en esta misma página.",
    category: ['general', 'cobertura', 'telefonia', 'internet-hogar', 'mifi']
  },
  {
    question: "¿Necesito un contrato?",
    answer: "No. Todos nuestros planes son de prepago sin contrato, sin plazos forzosos y sin letra chica. Recargas cuando quieras y cancelas cuando quieras, sin penalizaciones de ningún tipo.",
    category: ['general', 'telefonia', 'internet-hogar', 'mifi']
  },
  {
    question: "¿Cómo activo mi SIM Be Online?",
    answer: "Es muy sencillo: inserta tu SIM en un equipo desbloqueado compatible con 4G LTE, descarga nuestra app desde Google Play o App Store, regístrate con tus datos y elige tu plan. En menos de 5 minutos estarás conectado.",
    category: ['telefonia']
  },
  {
    question: "¿Puedo conservar mi número actual?",
    answer: "Sí, puedes portar tu número de cualquier compañía a Be Online de forma completamente gratuita. Solo necesitas tu NIP de portabilidad (marcando *051 desde tu línea actual) y nosotros nos encargamos del resto.",
    category: ['telefonia', 'portabilidad']
  },
  {
    question: "¿Cuánto tiempo tarda la portabilidad?",
    answer: "El proceso de portabilidad toma entre 24 y 48 horas hábiles una vez que proporcionas tu NIP. Durante este período tu servicio no se interrumpe; simplemente cambiarás de operador de manera transparente sin perder tu número.",
    category: ['telefonia', 'portabilidad']
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos múltiples métodos de pago para tu comodidad: tarjeta de crédito y débito vía Stripe, MercadoPago, PayPal, y pago en efectivo en tiendas OXXO. También puedes recargar directamente desde nuestra app móvil.",
    category: ['general']
  },
  {
    question: "¿Qué incluyen las redes sociales ilimitadas?",
    answer: "Todos nuestros planes incluyen uso ilimitado de WhatsApp, Facebook, Instagram y X (Twitter) sin consumir tus datos. Puedes enviar mensajes, hacer videollamadas y navegar en estas redes sin preocuparte por tu saldo de datos.",
    category: ['telefonia', 'mifi']
  },
  {
    question: "¿Qué es un plan Xpress?",
    answer: "Los planes Xpress son recargas de corta duración (3, 7, 15 o 30 días) ideales para quienes buscan flexibilidad y no quieren comprometerse con un plan mensual. Son perfectos para viajes, uso temporal o para probar nuestro servicio.",
    category: ['telefonia']
  },
  {
    question: "¿Cuál es la diferencia entre plan Mensual y Anual?",
    answer: "Los planes Mensuales se renuevan cada 30 días y ofrecen mayor cantidad de datos que los Xpress. Los planes Anuales cubren 12 meses con una sola compra, dándote un ahorro significativo respecto al pago mensual y la tranquilidad de no preocuparte por recargas durante todo el año.",
    category: ['telefonia']
  },
  {
    question: "¿Qué es el MiFi?",
    answer: "El MiFi es un dispositivo portátil de bolsillo que funciona como hotspot WiFi móvil. Inserta una SIM Be Online, enciéndelo y comparte internet 4G LTE con hasta 10 dispositivos simultáneamente. Es ideal para llevar internet contigo a donde vayas.",
    category: ['mifi']
  },
  {
    question: "¿Cómo contacto a soporte?",
    answer: "Puedes llamar al *777 desde tu línea Be Online sin costo alguno, escribirnos por WhatsApp, o contactarnos a través de nuestra app móvil. Nuestro equipo de soporte está disponible de lunes a sábado de 9:00 a 19:00 hrs para ayudarte con cualquier duda.",
    category: ['general']
  },
  {
    question: "¿Puedo usar eSIM?",
    answer: "Sí, ofrecemos eSIM Be Online para dispositivos compatibles. La activación es prácticamente instantánea: escaneas un QR y tu línea queda activa en minutos, sin necesidad de chip físico ni envíos. También seguimos enviando SIM física para quien la prefiera.",
    category: ['telefonia']
  },
  {
    question: "¿Be Online tiene app móvil?",
    answer: "Sí, nuestra app está disponible en Google Play y App Store. Desde ella puedes consultar tu saldo y consumo de datos, recargar tu plan, gestionar tu cuenta, contactar a soporte y realizar portabilidad, todo desde la palma de tu mano.",
    category: ['general']
  }
];


export function filterFaqByCategory(category?: FAQCategory): FAQItem[] {
  if (!category) return faqItems;
  return faqItems.filter(
    (item) => item.category.includes(category) || item.category.includes('general')
  );
}
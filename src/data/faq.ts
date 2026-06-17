export type FAQCategory = 'general' | 'telefonia' | 'internet-hogar' | 'mifi' | 'cobertura' | 'portabilidad';

export interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory[];
}

export const faqItems: FAQItem[] = [
  {
    question: "¿Que es Be Online?",
    answer: "Be Online es un operador movil virtual (OMV) mexicano que ofrece planes de telefonia celular, internet movil e internet en casa a precios accesibles. Operamos sobre la Red Compartida nacional, brindando cobertura 4G LTE en todo Mexico sin contratos ni plazos forzosos.",
    category: ['general']
  },
  {
    question: "¿Que cobertura tiene Be Online?",
    answer: "Utilizamos la Red Compartida (Altan Redes) con cobertura 4G LTE en los 32 estados de la Republica Mexicana y mas de 2,000 ciudades. Puedes consultar la cobertura exacta en tu zona desde nuestra herramienta de cobertura en esta misma pagina.",
    category: ['general', 'cobertura', 'telefonia', 'internet-hogar', 'mifi']
  },
  {
    question: "¿Necesito un contrato?",
    answer: "No. Todos nuestros planes son de prepago sin contrato, sin plazos forzosos y sin letra chica. Recargas cuando quieras y cancelas cuando quieras, sin penalizaciones de ningun tipo.",
    category: ['general', 'telefonia', 'internet-hogar', 'mifi']
  },
  {
    question: "¿Como activo mi SIM Be Online?",
    answer: "Es muy sencillo: inserta tu SIM en un equipo desbloqueado compatible con 4G LTE, descarga nuestra app desde Google Play o App Store, registrate con tus datos y elige tu plan. En menos de 5 minutos estaras conectado.",
    category: ['telefonia']
  },
  {
    question: "¿Puedo conservar mi numero actual?",
    answer: "Si, puedes portar tu numero de cualquier compania a Be Online de forma completamente gratuita. Solo necesitas tu NIP de portabilidad (marcando *051 desde tu linea actual) y nosotros nos encargamos del resto.",
    category: ['telefonia', 'portabilidad']
  },
  {
    question: "¿Cuanto tiempo tarda la portabilidad?",
    answer: "El proceso de portabilidad toma entre 24 y 48 horas habiles una vez que proporcionas tu NIP. Durante este periodo tu servicio no se interrumpe; simplemente cambiaras de operador de manera transparente sin perder tu numero.",
    category: ['telefonia', 'portabilidad']
  },
  {
    question: "¿Que metodos de pago aceptan?",
    answer: "Aceptamos multiples metodos de pago para tu comodidad: tarjeta de credito y debito via Stripe, MercadoPago, PayPal, y pago en efectivo en tiendas OXXO. Tambien puedes recargar directamente desde nuestra app movil.",
    category: ['general']
  },
  {
    question: "¿Que incluyen las redes sociales ilimitadas?",
    answer: "Todos nuestros planes incluyen uso ilimitado de WhatsApp, Facebook, Instagram, X (Twitter) y TikTok sin consumir tus datos. Puedes enviar mensajes, hacer videollamadas y navegar en estas redes sin preocuparte por tu saldo de datos.",
    category: ['telefonia', 'mifi']
  },
  {
    question: "¿Que es un plan Xpress?",
    answer: "Los planes Xpress son recargas de corta duracion (3, 7, 15 o 30 dias) ideales para quienes buscan flexibilidad y no quieren comprometerse con un plan mensual. Son perfectos para viajes, uso temporal o para probar nuestro servicio.",
    category: ['telefonia']
  },
  {
    question: "¿Cual es la diferencia entre plan Mensual y Anual?",
    answer: "Los planes Mensuales se renuevan cada 30 dias y ofrecen mayor cantidad de datos que los Xpress. Los planes Anuales cubren 12 meses con una sola compra, dandote un ahorro significativo respecto al pago mensual y la tranquilidad de no preocuparte por recargas durante todo el ano.",
    category: ['telefonia']
  },
  {
    question: "¿Como funciona el Internet en Casa (HBB)?",
    answer: "Nuestro servicio de Internet en Casa utiliza tecnologia 4G LTE a traves de un router fijo que conectas a la corriente electrica. Recibe senal de la Red Compartida y genera una red WiFi en tu hogar o negocio, sin necesidad de instalacion de cableado ni visitas tecnicas.",
    category: ['internet-hogar']
  },
  {
    question: "¿Que es el MiFi?",
    answer: "El MiFi es un dispositivo portatil de bolsillo que funciona como hotspot WiFi movil. Inserta una SIM Be Online, enciendelo y comparte internet 4G LTE con hasta 10 dispositivos simultaneamente. Es ideal para llevar internet contigo a donde vayas.",
    category: ['mifi']
  },
  {
    question: "¿Como contacto a soporte?",
    answer: "Puedes llamar al *777 desde tu linea Be Online sin costo alguno, escribirnos por WhatsApp, o contactarnos a traves de nuestra app movil. Nuestro equipo de soporte esta disponible de lunes a sabado de 9:00 a 19:00 hrs para ayudarte con cualquier duda.",
    category: ['general']
  },
  {
    question: "¿Puedo usar eSIM?",
    answer: "Si, ofrecemos eSIM Be Online para dispositivos compatibles. La activacion es practicamente instantanea: escaneas un QR y tu linea queda activa en minutos, sin necesidad de chip fisico ni envios. Tambien seguimos enviando SIM fisica para quien la prefiera.",
    category: ['telefonia']
  },
  {
    question: "¿Be Online tiene app movil?",
    answer: "Si, nuestra app esta disponible en Google Play y App Store. Desde ella puedes consultar tu saldo y consumo de datos, recargar tu plan, gestionar tu cuenta, contactar a soporte y realizar portabilidad, todo desde la palma de tu mano.",
    category: ['general']
  }
];

export function filterFaqByCategory(category?: FAQCategory): FAQItem[] {
  if (!category) return faqItems;
  return faqItems.filter(
    (item) => item.category.includes(category) || item.category.includes('general')
  );
}

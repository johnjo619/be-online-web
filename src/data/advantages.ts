export interface Advantage {
  title: string;
  description: string;
  icon: string;
}

export const advantages: Advantage[] = [
  {
    title: 'Precios accesibles',
    description: 'Planes desde $30 MXN sin contratos ni plazos forzosos. Paga solo por lo que necesitas, cuando lo necesitas.',
    icon: 'price'
  },
  {
    title: 'Cobertura nacional',
    description: 'Conectate en los 32 estados de Mexico con tecnologia 4G LTE a traves de la Red Compartida nacional.',
    icon: 'signal'
  },
  {
    title: 'Sin candados',
    description: 'Usa cualquier equipo desbloqueado compatible con 4G LTE. Sin contratos, sin permanencia minima, sin sorpresas.',
    icon: 'unlock'
  },
  {
    title: 'Redes sociales ilimitadas',
    description: 'WhatsApp, Facebook, Instagram, X y TikTok sin consumir tus datos en todos nuestros planes.',
    icon: 'social'
  },
  {
    title: 'Llamadas ilimitadas',
    description: 'Habla sin limites a cualquier compania en Mexico. Incluido en planes Mensual, Anual y Xpress seleccionados.',
    icon: 'phone'
  },
  {
    title: 'App de gestion',
    description: 'Consulta tu saldo, recarga, porta tu numero y contacta soporte desde nuestra app para iOS y Android.',
    icon: 'app'
  }
];

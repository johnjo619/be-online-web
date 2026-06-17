export interface Plan {
  id: string;
  name: string;
  group: 'XPRESS' | 'MENSUAL' | 'ANUAL';
  data: string;
  duration: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export const fallbackPlans: Plan[] = [
  // XPRESS plans (short duration, prepaid)
  { id: 'xpress-3d-1gb', name: 'Xpress 1GB', group: 'XPRESS', data: '1GB', duration: '3 dias', price: 30, features: ['1GB datos', 'Redes sociales ilimitadas', '3 dias de vigencia'] },
  { id: 'xpress-7d-2gb', name: 'Xpress 2GB', group: 'XPRESS', data: '2GB', duration: '7 dias', price: 50, features: ['2GB datos', 'Redes sociales ilimitadas', '7 dias de vigencia'] },
  { id: 'xpress-15d-4gb', name: 'Xpress 4GB', group: 'XPRESS', data: '4GB', duration: '15 dias', price: 100, features: ['4GB datos', 'Redes sociales ilimitadas', '15 dias de vigencia', 'Llamadas ilimitadas'] },
  { id: 'xpress-30d-6gb', name: 'Xpress 6GB', group: 'XPRESS', data: '6GB', duration: '30 dias', price: 150, features: ['6GB datos', 'Redes sociales ilimitadas', '30 dias de vigencia', 'Llamadas ilimitadas'] },

  // MENSUAL plans
  { id: 'mensual-4gb', name: 'Plan 4GB', group: 'MENSUAL', data: '4GB', duration: '30 dias', price: 150, features: ['4GB datos', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '30 dias'] },
  { id: 'mensual-6gb', name: 'Plan 6GB', group: 'MENSUAL', data: '6GB', duration: '30 dias', price: 200, features: ['6GB datos', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '30 dias'], popular: true },
  { id: 'mensual-10gb', name: 'Plan 10GB', group: 'MENSUAL', data: '10GB', duration: '30 dias', price: 250, features: ['10GB datos', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '30 dias'] },
  { id: 'mensual-15gb', name: 'Plan 15GB', group: 'MENSUAL', data: '15GB', duration: '30 dias', price: 300, features: ['15GB datos', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '30 dias'] },

  // ANUAL plans
  { id: 'anual-4gb', name: 'Anual 4GB', group: 'ANUAL', data: '4GB/mes', duration: '12 meses', price: 1500, features: ['4GB mensuales', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '12 meses', 'Ahorra vs mensual'] },
  { id: 'anual-6gb', name: 'Anual 6GB', group: 'ANUAL', data: '6GB/mes', duration: '12 meses', price: 2000, features: ['6GB mensuales', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '12 meses', 'Ahorra vs mensual'], popular: true },
  { id: 'anual-10gb', name: 'Anual 10GB', group: 'ANUAL', data: '10GB/mes', duration: '12 meses', price: 2500, features: ['10GB mensuales', 'Redes sociales ilimitadas', 'Llamadas ilimitadas', '12 meses', 'Ahorra vs mensual'] },
];

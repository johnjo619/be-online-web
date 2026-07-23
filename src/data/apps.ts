export interface AppLink {
  store: 'app-store' | 'play-store';
  label: string;
  href: string;
  badgeAlt: string;
}

// TODO: reemplazar # con URLs reales:
//   - App Store: https://apps.apple.com/mx/app/{slug}/id{appId}
//   - Google Play: https://play.google.com/store/apps/details?id={packageName}
// Memoria: Team Apple 3LLKBD3G24, app Be Online iOS existe (ver appstoreconnect-api-credentials.md)
export const appLinks: AppLink[] = [
  {
    store: 'app-store',
    label: 'App Store',
    href: 'https://apps.apple.com/mx/app/be-online/id6761391096',
    badgeAlt: 'Descargar Be Online en el App Store',
  },
  {
    store: 'play-store',
    label: 'Google Play',
    href: 'https://play.google.com/store/search?q=pandamovil&c=apps&hl=es',
    badgeAlt: 'Descargar Be Online en Google Play',
  },
];

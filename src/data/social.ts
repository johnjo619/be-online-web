export interface SocialLink {
  label: string;
  href: string;
  network: 'facebook' | 'instagram' | 'youtube' | 'tiktok';
}

// TODO: reemplazar # con URLs reales cuando el usuario las pase
export const socialLinks: SocialLink[] = [
  { label: 'Facebook',  network: 'facebook',  href: '#' },
  { label: 'Instagram', network: 'instagram', href: '#' },
  { label: 'YouTube',   network: 'youtube',   href: '#' },
  { label: 'TikTok',    network: 'tiktok',    href: '#' },
];

export const friendPandaText = '¿Quieres un amigo panda?';

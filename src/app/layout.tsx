import type { Metadata } from 'next';
import { AppProvider } from '@/components/app-provider';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Sonbras · Seu próximo encontro com o céu', template: '%s · Sonbras' }, description: 'Seus sítios de observação e predições de ocultações estelares em um só lugar.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body><AppProvider>{children}</AppProvider></body></html>;
}

import { AppProvider } from "@/components/app-provider";
import { AppToaster } from "@/components/app-toaster";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata = {
  title: {
    default: "Meus sítios · Sonbras",
    template: "%s · Sonbras",
  },
  description:
    "Seus sítios de observação e predições de ocultações estelares em um só lugar.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <AppProvider>{children}</AppProvider>
        <AppToaster />
      </body>
    </html>
  );
}

import { SitePage } from "@/components/site-page";

export const metadata = { title: "Sítio padrão de observação" };

export default function DefaultSitePage({ params }) {
  return <SitePage params={params} publicSite />;
}

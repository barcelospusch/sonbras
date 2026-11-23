import Link from "next/link";
import { Shell } from "@/components/shell";

export default function NotFoundPage() {
  return (
    <Shell>
      <div className="empty-state">
        <span className="eyebrow">404 · FORA DE ÓRBITA</span>
        <h1>Este ponto não está no mapa.</h1>
        <Link href="/" className="button">
          Voltar para meus sítios
        </Link>
      </div>
    </Shell>
  );
}

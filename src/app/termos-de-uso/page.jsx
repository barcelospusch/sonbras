import Link from "next/link";
import { Shell } from "@/components/shell";

export const metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <Shell>
      <article className="policy-page">
        <h1>Termos de Uso</h1>
        <p>O Sonbras ajuda a cadastrar sítios, consultar predições de ocultações estelares e planejar observações.</p>

        <section>
          <h2>Uso da conta</h2>
          <p>Proteja suas credenciais e cadastre apenas informações que você tem autorização para usar. Respeite a privacidade de outros usuários e use sua própria conta para acessar recursos restritos.</p>
        </section>

        <section>
          <h2>Predições e observações</h2>
          <p>As predições são estimativas e podem mudar. Os horários são exibidos em UTC, e a duração e a visibilidade previstas dependem do local de observação. Confira a fonte oficial do evento e as condições do local antes de organizar sua observação.</p>
        </section>

        <section>
          <h2>Publicação de informações</h2>
          <p>A publicação do perfil é opcional. Revise o conteúdo do perfil e das marcações antes de compartilhar o endereço. A <Link href="/politica-de-privacidade">Política de Privacidade</Link> explica quais dados ficam visíveis e como desativar a publicação.</p>
        </section>

        <section>
          <h2>Conteúdo de outros serviços</h2>
          <p>Os dados astronômicos e as imagens disponibilizados por outros serviços são identificados na interface. Consulte as condições de uso da fonte antes de redistribuir seus dados ou imagens.</p>
        </section>
      </article>
    </Shell>
  );
}

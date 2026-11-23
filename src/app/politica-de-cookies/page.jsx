import Link from "next/link";
import { CookieNoticeButton } from "@/components/cookie-notice";
import { Shell } from "@/components/shell";

export const metadata = { title: "Política de Cookies" };

export default function CookiesPage() {
  return (
    <Shell>
      <article className="policy-page">
        <h1>Política de Cookies</h1>
        <p>Cookies e tecnologias como o armazenamento local permitem que um site guarde informações no navegador.</p>

        <section>
          <h2>Sessão e autenticação</h2>
          <p>O Firebase Authentication usa armazenamento no navegador para manter o login entre visitas, quando disponível. Ao escolher entrar com o Google, o serviço de autenticação também pode usar cookies próprios. Sair da conta encerra a sessão do Sonbras neste navegador.</p>
        </section>

        <section>
          <h2>Confirmação do aviso</h2>
          <p>“Entendi” grava a confirmação no armazenamento local deste navegador até que você limpe os dados do site. “Agora não” fecha o aviso sem gravar uma nova confirmação. Se o navegador bloquear a gravação, o aviso pode reaparecer na próxima visita.</p>
          <p>O Sonbras não configura cookies próprios de publicidade ou análise. Você pode limpar ou bloquear dados do site nas configurações do navegador. Isso pode afetar o login.</p>
          <p><CookieNoticeButton /></p>
        </section>

        <section>
          <h2>Dados pessoais</h2>
          <p>Consulte a <Link href="/politica-de-privacidade">Política de Privacidade</Link> para saber como o Sonbras trata seus dados de conta e observação.</p>
        </section>
      </article>
    </Shell>
  );
}

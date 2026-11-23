import Link from "next/link";
import { Shell } from "@/components/shell";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <Shell>
      <article className="policy-page">
        <h1>Política de Privacidade</h1>
        <p>Saiba quais dados o Sonbras usa para manter sua conta e ajudar no planejamento de observações.</p>

        <section>
          <h2>Conta, sítios e marcações</h2>
          <p>Usamos seu e-mail e identificador de conta para autenticação e recuperação de acesso. Seu perfil pode incluir nome, nome de usuário, instituição, e-mail de contato e preferências como o tema.</p>
          <p>Salvamos os sítios e as marcações que você cadastra para que possa consultá-los depois. Ao selecionar “Usar minha localização”, o navegador pede permissão para preencher as coordenadas. Você também pode digitá-las. O Sonbras usa as coordenadas e os filtros do sítio para consultar e calcular predições.</p>
        </section>

        <section>
          <h2>Quem pode ver seus dados</h2>
          <p>As coordenadas dos sítios pessoais e o e-mail de login ficam fora do perfil público. Administradores autorizados podem consultar dados de perfis e sítios para administrar a plataforma.</p>
          <p>Ao ativar o perfil público, qualquer pessoa com o endereço do perfil pode consultar o nome, a instituição, o e-mail de contato se você o informar e as marcações publicadas, que podem incluir o nome do sítio. Você pode desativar a publicação em <Link href="/account">Minha conta</Link>.</p>
        </section>

        <section>
          <h2>Serviços utilizados</h2>
          <p>O Firebase Authentication gerencia o acesso e o Cloud Firestore armazena os dados cadastrados. Se você optar por entrar com o Google, o login passa pelo provedor. Nas buscas por sítio, o Sonbras envia as coordenadas e os filtros da busca ao LIneA para obter predições próximas. A carta do céu carrega imagens do serviço Aladin Lite do CDS.</p>
        </section>

        <section>
          <h2>Como gerenciar seus dados</h2>
          <p>Em <Link href="/account">Minha conta</Link>, você pode editar seu perfil, alterar o e-mail e controlar sua visibilidade. Ao excluir um sítio seu, você pode manter ou excluir junto as marcações vinculadas a ele. Você também pode remover marcações individualmente.</p>
          <p>Para saber como o navegador armazena a sessão e a confirmação do aviso, consulte a <Link href="/politica-de-cookies">Política de Cookies</Link>.</p>
        </section>
      </article>
    </Shell>
  );
}

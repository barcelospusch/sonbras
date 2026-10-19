import { Shell } from "@/components/shell";
import { SkyArt } from "@/components/sky-art";
import { MapPinIcon, PlanetIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Sobre a plataforma" };
export default function About() {
  return (
    <Shell>
      <div className="page-heading">
        <span className="eyebrow">SOMBRAS QUE APROXIMAM MUNDOS</span>
        <h1>
          Sobre o Sonbras<span className="accent">.</span>
        </h1>
        <p>
          Um ponto de encontro entre o seu horizonte e as próximas ocultações
          estelares.
        </p>
      </div>
      <section className="hero">
        <SkyArt />
        <div className="hero-copy">
          <span className="pill">
            <PlanetIcon size={16} weight="duotone" /> NOSSO PROPÓSITO
          </span>
          <h2>
            Transformar uma predição
            <br />
            em um plano de observação.
          </h2>
          <p>
            O Sonbras reúne seus sítios, os eventos que despertam seu
            <br /> interesse e as pessoas que compartilham esse olhar para o
            céu.
          </p>
        </div>
      </section>
      <div className="guide-grid">
        <article className="guide-card">
          <MapPinIcon size={28} weight="duotone" />
          <h2>O céu a partir do seu sítio</h2>
          <p>
            Defina seu local, raio de busca e altitude mínima da estrela.
            Explore predições por período, duração e queda de brilho para
            preparar sua sessão.
          </p>
        </article>
        <article className="guide-card">
          <UsersThreeIcon size={28} weight="duotone" />
          <h2>Uma comunidade de observadores</h2>
          <p>
            Marque eventos, indique de qual sítio pretende observar e
            compartilhe seu perfil. Você escolhe quando tornar públicas suas
            marcações.
          </p>
        </article>
        <article className="guide-card">
          <PlanetIcon size={28} weight="duotone" />
          <h2>Conectado ao LIneA</h2>
          <p>
            As predições são consultadas no LIneA Solar System Portal por meio
            da biblioteca occjs. Cada evento oferece um acesso direto à fonte
            oficial, com seus mapas e atualizações.
          </p>
          <a
            className="text-link"
            href="https://solarsystem.linea.org.br"
            target="_blank"
            rel="noreferrer"
          >
            Conheça o LIneA ↗
          </a>
        </article>
        <article className="guide-card">
          <h2>Da posição à faixa de sombra</h2>
          <p>
            O ponto verde indica o sítio dentro da sombra nominal; o vermelho,
            fora da sombra nominal e dentro da faixa de incerteza de 1σ; o
            branco, fora dessa faixa. A classificação usa as trajetórias
            fornecidas pelo LIneA e não representa garantia de detecção.
          </p>
          <p>
            Quando faltam dados de trajetória, mostramos a classificação como
            indisponível.
          </p>
        </article>
      </div>
      <section className="detail-panel">
        <h2>Seu planejamento, com contexto</h2>
        <p className="about-text">
          As predições podem mudar. A altitude é uma aproximação geométrica no
          instante central, sem considerar obstáculos locais ou refração. Os
          horários são apresentados em UTC e a duração prevista pode variar com
          a posição do observador. Consulte a página oficial do evento antes da
          observação.
        </p>
        <p className="about-text">
          Seu e-mail e as coordenadas dos sítios são privados. Ao ativar o
          perfil público, somente seu nome, instituição, tags, eventos e nomes
          dos sítios marcados ficam visíveis no link compartilhado.
        </p>
      </section>
      <Link href="/" className="button">
        Explorar meus sítios
      </Link>
    </Shell>
  );
}

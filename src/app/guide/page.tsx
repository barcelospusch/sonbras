import { Shell } from "@/components/shell";
import {
  BinocularsIcon,
  ClockIcon,
  CrosshairIcon,
  MapPinIcon,
  StarFourIcon,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
export default function Guide() {
  return (
    <Shell>
      <div className="page-heading">
        <span className="eyebrow">DA PREDIÇÃO À OBSERVAÇÃO</span>
        <h1>
          Prepare seu olhar<span className="accent">.</span>
        </h1>
        <p>
          Alguns segundos de sombra podem revelar muito sobre um mundo distante.
        </p>
      </div>
      <div className="guide-grid">
        {[
          {
            icon: MapPinIcon,
            title: "01 · Escolha seu sítio",
            text: "Cadastre as coordenadas do ponto de observação. O raio, em quilômetros, seleciona faixas de sombra próximas; estar dentro do raio não garante que a sombra atravesse o sítio.",
          },
          {
            icon: BinocularsIcon,
            title: "02 · Defina seu horizonte",
            text: "A altitude mínima é o ângulo da estrela acima do horizonte. Um valor maior ajuda a evitar regiões baixas do céu. O cálculo é feito no instante central do evento e não considera obstáculos locais.",
          },
          {
            icon: StarFourIcon,
            title: "03 · Ajuste a queda de brilho",
            text: "Mag drop é a queda de magnitude prevista quando o corpo oculta a estrela. Valores maiores representam uma queda de brilho mais acentuada. Compare com a sensibilidade do seu equipamento.",
          },
          {
            icon: ClockIcon,
            title: "04 · Fique atento ao tempo",
            text: "Todos os horários do Sonbras são apresentados em UTC. Converta para seu fuso ao planejar a sessão e sincronize seu sistema de aquisição. A duração exibida é a duração central prevista.",
          },
          {
            icon: CrosshairIcon,
            title: "05 · Confira a trajetória",
            text: "Abra o evento no portal oficial do LIneA para conferir o mapa da sombra, as incertezas e as atualizações. A predição é uma estimativa: posição, duração e horário podem mudar.",
          },
        ].map((item) => (
          <article className="guide-card" key={item.title}>
            <span className="tile-icon">
              <item.icon size={25} weight="duotone" />
            </span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <Link className="button" href="/">
        Explorar meus sítios
      </Link>
    </Shell>
  );
}

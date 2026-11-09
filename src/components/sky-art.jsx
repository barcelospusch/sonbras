export function SkyArt({ compact = false }) {
  return (
    <svg
      className={compact ? "sky-art compact" : "sky-art"}
      viewBox="0 0 700 340"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow">
          <stop stopColor="var(--muted)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--bg)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="planet">
          <stop stopColor="var(--accent)" />
          <stop offset=".45" stopColor="var(--muted)" />
          <stop offset="1" stopColor="var(--bg)" />
        </radialGradient>
        <linearGradient id="beam">
          <stop stopColor="var(--accent)" stopOpacity="0" />
          <stop offset=".5" stopColor="var(--accent)" stopOpacity=".65" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="420" cy="175" rx="280" ry="180" fill="url(#glow)" />
      {[85, 145, 210].map((r) => (
        <ellipse
          key={r}
          cx="420"
          cy="175"
          rx={r}
          ry={r * 0.65}
          transform="rotate(-24 420 175)"
          stroke="var(--muted)"
          strokeOpacity=".15"
          strokeDasharray={r === 145 ? "3 8" : undefined}
        />
      ))}
      <path d="M60 290L580 52" stroke="url(#beam)" strokeWidth="1" />
      <path d="M145 330L640 100" stroke="var(--muted)" strokeOpacity=".12" />
      {Array.from({ length: 55 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 137 + 31) % 690}
          cy={(i * 73 + 17) % 330}
          r={i % 7 === 0 ? 1.7 : 0.8}
          fill="var(--accent)"
          opacity={0.2 + (i % 4) * 0.15}
        />
      ))}
      <circle cx="420" cy="175" r="47" fill="var(--bg)" />
      <circle cx="414" cy="170" r="46" stroke="var(--accent)" strokeOpacity=".25" />
      <path
        d="M407 125a47 47 0 0 1 26 90 47 47 0 0 0-26-90Z"
        fill="url(#planet)"
      />
      <circle cx="534" cy="123" r="4" fill="var(--accent)" />
      <circle cx="534" cy="123" r="10" stroke="var(--accent)" strokeOpacity=".2" />
      <path
        d="M534 107v-9m0 50v-9m16-16h9m-50 0h9"
        stroke="var(--accent)"
        strokeOpacity=".5"
      />
      <text x="474" y="284" fill="var(--muted)" fontSize="9" letterSpacing="3">
        A SOMBRA REVELA O INVISÍVEL
      </text>
    </svg>
  );
}

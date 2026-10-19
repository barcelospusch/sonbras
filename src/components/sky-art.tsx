export function SkyArt({ compact = false }: { compact?: boolean }) {
  return <svg className={compact ? 'sky-art compact' : 'sky-art'} viewBox="0 0 700 340" fill="none" aria-hidden="true">
    <defs><radialGradient id="glow"><stop stopColor="#425896" stopOpacity=".35"/><stop offset="1" stopColor="#101b2c" stopOpacity="0"/></radialGradient><radialGradient id="planet"><stop stopColor="#a0abcf"/><stop offset=".45" stopColor="#53617f"/><stop offset="1" stopColor="#101a2d"/></radialGradient><linearGradient id="beam"><stop stopColor="#c0d7ff" stopOpacity="0"/><stop offset=".5" stopColor="#c0d7ff" stopOpacity=".65"/><stop offset="1" stopColor="#c0d7ff" stopOpacity="0"/></linearGradient></defs>
    <ellipse cx="420" cy="175" rx="280" ry="180" fill="url(#glow)"/>
    {[85,145,210].map(r => <ellipse key={r} cx="420" cy="175" rx={r} ry={r * .65} transform="rotate(-24 420 175)" stroke="#7185b4" strokeOpacity=".15" strokeDasharray={r === 145 ? '3 8' : undefined}/>)}
    <path d="M60 290L580 52" stroke="url(#beam)" strokeWidth="1"/><path d="M145 330L640 100" stroke="#8a9dc8" strokeOpacity=".12"/>
    {Array.from({ length: 55 }, (_, i) => <circle key={i} cx={(i * 137 + 31) % 690} cy={(i * 73 + 17) % 330} r={i % 7 === 0 ? 1.7 : .8} fill="#c6d5f4" opacity={.2 + i % 4 * .15}/>)}
    <circle cx="420" cy="175" r="47" fill="#060d19"/><circle cx="414" cy="170" r="46" stroke="#b8c7e8" strokeOpacity=".25"/><path d="M407 125a47 47 0 0 1 26 90 47 47 0 0 0-26-90Z" fill="url(#planet)"/>
    <circle cx="534" cy="123" r="4" fill="#d9e7ff"/><circle cx="534" cy="123" r="10" stroke="#c2d8ff" strokeOpacity=".2"/>
    <path d="M534 107v-9m0 50v-9m16-16h9m-50 0h9" stroke="#acc4f3" strokeOpacity=".5"/>
    <text x="474" y="284" fill="#7e91b5" fontSize="9" letterSpacing="3">A SOMBRA REVELA O INVISÍVEL</text>
  </svg>;
}

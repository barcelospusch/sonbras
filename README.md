# Sonbras

Aplicativo para planejar observações de ocultações estelares, desenvolvido em JavaScript com Next.js App Router, React, Firebase Auth, Cloud Firestore e occjs 0.3.1.

## Executar

Requer Node.js 22 ou superior.

```powershell
npm install
Copy-Item .env.example .env.local
# Preencha as variáveis NEXT_PUBLIC_FIREBASE_*.
npm run dev
```

Abra [localhost:3000](http://localhost:3000). Habilite os provedores Google e E-mail/Senha no Firebase Authentication e autorize os domínios usados pelo aplicativo.

O aplicativo não exige Firebase Admin nem uma conta de serviço. As credenciais públicas identificam o projeto; as regras do Firestore controlam o acesso aos dados. O Admin SDK fica somente nas dependências de desenvolvimento, para o script opcional de migração.

## Organização do código

- `src/app`: páginas e rotas HTTP. Os arquivos `.jsx` contêm a interface; as rotas `.js` consultam o LIneA pelo servidor.
- `src/components`: componentes compartilhados e estado da sessão.
- `src/lib/firebase.js`: inicialização do Firebase e referências das coleções e documentos.
- `src/lib/repositories`: operações de perfil, sítios, marcações, leitura pública e assinaturas do Firestore.
- `src/lib/*.mjs`: conversões, filtros e cálculos reutilizados pela aplicação, testes e scripts. `format.js` reúne a formatação de números e datas.
- `src/lib/server`: busca de predições e cache em memória.
- `scripts`: auditoria do occjs e migração manual do banco.
- `tests`: testes de lógica e de segurança do Firestore.

Os módulos usam ESM. O alias `@/*` aponta para `src/*` e está configurado em `jsconfig.json`.

## Páginas

| Endereço            | Função                                              |
| ------------------- | --------------------------------------------------- |
| `/`                 | Listar, cadastrar, editar e excluir sítios da conta |
| `/sites/{siteId}`   | Buscar predições nas condições do sítio             |
| `/events/{eventId}` | Consultar detalhes e marcar um evento               |
| `/account`          | Editar perfil, e-mail, visibilidade e tema          |
| `/users/{username}` | Ver perfil público ou a própria prévia privada      |
| `/login`            | Entrar ou criar uma conta                           |
| `/guide`            | Consultar o guia de observação                      |
| `/about`            | Conhecer a plataforma                               |

O parâmetro da pasta `users/[uid]` representa o nome de usuário na URL, não o UID do Firebase. As pastas das páginas foram preservadas.

## Firebase e privacidade

O navegador usa Firebase Auth e Firestore Web SDK. O e-mail também é armazenado no documento privado do usuário e sincronizado com o Auth. Sua alteração exige confirmação no novo endereço e pode exigir reautenticação.

```text
users/{uid}
  displayName, email, institution, username: string
  isPublic: boolean
  theme: dark | light | red
  updatedAt: Timestamp
  sites/{siteId}
    latitude, longitude, minObservationAltitude, radiusKm: number
    name: string
    updatedAt: Timestamp
  observations/{obsId}
    dateTime: Timestamp
    eventId, eventName, siteId, siteName: string
    tag: interested | planned | observed
    updatedAt: Timestamp

publicUsers/{uid}
  displayName, institution, username: string
  isPublic: boolean
  observations/{opaqueId}
    dateTime: Timestamp
    eventId, eventName, siteName, tag: string

usernames/{username}
  uid: string
```

Os documentos em `users` e suas subcoleções são privados. As cópias em `publicUsers` excluem e-mail, tema, coordenadas e identificador do sítio. O UID identifica o perfil público; os IDs das marcações públicas são hashes. Desativar `isPublic` ou mudar o nome de usuário bloqueia o acesso público antigo pelas regras, mesmo antes da próxima sincronização.

O nome de usuário tem de 3 a 30 caracteres: letras minúsculas, números, hífen ou sublinhado, com início e fim alfanuméricos. Perfil e reserva do nome são gravados em uma transação. Ao trocar o nome, a reserva anterior é liberada.

Ao entrar na conta, o aplicativo sincroniza as cópias públicas. Gravações posteriores de marcações atualizam os documentos privado e público no mesmo lote. Cópias que já estão atualizadas não são regravadas.

As marcações exibem `sítio - nome do observador`, usando o nome atual do perfil. O nome abre `/users/{username}` somente quando o perfil é público; em perfis privados, aparece como texto. Essa identificação não acrescenta campos aos documentos de observações.

Sítios aceitam latitude de -90 a 90, longitude de -180 a 180, raio maior que zero e até 5000 km e altitude mínima de 0 a 90 graus. Altitude é o ângulo acima do horizonte, não a elevação do terreno.

Publique as regras antes de usar esses fluxos no projeto remoto:

```powershell
firebase deploy --only firestore --project SEU_PROJECT_ID
```

`firestore.indexes.json` não configura índices especiais nem TTL: o cache atual não usa o Firestore. Nenhum comando do aplicativo publica regras ou altera dados de produção automaticamente.

## Busca de predições

A página do sítio permite filtrar datas UTC, duração mínima, queda mínima de magnitude, magnitude máxima da estrela (G), incerteza máxima da trajetória em quilômetros e eventos noturnos. O raio e a altitude mínima vêm do cadastro do sítio.

Ao editar os filtros, a URL recebe `startDate`, `endDate`, `duration`, `drop`, `maxMagnitude`, `maxUncertaintyKm` e `night`. Limites opcionais vazios são removidos da URL. Links restauram os valores; voltar e avançar também refazem a busca. Edições no formulário são consultadas ao clicar em **Aplicar filtros**.

O período inicial inclui o dia atual e os sete dias seguintes. O limite da busca é de 93 dias, considerando o dia final completo. Magnitudes menores indicam objetos mais brilhantes; zero e magnitudes negativas são válidos. Um limite ativo exclui eventos sem o respectivo dado numérico.

Cada predição exibe duração, queda de magnitude, altitude da estrela, magnitude da estrela (`g_star`) e magnitude aparente do objeto (`apparent_magnitude`). Dados ausentes aparecem como “—”. Datas e horários são apresentados em UTC.

A rota `/api/predictions` usa o occjs com paginação completa (`limit: 'all'`) e filtros geográficos do LIneA. A aplicação verifica também datas, duração, queda de magnitude, magnitude estelar, incerteza, altitude e condição noturna nas coordenadas do sítio. Eventos sem coordenadas estelares válidas são excluídos com aviso.

`PrecisePrediction` adapta o transporte do occjs e usa `lossless-json` para preservar os dígitos de identificadores Gaia grandes. A paginação e os aliases dos parâmetros continuam sob responsabilidade da biblioteca. Revise os testes ao atualizar o SDK.

## Detalhes, sombra e cache

A página do evento oferece os dados da predição, marcações por sítio e acesso à página oficial no LIneA. As cores da faixa da sombra usam as trajetórias retornadas por `getOccultationPaths`:

- Verde: dentro da sombra nominal.
- Vermelho: fora da sombra nominal, dentro da faixa de 1σ.
- Branco: fora da faixa de 1σ.
- Cinza tracejado: classificação indisponível.

A classificação considera a posição exata do sítio, não o raio da busca. A geometria usa polígonos esféricos com tratamento do antimeridiano. Duração e altitude são aproximações no instante central; não incluem obstáculos locais nem refração atmosférica.

As rotas de detalhes e visibilidade usam cache em memória por cinco minutos, limitado a 200 entradas por processo. Eventos e trajetórias têm validades independentes. Reinícios limpam o cache; não há dependência do Firebase Admin. O carregamento dos detalhes repete uma vez falhas temporárias, respeitando o cancelamento da navegação.

## Migração opcional

O aplicativo sincroniza as cópias públicas das contas existentes ao entrar. Para converter dados legados e preparar todas as reservas e cópias públicas de uma vez, use o script manual. Ele exige credenciais Admin ou Application Default Credentials e o ID explícito do projeto.

Faça backup, pause gravações e revise a simulação antes de aplicar:

```powershell
# Apenas mostra o plano.
npm run migrate:firestore -- --project SEU_PROJECT_ID

# Grava os destinos e preserva os documentos legados.
npm run migrate:firestore -- --project SEU_PROJECT_ID --apply

# Após conferir o resultado, remove as marcações antigas de tagged.
npm run migrate:firestore -- --project SEU_PROJECT_ID --apply --cleanup-legacy
```

A migração converte `preferences.theme` para `theme`, `tagged` para `observations`, resumos aninhados para campos planos e datas para Timestamp. Remove `createdAt` dos destinos, detecta nomes de usuário duplicados e valida o plano antes da primeira gravação. Não apaga as coleções de perfis públicos nem as reservas de nomes.

## Verificação e produção

```powershell
npm test
npm run build
npm start
```

`npm test` executa os testes offline; o teste das regras é ignorado sem o emulador. Para testar as permissões, instale Firebase CLI e Java 21 ou superior e execute:

```powershell
npm run test:rules
```

O comando usa somente o emulador Firestore na porta 8787 e o projeto `demo-sonbras`. Verifica isolamento, reserva de nomes, publicação, privacidade e revogação, sem alterar produção.

Para conferir filtros e precisão dos identificadores na API real do LIneA:

```powershell
npm run audit:occjs -- 2026-10-20T00:00:00Z
```

Troque a data por um período com predições. Esse comando precisa de acesso à internet.

A hospedagem deve executar Next.js/Node.js com saída HTTPS para o LIneA. O aplicativo não utiliza exportação estática.

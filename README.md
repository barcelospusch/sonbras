# Sonbras 🌘

> Planeje suas observações de ocultações estelares a partir do seu sítio de observação.

O Sonbras reúne predições de ocultações estelares do LIneA Solar System e ajuda observadores a planejar onde e quando acompanhar cada evento. Uma ocultação acontece quando um corpo do Sistema Solar passa diante de uma estrela do ponto de vista de quem observa.

[Como usar](#como-usar) · [Funcionalidades](#funcionalidades) · [Instalação](#executar) · [Administração](#sítios-padrão-e-administração) · [Contribuir](#contribuir)

## Funcionalidades

| Área | O que você pode fazer |
| --- | --- |
| **Sítios de observação** | Explorar observatórios padrão sem login. Na sua conta, cadastrar, editar e excluir sítios, preencher coordenadas pela geolocalização e buscar ou ordenar seus locais. |
| **Predições** | Consultar ocultações por período e condições de observação. Compartilhar uma busca com os filtros na URL e identificar eventos cujo horário previsto já passou. |
| **Detalhes do evento** | Conferir horário em UTC, duração, queda de magnitude, dados estelares, posição do sítio em relação à faixa de sombra e a página oficial no LIneA. |
| **Planejamento** | Marcar **Tenho interesse**, **Vou observar** ou **Observado** por sítio. Revisar, editar e remover marcações. Eventos abertos a partir de um sítio padrão também podem ser marcados nesse observatório. |
| **Conta e aparência** | Entrar com Google ou e-mail e senha, recuperar a senha, editar o perfil e confirmar um novo endereço de e-mail. Alternar entre os temas claro, escuro e vermelho. |
| **Perfil público** | Escolher o nome de usuário, controlar a visibilidade e copiar o link do perfil para compartilhar as marcações. A conta também oferece uma prévia privada do próprio perfil. |
| **Administração** | Listar usuários com paginação, editar configurações e permissões e consultar, editar ou excluir os sítios pessoais de cada usuário. |
| **Guia** | Consultar orientações para preparar uma observação de ocultação. |

## Como usar

1. Na página inicial, abra um **sítio padrão** para consultar as predições de um local de referência, inclusive como visitante.
2. Para buscar eventos a partir do seu local, entre na conta e use **Novo sítio**. Informe nome, coordenadas, raio de busca e altitude mínima da estrela. A geolocalização do navegador pode preencher as coordenadas.
3. Abra um evento para consultar horário UTC, duração estimada, queda de magnitude e detalhes da sombra. Com uma conta, marque o evento conforme seu interesse, planejamento ou registro de observação. Se você veio de um sítio padrão, pode usar esse observatório na marcação mesmo sem ter sítios pessoais.
4. Abra **Minha conta** para revisar os eventos salvos e escolher o tema claro, escuro ou vermelho. A indicação **Evento passado** compara o horário da predição com o horário atual e aparece nas predições, nos detalhes do evento e nos cards salvos.
5. Para compartilhar suas marcações, defina um nome de usuário, ative o perfil público e salve. O botão **Copiar link** fica disponível nas configurações da conta e na página do perfil público.

O código usa Next.js App Router, React, Firebase Auth, Cloud Firestore e occjs 0.3.1.

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
| `/`                 | Explorar sítios padrão e gerenciar sítios pessoais  |
| `/sites/default/{siteId}` | Consultar predições de um sítio padrão sem login |
| `/sites/{siteId}`   | Buscar predições nas condições do sítio             |
| `/events/{eventId}` | Consultar detalhes e marcar um evento               |
| `/account`          | Editar perfil, e-mail, visibilidade e tema          |
| `/users/{username}` | Ver perfil público ou a própria prévia privada      |
| `/admin`            | Listar usuários, com paginação                      |
| `/admin/users/{uid}` | Editar perfil, visibilidade, tema e papel administrativo |
| `/admin/users/{uid}/sites` | Consultar, editar e excluir sítios cadastrados do usuário |
| `/login`            | Entrar ou criar uma conta                           |
| `/guide`            | Consultar o guia de observação                      |
| `/about`            | Conhecer a plataforma                               |

A URL pública usa o nome de usuário. As rotas administrativas usam o UID do Firebase.

## Firebase e privacidade

O navegador usa Firebase Auth e Firestore Web SDK. O e-mail também é armazenado no documento privado do usuário e sincronizado com o Auth. Sua alteração exige confirmação no novo endereço e pode exigir reautenticação.

```text
users/{uid}
  displayName, email, institution, username: string
  isPublic, isAdmin: boolean
  theme: dark | light | red
  updatedAt: Timestamp
  sites/{siteId}
    latitude, longitude, minObservationAltitude, radiusKm: number
    name: string
    updatedAt: Timestamp
  observations/{obsId}
    dateTime: Timestamp
    eventId, eventName, siteId, siteName: string
    siteSource: default (opcional para marcações de sítios padrão)
    tag: interested | planned | observed
    updatedAt: Timestamp

defaultSites/{siteId}
  latitude, longitude, minObservationAltitude, radiusKm: number
  name: string

publicUsers/{uid}
  displayName, institution, username: string
  isPublic: boolean
  observations/{opaqueId}
    dateTime: Timestamp
    eventId, eventName, siteName, tag: string

usernames/{username}
  uid: string
```

O titular pode ler seus dados privados. Administradores também podem consultar perfis e sítios cadastrados. As cópias em `publicUsers` excluem e-mail, tema, coordenadas e identificador do sítio. O UID identifica o perfil público; os IDs das marcações públicas são hashes. Desativar `isPublic` ou mudar o nome de usuário bloqueia o acesso público antigo pelas regras, mesmo antes da próxima sincronização.

O nome de usuário tem de 3 a 30 caracteres: letras minúsculas, números, hífen ou sublinhado, com início e fim alfanuméricos. Perfil e reserva do nome são gravados em uma transação. Ao trocar o nome, a reserva anterior é liberada.

Ao entrar na conta, o aplicativo sincroniza as cópias públicas. Gravações posteriores de marcações atualizam os documentos privado e público no mesmo lote. Cópias que já estão atualizadas não são regravadas.

As marcações exibem `sítio - nome do observador`, usando o nome atual do perfil. O nome abre `/users/{username}` somente quando o perfil é público; em perfis privados, aparece como texto. Essa identificação não acrescenta campos aos documentos de observações.

Sítios aceitam latitude de -90 a 90, longitude de -180 a 180, raio maior que zero e até 5000 km e altitude mínima de 0 a 90 graus. Altitude é o ângulo acima do horizonte, não a elevação do terreno.

## Sítios padrão e administração

Cadastre os locais de referência em `defaultSites` pelo console do Firestore ou por uma ferramenta administrativa autorizada. Use os mesmos nomes de campos e limites de coordenadas, raio e altitude dos sítios pessoais. A página inicial lista os documentos da coleção, que tem leitura pública.

Contas novas recebem `isAdmin: false` no perfil do Firestore. Para conceder acesso ao primeiro administrador, um operador autorizado do projeto Firebase deve alterar `users/{uid}.isAdmin` para o booleano `true` no console após a criação da conta. Perfis existentes sem o campo são tratados como contas comuns.

Administradores veem **Administração** na navegação. Podem editar nome, nome de usuário, instituição, visibilidade, tema e papel administrativo, além de editar ou excluir os sítios cadastrados. A exclusão exige confirmação e preserva as marcações já salvas. O e-mail de autenticação continua sob controle do titular, com confirmação pelo Firebase Auth. A revogação do papel retira o acesso administrativo às próximas operações.

Publique as regras no mesmo projeto indicado por `NEXT_PUBLIC_FIREBASE_PROJECT_ID` antes de usar a listagem administrativa, a exclusão de sítios pelo painel e as marcações de sítios padrão. Se a listagem informar permissão negada, confira a publicação e o campo `isAdmin` da conta.

```powershell
firebase deploy --only firestore:rules --project SEU_PROJECT_ID
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

## Contribuir

Consulte o [guia de contribuição e segurança](CONTRIBUTING.md) para preparar mudanças, testar permissões e revisar alterações no Firestore.

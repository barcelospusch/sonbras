# Sonbras

Plataforma de planejamento de ocultações estelares em Next.js App Router, TypeScript, Firebase Auth e Firestore, com Phosphor duotone e `@dimitri.pusch/occjs` 0.2.0.

Consulte a [arquitetura do projeto](docs/architecture.md) para responsabilidades das camadas, fluxos de dados e convenções de desenvolvimento.

## Executar e configurar

Requer Node.js 22+.

```powershell
npm install
Copy-Item .env.example .env.local
# Preencha a configuração Firebase e as credenciais do servidor.
npm run dev
```

Abra http://localhost:3000. As fontes Manrope e DM Sans são servidas localmente.

No Firebase Authentication, habilite Google e E-mail/Senha e autorize localhost e o domínio de produção. O e-mail fica no Firebase Auth, sem cópia pública no Firestore. A alteração de e-mail usa confirmação no novo endereço e pode exigir reautenticação.

O navegador utiliza somente as variáveis `NEXT_PUBLIC_FIREBASE_*`. O servidor utiliza o SDK Admin para consultar perfis por username e ler/escrever o cache. Configure uma das opções:

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`, somente no ambiente do servidor. A chave aceita quebras de linha reais ou escapadas como `\n`.
- `GOOGLE_APPLICATION_CREDENTIALS` apontando para uma conta de serviço fora do repositório.
- `FIREBASE_USE_ADC=true` quando Application Default Credentials já estiver disponível. Ambientes Google Cloud reconhecidos também utilizam ADC.

Nunca use `NEXT_PUBLIC_` para credenciais Admin. Sem configuração Admin, o serviço de perfis retorna 503 com uma mensagem de configuração; as consultas científicas continuam disponíveis diretamente pelo occjs, sem cache persistente. Com Admin configurado e permissões de Firestore e Firebase Auth, os perfis e o cache são habilitados. Reinicie o servidor após alterar as variáveis.

## Estrutura do banco

```text
users/{uid}
  username: string
  displayName: string
  institution: string
  isPublic: boolean
  preferences:
    theme: dark | light | red
  createdAt: Timestamp
  updatedAt: Timestamp

  sites/{siteId}
    name: string
    latitude: number
    longitude: number
    radiusKm: number
    minObservationAltitude: number
    createdAt: Timestamp
    updatedAt: Timestamp

  tagged/{eventId}~{siteId}
    eventId: string
    siteId: string
    status: interested | planned | observed
    eventSnapshot:
      name: string
      dateTime: Timestamp
      gaiaSourceId: string | null
    siteNameSnapshot: string
    createdAt: Timestamp
    updatedAt: Timestamp

predictionCache/{eventId}
  data:
    event: objeto retornado pelo occjs (quando consultado)
    paths: trajetórias retornadas pelo occjs (quando consultadas)
  fetchedAt: Timestamp
  expiresAt: Timestamp
```

Não há coleções auxiliares de perfis públicos ou de reserva de usernames. Os snapshots preservam o resumo do evento e o nome do sítio no momento da marcação. Gaia IDs são texto; um ID ausente ou já arredondado em um documento legado fica `null`, em vez de receber dígitos inventados.

Sítios mantêm o caminho e os campos anteriores. Latitude: −90 a 90; longitude: −180 a 180; raio: maior que zero e até 5000 km; altitude mínima: 0 a 90 graus acima do horizonte. Altitude não é a elevação do terreno.

## Perfil, username e privacidade

- `/account` permite alterar nome, instituição, username, publicação do perfil, e-mail e tema. O slider usa sol, lua e alien; o tema é persistido em `preferences.theme` e sincronizado pelo Firestore.
- `/users/{username}` consulta `/api/users/{username}`. A rota Admin busca `users.where('username', '==', username)`, verifica `isPublic` e devolve somente nome, username, instituição e resumos das marcações. O proprietário autenticado também pode visualizar a prévia privada.
- O perfil público nunca recebe UID, siteId, coordenadas, preferências, e-mail ou metadados privados. O retorno usa uma lista explícita de campos, paginação de 30 marcações e `Cache-Control: private, no-store`. A publicação é revalidada em cada página.
- Nome de usuário: 3–30 caracteres minúsculos, números, hífen ou sublinhado; início e fim alfanuméricos. A alteração é feita por `PUT /api/account/profile`, com ID token Firebase verificado no servidor. A transação de servidor consulta o username e grava o perfil; as regras negam alterações de username pelo SDK web. Os testes incluem seis disputas simultâneas pelo mesmo nome.
- Documentos `users` e suas subcoleções são privados, inclusive quando `isPublic=true`. A exposição controlada ocorre somente pela rota do servidor. Não libere leitura pública da coleção `users` para viabilizar a busca de usernames.
- Ao mudar o username, o endereço antigo deixa de apontar para o usuário. Não existe reserva extra para o nome anterior.

## Predições e magnitude máxima

`/sites/[id]` consulta `/api/predictions` com as condições do sítio, datas UTC, duração mínima, queda de magnitude e **magnitude máxima da estrela (G)**. O campo de magnitude é opcional: vazio significa sem limite; zero e valores negativos são válidos. Magnitudes menores representam estrelas mais brilhantes.

A rota usa `Prediction.getData` com paginação completa (`limit: 'all'`), envia `magnitude_max` ao LIneA e verifica também `g_star <= limite` localmente. Eventos sem magnitude válida são excluídos quando esse limite está ativo. O período padrão é de sete dias e o máximo é 93 dias, incluindo o fim completo do último dia selecionado.

O filtro geográfico é executado pelo servidor LIneA através dos parâmetros do occjs. Não é reaplicado o `geofilter` do occjs 0.2.0, que pode excluir pontos dentro de faixas largas ao verificar apenas limites e linha central amostrados. A aplicação verifica datas, duração, mag drop, altitude e noite nas coordenadas exatas do sítio, com `isNighttime` e raio zero. Eventos sem coordenadas estelares válidas são excluídos com aviso.

`PrecisePrediction` herda de `Prediction` e adapta os transportes internos `_fetchData` e `_fetchEndpoint`, mantendo paginação e aliases no SDK. `lossless-json` preserva o Gaia ID completo de `gaia_source_id`. Esses pontos de extensão são cobertos por testes; revise o adaptador ao atualizar o SDK.

`/events/[id]` oferece o detalhe real e o link `https://solarsystem.linea.org.br/prediction-event-detail/{id}`. As bolinhas usam `getOccultationPaths` e inclusão em polígonos esféricos, com tratamento do antimeridiano:

- Verde: dentro da sombra nominal (`body_*_limit_*`).
- Vermelho: fora da sombra nominal, dentro da faixa de 1σ (`uncertainty_*_limit_*`).
- Branco: fora de 1σ.
- Cinza tracejado: trajetórias indisponíveis.

A cor usa a posição exata do sítio, não seu raio de busca. As predições podem mudar; duração e altitude são aproximações no instante central e não garantem uma detecção. A altitude não inclui refração ou obstáculos locais.

## Cache persistente

As rotas de detalhe e visibilidade utilizam `predictionCache/{eventId}` com validade de cinco minutos. As partes `data.event` e `data.paths` são preenchidas sob demanda. A inclusão de uma parte não estende a validade de outra já existente; um documento vencido nunca é servido como atual. As listagens continuam consultando o occjs com os filtros da busca.

`firestore.indexes.json` desativa a indexação do payload `data` e declara TTL em `expiresAt`. A remoção física por TTL não é imediata; a aplicação verifica a validade antes de utilizar um documento. Falhas de armazenamento do cache não impedem uma consulta científica bem-sucedida. O navegador não pode ler ou escrever o cache diretamente.

## Atualizar regras e migrar os dados existentes

Faça um backup do Firestore e pause gravações durante a migração. Os comandos abaixo precisam das credenciais Admin e do ID explícito do projeto. Nenhuma migração de produção é executada automaticamente pelo aplicativo.

```powershell
# Revise o plano: não grava nem apaga documentos.
npm run migrate:firestore -- --project SEU_PROJECT_ID

# Publique as novas regras e índices no projeto correto.
firebase deploy --only firestore --project SEU_PROJECT_ID

# Converta perfis e marcações; preserve os documentos antigos como backup.
npm run migrate:firestore -- --project SEU_PROJECT_ID --apply

# Opcional, após revisar o resultado: remova as coleções legadas.
npm run migrate:firestore -- --project SEU_PROJECT_ID --apply --cleanup-legacy
```

A migração converte `theme` em `preferences.theme`, os documentos antigos de `observations` em `tagged`, os status em português para os novos valores e as datas em Timestamp. Preserva os `createdAt` disponíveis e não sobrescreve uma marcação nova com uma cópia antiga. Detecta usernames duplicados, campos de usuário sem mapeamento e registros inválidos antes da primeira gravação. A limpeza das coleções legadas só acontece com `--apply --cleanup-legacy`, depois da gravação e verificação dos destinos.

As regras novas negam acesso às antigas coleções `publicUsers`, `usernames` e `observations`, mesmo antes da limpeza. Não volte a publicar as regras antigas depois da migração.

## Verificação e produção

```powershell
npm test
npm run typecheck
npm run build
npm run audit:occjs
npm run test:rules
npm start
```

`npm test` executa testes offline. `test:rules` requer Firebase CLI e Java 21+ no PATH, inicia somente o emulador Firestore na porta 8787 e utiliza `demo-sonbras`. Testa isolamento, novo schema, disputa de username, compartilhamento/revogação, paginação, cache e migração. Esses testes não alteram produção. `audit:occjs` compara duração, mag drop, magnitude máxima e raio com a API real e verifica o Gaia ID; aceita uma data ISO como argumento.

Hospede em um runtime Next.js/Node.js com saída HTTPS para o LIneA e acesso ao Firebase Admin. Não é um export estático. Ajuste limites de execução conforme o provedor.

Referências: [filtros LIneA](https://solarsystem.linea.org.br/docs/user-guide/filter-events/), [geometria oficial](https://github.com/linea-it/lineaSSP/blob/main/lineaSSP/api/occviz.py), [transações Firestore](https://firebase.google.com/docs/firestore/transaction-data-contention).

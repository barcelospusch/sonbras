# Arquitetura do Sonbras

## Responsabilidades

- `src/app`: páginas, layouts e adaptadores HTTP do App Router. Rotas traduzem requisições e erros para HTTP; não implementam consultas científicas.
- `src/components`: apresentação, formulários e coordenação do estado React. Não acessam o Firestore diretamente.
- `src/lib/repositories`: persistência no navegador sob as regras do Firestore. Sítios, marcações e assinaturas dos dados do usuário ficam aqui.
- `src/lib/server`: serviços exclusivos do servidor, Firebase Admin, autenticação de requisições, perfis públicos e cache. Módulos de entrada usam `server-only` para impedir importação no cliente.
- `src/lib/*.mjs`: cálculos e conversões reutilizáveis por aplicação, testes Node e scripts. `occjs-client.mjs` é o adaptador externo; astronomia e filtros não dependem de React ou Next.
- `tests`: testes de regras de domínio e integração com o emulador. `scripts`: auditoria científica e migração explícita do banco.

## Fluxos

Busca: página → `/api/predictions` → validação em `prediction-query.mjs` → `server/prediction-service.ts` → adaptador occjs → filtros locais → resposta HTTP.

Dados pessoais: componente → repositório → Firebase Web SDK → regras Firestore. O `AppProvider` coordena sessão e estado; `subscribeUserData` administra listeners, criação inicial do perfil e conversão dos snapshots. O descarte da assinatura também ignora callbacks assíncronos atrasados.

Perfis públicos: página → API → autenticação opcional → serviço de perfil → Firebase Admin → DTO público explícito. O SDK do navegador não lê documentos de outros usuários. Alterações de username continuam passando pela transação no servidor.

## Convenções para novas funcionalidades

Mantenha validação e cálculos independentes do transporte. Concentre caminhos, timestamps e operações Firestore nos repositórios; não importe módulos Admin no cliente. Serviços do servidor coordenam integrações e regras de aplicação, enquanto rotas cuidam de status e serialização HTTP. Tipos compartilhados ficam em `lib/types.ts`; funções de domínio reutilizáveis podem usar `.mjs` para execução direta pelos scripts Node.

A organização mantém o schema atual (`users/{uid}/sites`, `users/{uid}/tagged` e `predictionCache`) e os contratos HTTP existentes. Esta refatoração não exige migração do banco.

## Verificação

Execute `npm test`, `npm run typecheck` e `npm run build`. Ao mudar permissões ou consultas Firestore, execute também `npm run test:rules` com Java 21 e o emulador configurados. Use `npm run audit:occjs` para mudanças na integração científica.

# Contribuir com o Sonbras

## Ambiente de desenvolvimento

Use Node.js 22 ou superior. Siga a configuração do [README](README.md) e use um projeto Firebase de desenvolvimento para testes manuais. Trabalhe em uma branch e mantenha o diff focado no comportamento que você está alterando.

Antes de escrever código Next.js, consulte `AGENTS.md` e o guia da versão instalada em `node_modules/next/dist/docs/`. Reutilize os componentes da interface e os tokens de `src/app/globals.css`. Centralize as referências do Firestore em `src/lib/firebase.js` e as operações em `src/lib/repositories`.

## Regras de segurança

- Trate `firestore.rules` como a fronteira de autorização. A navegação e as páginas usam o papel administrativo para orientar a interface, e as regras verificam a permissão em cada operação.
- O papel administrativo vem do booleano `users/{uid}.isAdmin`. Contas novas começam com `false` e só administradores podem alterar o papel de uma conta existente pelo aplicativo. Ao alterar esse fluxo, cubra tentativa de autopromoção e revogação no emulador.
- Os dados de `defaultSites` são públicos. Use apenas locais destinados à divulgação e mantenha os documentos sem dados pessoais. Alterações nessa coleção exigem acesso administrativo ao projeto Firebase.
- Preserve a lista explícita de campos dos perfis e marcações públicos. E-mail, tema, papel administrativo, coordenadas privadas e IDs de sítios pessoais ficam fora das projeções públicas.
- Altere perfis, reservas de nome e projeções públicas de forma atômica. Garanta que desativar a visibilidade retire o acesso ao perfil e às marcações públicas.
- Preserve a validação de limites e tipos no Firestore, mesmo quando o formulário já valida a entrada. Use o emulador para testar operações autorizadas e negadas, incluindo dados legados.
- Mantenha `.env.local`, chaves de conta de serviço, tokens e dados pessoais fora dos commits, exemplos e logs. Use apenas as variáveis públicas do Firebase no navegador.
- Para reportar uma falha que exponha dados ou permita elevação de privilégio, contate os mantenedores por um canal privado e inclua passos de reprodução com dados fictícios.

## Verificar e abrir um pull request

Execute os testes, o build e os testes de regras com Firebase CLI e Java 21 ou superior.

```powershell
npm test
npm run build
npm run test:rules
```

Ao mudar a interface, confira os três temas e a navegação em tela estreita. Para mudanças de acesso, teste como visitante, titular, outro usuário e administrador. Descreva no pull request o fluxo alterado, as verificações realizadas e qualquer etapa de configuração, migração ou publicação de regras.

Use `demo-sonbras` para testes automatizados do Firestore. Para dados reais, siga o procedimento de backup e simulação do README antes de aplicar migrações. Revise o ID do projeto e as regras antes de publicar.

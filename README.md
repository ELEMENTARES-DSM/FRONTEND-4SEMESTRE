# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Sensores da estação

Na listagem de estações, clique no nome para acessar `/platform/estacoes/:estacaoId`.
A tela apresenta sensores e permite ativar/inativar. O botão de adicionar permanece desabilitado; o cadastro será implementado na próxima task.

Contratos utilizados pelo frontend:

- `GET /estacoes/:estacaoId/sensores`: retorna um array de sensores.
- `PATCH /sensores/:id/status`: recebe `{ "status": "Ativo" }` ou `{ "status": "Inativo" }`.


Validação manual com a API disponível: abrir uma estação, conferir listagem e estado vazio; alternar status; simular falha de carregamento e usar “Tentar novamente”.

### Conexão com a API

As chamadas utilizam `VITE_API_URL`, com `http://localhost:8080` como padrão, sem interceptação por mocks. Configure a URL no `.env` e reinicie `npm run dev` após alterações. A autenticação envia o token salvo em `localStorage` na chave `token` como Bearer Token.

Os endpoints de listagem e alteração de status acima foram preservados. A integração ainda precisa alinhar a resposta `{ resumo, estacoes }` da listagem de estações, os campos dos sensores (`tipo` e `unidade_medida` no backend), o cálculo de tempo desde o último ping e o encaminhamento de `/sensores` no gateway.

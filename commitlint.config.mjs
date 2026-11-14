// Conventional Commits 1.0.0 no hook commit-msg do Husky (.husky/commit-msg). Regras em CONTRIBUTING.md.
// No GitHub, esta mesma configuração confere o título do PR, que vira a mensagem do squash (.github/workflows/titulo-pr.yml).
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Escopos do site. Outro escopo só gera aviso, para não travar um assunto novo.
    'scope-enum': [
      1,
      'always',
      ['hero', 'rede', 'robos', 'fundo', 'trabalhos', 'contato', 'conteudo', 'testes', 'deps', 'claude', 'release'],
    ],
  },
}

export default config

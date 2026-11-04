# Decisões do README de perfil

Resumo do que foi decidido para o `aqu1no1/aqu1no1` (branch `readme-v3`, criada a partir da `readme-v2`).

## Visual

| Item | Decisão |
|---|---|
| Tema | **Azul escuro**. Fundo de `#0b1d51` a `#020617`, com destaques em `#58a6ff` / `#1E40AF` |
| Header (`assets/banners/header.svg`) | SVG animado com estrelas, galáxias espirais, nebulosa, ondas de luz e buraco negro à direita |
| Animação do subtítulo | **SWE → SOFTWARE ENGINEER**, e depois volta para SWE. Ciclo de 10 s, sem "Full Stack Developer" |
| Footer (`assets/banners/footer.svg`) | Mesmo estilo do header, com buraco negro no centro e galáxias nas laterais |
| Layout | Versão 1 (Cosmos), com as seções completas |

## Seções

| Seção | Decisão |
|---|---|
| Education | UTFPR e Etec em destaque. Um **"See earlier education"** recolhível mostra a **E.E. Profª Neusa Figueiredo Marçal**, com o logo da escola |
| Experience | Unect Jr. e G4tech lado a lado, sem mudanças |
| Projects | **Projetos em andamento**, na tabela HTML de 2 colunas (versão 1) |
| Finished Projects | Seção nova, logo abaixo de Projects, com os **projetos finalizados** |
| Tech Stack | **Grade centralizada 2 × 10**, com todos os ícones do mesmo tamanho. O "See full stack" fica centralizado embaixo |
| GitHub Stats | Streak, card de contribuições em largura total, e "Top Languages by Repo" + "Stats" lado a lado |

## Projetos via CI (`.github/workflows/projects.yml`)

- **Quando roda:** todo dia às 03:15 (Brasília), quando você roda manualmente e quando muda `projects.json` ou o script.
- **O que faz:** o script `scripts/update-projects.mjs` preenche os blocos `PROJECTS` e `FINISHED` do README.
- **Configuração:** o `projects.json` tem duas listas, `current` (em andamento) e `finished` (finalizados).
- **Lista vazia = modo automático:**
  - `finished` recebe os repos **arquivados** ou com o tópico **`finished`**;
  - `current` recebe os repos com push mais recente que não estão finalizados.
- **Cada card mostra:**
  - nome com link;
  - descrição;
  - **no máximo 3 tags**;
  - ícones da stack;
  - papel e data de atualização. Nos finalizados aparece "✅ finished", com ano e link de demo opcionais.
- **Tópicos com ícone:** tópicos como `typescript`, `react`, `vite`, `rust` e `angular` viram **ícone** em vez de tag. Isso evita repetir o que o ícone já mostra.
- **Repos privados:** aparecem com 🔒 e sem link. Para mostrá-los, é preciso o secret `PROJECTS_TOKEN`.

## GIFs (sem pipeline)

- **Pasta de origem:** os GIFs ficam em `assets/gifs/`, numerados para definir a ordem: `01-chrollo.gif`, `02-....gif`.
- **Script local:** o `scripts/build-gifs.sh` junta todos num único **`assets/hero.gif`**:
  - **10 s por GIF**, em loop infinito;
  - um GIF mais curto repete até completar os 10 s, e um mais longo é cortado;
  - todos ficam com 400 × 225 px.
- **Sem pipeline:** você roda o script no seu computador quando adicionar ou remover um GIF e faz o commit do `hero.gif`. O único requisito é o **ffmpeg**.
- **Por que não ler a pasta direto:** o README não roda código, e um SVG usado como imagem não pode carregar outros arquivos. Por isso os GIFs precisam virar um arquivo só.
- **Enquanto o `hero.gif` não existe:** o README continua com o GIF do Giphy, e a linha para trocar já está comentada logo acima dele.

## Estrutura de pastas

```
aqu1no1/
├── README.md
├── projects.json                  ← projetos (current / finished)
├── assets/
│   ├── banners/                   ← header.svg, footer.svg
│   ├── logos/                     ← utfpr, etec, neusa, unect, g4tech
│   ├── icons/                     ← section.gif (antigo gif-azul.gif), expo, typeorm, linear, api, os
│   ├── gifs/                      ← GIFs de origem (você coloca aqui)
│   └── hero.gif                   ← gerado pelo build-gifs.sh
├── scripts/
│   ├── update-projects.mjs        ← usado pelo CI
│   └── build-gifs.sh              ← rodado por você
├── docs/                          ← decisoes.md, plano-readme.md
├── profile-summary-card-output/   ← gerado pelo summary-cards (não mexer)
└── .github/workflows/             ← summary-cards.yml, projects.yml
```

- `assets/see-full-stack.svg` foi removido porque não era usado.

## Pendências

- [ ] Anexar os GIFs em `assets/gifs/` e rodar `./scripts/build-gifs.sh`.
- [ ] Trocar a linha do Giphy no README pela de `assets/hero.gif`.
- [ ] Marcar os projetos finalizados: arquive o repo ou adicione o tópico `finished`, ou liste-os em `projects.json → finished`.
- [ ] Trocar o link do badge **Portfolio** (`https://YOUR-PORTFOLIO-URL`).
- [ ] Opcional: decidir se o typing SVG continua, já que repete o subtítulo do header.
- [ ] Opcional: usar um logo da Neusa em resolução maior.

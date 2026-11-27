# Decisões do README de perfil

Resumo do que foi decidido para o `aqu1no1/aqu1no1` (branch `readme-v4`, criada a partir da `readme-v3`, que veio da `readme-v2`).

## Visual

| Item | Decisão |
|---|---|
| Tema | **Verde** (v4). Header, footer, ícone de seção, tags dos projetos, subtítulo e streak em `#4ADE80` / `#15803D`. A v3 era azul escuro |
| Contato | Botões **neon** próprios em `assets/contact/` (LinkedIn, Gmail, Portfolio), no lugar dos badges do shields.io |
| Hero GIF | Por enquanto só os trechos do Zoro. A versão final vai ter os 10 GIFs do Zoro da nova lista |
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
| Finished Projects | Logo abaixo de Projects, **recolhível** ("See finished projects"). Os 3 repos do Currency Converter (API, Web, App) viram **um card só** |
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

- **Pasta de origem:** os GIFs ficam em `assets/gifs/`, numerados para definir a ordem.
- **Lista:** os 17 GIFs escolhidos (Zoro, Luffy, Shanks, Hiei, Killua, Barba Negra, LeBron, Ja Morant…) estão em `assets/gifs/sources.txt`. O `scripts/fetch-gifs.sh` baixa todos do Giphy.
- **Script local:** o `scripts/build-gifs.sh` junta todos num único **`assets/hero.gif`**:
  - cada GIF toca **inteiro e na velocidade original** (mesmos tempos de quadro), e o próximo só entra quando ele termina; o conjunto fica em loop infinito;
  - GIFs com menos de 3 s repetem o ciclo completo até passar de 3 s, para não piscarem (`MIN_SECONDS`);
  - **qualidade máxima:** quadro de 480 × 270 px (resolução original dos GIFs), paleta de 256 cores própria para cada quadro, nada é cortado e as sobras (GIFs quadrados ou verticais) ficam transparentes.
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
│   ├── gifs/                      ← sources.txt + GIFs de origem
│   └── hero.gif                   ← gerado pelo build-gifs.sh
├── scripts/
│   ├── update-projects.mjs        ← usado pelo CI
│   ├── fetch-gifs.sh              ← baixa os GIFs do sources.txt (rodado por você)
│   └── build-gifs.sh              ← gera o hero.gif (rodado por você)
├── docs/                          ← decisoes.md, plano-readme.md
├── profile-summary-card-output/   ← gerado pelo summary-cards (não mexer)
└── .github/workflows/             ← summary-cards.yml, projects.yml
```

- `assets/see-full-stack.svg` foi removido porque não era usado.

## Pendências

- [x] Gerar o `hero.gif` em qualidade máxima, com cada GIF inteiro e na velocidade original (1min42s, ~76 MB), e usá-lo no README com 480 px.
- [ ] Marcar os projetos finalizados: arquive o repo ou adicione o tópico `finished`, ou liste-os em `projects.json → finished`.
- [ ] Trocar o link do badge **Portfolio** (`https://YOUR-PORTFOLIO-URL`).
- [ ] Opcional: decidir se o typing SVG continua, já que repete o subtítulo do header.
- [ ] Opcional: usar um logo da Neusa em resolução maior.

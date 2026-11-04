# Plano: `readme-v2` → `readme-v3`

As decisões estão em [`decisoes.md`](decisoes.md). Este arquivo é o passo a passo para aplicar tudo.

## 1. Criar a branch

```bash
git checkout readme-v2
git pull
git checkout -b readme-v3
```

## 2. Copiar os arquivos

Extraia o conteúdo da pasta `aqu1no1/` do zip **por cima** da raiz do repositório.

Depois, apague os arquivos que mudaram de lugar:

```bash
git rm assets/header.svg assets/footer.svg assets/gif-azul.gif assets/see-full-stack.svg \
       assets/utfpr.svg assets/etec-lauro-gomes.png assets/unect.svg assets/g4tech.svg \
       assets/expo.svg assets/typeorm.svg assets/linear.svg assets/api.svg assets/os.svg
git rm --ignore-unmatch assets/neusa.png
git add -A
git status
```

O que muda em relação à `readme-v2`:

| Arquivo | O que muda |
|---|---|
| `README.md` | Caminhos novos das imagens, seção **Finished Projects**, header e footer azuis e linha do `hero.gif` comentada |
| `assets/banners/*` | Header e footer azuis com galáxias e SWE → SOFTWARE ENGINEER |
| `assets/logos/*`, `assets/icons/*` | Mesmos arquivos de antes, só mudaram de pasta |
| `projects.json` | Formato novo, com as listas `current` e `finished` |
| `scripts/update-projects.mjs` | Gera as duas seções, limita a 3 tags por card e transforma tópicos como `typescript` e `vite` em ícones |
| `scripts/build-gifs.sh` | Novo: junta os GIFs de `assets/gifs/` em `assets/hero.gif` |
| `scripts/fetch-gifs.sh` + `assets/gifs/sources.txt` | Novo: baixa do Giphy os GIFs listados |
| `.github/workflows/*` | Sem mudanças |

## 3. GIFs (rotação de 10 s, sem pipeline)

1. **Instale o ffmpeg:**
   - Linux: `sudo apt install ffmpeg`
   - macOS: `brew install ffmpeg`
   - Windows: `winget install ffmpeg`, e use o Git Bash para rodar o script.
2. **Baixe os GIFs.** A lista fica em `assets/gifs/sources.txt`, no formato `nome  link-do-giphy`, e já vem com os 17 GIFs escolhidos. A ordem da lista é a ordem de exibição.
   ```bash
   ./scripts/fetch-gifs.sh
   ```
   O script salva `assets/gifs/01-zoro.gif`, `02-one-piece.gif`… Também dá para colocar um `.gif` direto na pasta, sem passar pela lista.
3. **Gere o arquivo final:**
   ```bash
   ./scripts/build-gifs.sh
   ```
   É possível ajustar com variáveis, por exemplo `SECONDS_EACH=8 WIDTH=480 HEIGHT=270 ./scripts/build-gifs.sh`.
4. **Troque a linha no README.** A linha do Giphy:
   ```html
   <img src="https://media.giphy.com/media/MszCRIaNuRVJkt6dso/giphy.gif" width="400" alt="Chrollo Lucilfer" />
   ```
   vira esta, e o comentário logo acima dela pode ser apagado:
   ```html
   <img src="assets/hero.gif" width="400" alt="" />
   ```
5. **Commit:** faça o commit da pasta `assets/gifs/` e do `assets/hero.gif`.

Para adicionar ou remover um GIF depois:
1. edite o `sources.txt`;
2. apague o `.gif` correspondente da pasta, se for o caso;
3. rode `fetch-gifs.sh` e `build-gifs.sh`;
4. faça o commit.

> **Tamanho:** 17 GIFs × 10 s dão um `hero.gif` de 2min50s, que provavelmente vai passar de 10 MB e ficar pesado no README. Se o script avisar, escolha uma destas opções:
> - menos qualidade: `FPS=10 COLORS=64 WIDTH=320 ./scripts/build-gifs.sh`;
> - menos tempo por GIF: `SECONDS_EACH=5`;
> - menos GIFs: comente linhas do `sources.txt` com `#` e apague os `.gif` delas.

> Se o script avisar que o arquivo está grande (acima de ~9 MB), rode com `FPS=12 COLORS=64` ou `WIDTH=360`.

## 4. Projetos

Os projetos em andamento já aparecem sozinhos no modo automático.

Para preencher **Finished Projects**, escolha uma destas opções:
- arquive o repositório no GitHub (**Settings → Archive**);
- adicione o tópico `finished` nele (engrenagem ⚙️ ao lado de **About**);
- liste-o em `projects.json`:
  ```json
  "finished": {
    "limit": 4,
    "repos": [
      { "repo": "aqu1no1/projeto", "role": "Full Stack", "finished": "2025", "demo": "https://..." }
    ]
  }
  ```

Ajustes opcionais no `projects.json`:
- `"maxTags": 3` muda quantas tags aparecem por card;
- `"maxIcons": 8` muda quantos ícones aparecem por card.

## 5. Publicar

```bash
git commit -m "README v3: tema azul, finished projects, rotação de GIFs, pastas organizadas"
git push -u origin readme-v3
```

1. Confira a branch em `github.com/aqu1no1/aqu1no1/tree/readme-v3`.
2. Rode **Actions → Atualizar projetos do README → Run workflow** na branch `readme-v3`.
3. Quando estiver tudo certo, escolha um destes caminhos:
   - torne a `readme-v3` a branch padrão em **Settings → General → Default branch**;
   - ou faça o merge dela na `readme-v2`.

## 6. Checklist

- [ ] Header e footer azuis animados, com galáxias.
- [ ] Animação SWE → SOFTWARE ENGINEER funcionando.
- [ ] Todas as imagens carregam: logos, ícones e o ícone dos títulos (`section.gif`).
- [ ] "See earlier education" abre e mostra a Neusa.
- [ ] Projects mostra no máximo 3 tags por card.
- [ ] Finished Projects aparece. Se estiver vazio, mostra "Finished projects will show up here soon."
- [ ] O GIF troca a cada 10 s, depois de gerar o `hero.gif`.
- [ ] Conferir no celular e no tema claro do GitHub.

## 7. Problemas comuns

| Sintoma | Solução |
|---|---|
| Imagem quebrada | Algum arquivo antigo não foi movido. Confira se ele está em `assets/logos/` ou `assets/icons/` |
| `ffmpeg não encontrado` | Instale o ffmpeg (passo 3.1) |
| `Nenhum GIF em assets/gifs` | Os arquivos precisam terminar em `.gif` |
| `hero.gif` muito pesado | `FPS=12 COLORS=64 ./scripts/build-gifs.sh` |
| Workflow falha com `403` no push | Em **Settings → Actions → General**, marque **Read and write permissions** |
| Projeto privado não aparece | Configure o secret `PROJECTS_TOKEN` com acesso de leitura ao repo |

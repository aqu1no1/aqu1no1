#!/usr/bin/env bash
# Junta todos os GIFs de assets/gifs/ num único assets/hero.gif, um depois do outro, em loop infinito.
# Cada GIF toca inteiro, na velocidade original (mesmos tempos de quadro, sem reamostrar o fps),
# e só depois vem o próximo. GIFs muito curtos repetem o ciclo completo até passar de MIN_SECONDS,
# para não piscarem na tela. A qualidade é a máxima: resolução original (só reduz se passar do
# quadro), paleta de 256 cores própria para cada quadro e nada é cortado (sobras ficam transparentes).
# Não precisa de pipeline: rode localmente sempre que adicionar ou remover um GIF e faça o commit.
#
# Uso:
#   ./scripts/build-gifs.sh
#   MIN_SECONDS=0 WIDTH=480 HEIGHT=270 ./scripts/build-gifs.sh
#
# Requisito: ffmpeg  (Linux: sudo apt install ffmpeg · macOS: brew install ffmpeg ·
#                     Windows: winget install ffmpeg, e rode pelo Git Bash)
# A ordem segue o nome dos arquivos: 01-zoro.gif, 02-one-piece.gif, ...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${SRC:-$ROOT/assets/gifs}"
OUT="${OUT:-$ROOT/assets/hero.gif}"
WIDTH="${WIDTH:-480}"
HEIGHT="${HEIGHT:-270}"
MIN_SECONDS="${MIN_SECONDS:-3}"

command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado. Instale e rode de novo." >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe não encontrado (vem junto com o ffmpeg)." >&2; exit 1; }

shopt -s nullglob nocaseglob
files=("$SRC"/*.gif)
shopt -u nocaseglob
if [ ${#files[@]} -eq 0 ]; then
  echo "Nenhum GIF em $SRC" >&2
  exit 1
fi
IFS=$'\n' files=($(printf '%s\n' "${files[@]}" | sort)); unset IFS

inputs=()
filters=""
labels=""
total=0
for i in "${!files[@]}"; do
  f="${files[$i]}"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  reps=$(awk -v d="$dur" -v m="$MIN_SECONDS" 'BEGIN { r = 1; while (d * r < m) r++; print r }')
  total=$(awk -v t="$total" -v d="$dur" -v r="$reps" 'BEGIN { print t + d * r }')
  inputs+=(-ignore_loop 1 -stream_loop "$((reps - 1))" -i "$f")
  filters+="[$i:v]format=rgba,scale='min(iw,${WIDTH})':'min(ih,${HEIGHT})':force_original_aspect_ratio=decrease:flags=lanczos,"
  filters+="pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1,setpts=PTS-STARTPTS[v$i];"
  labels+="[v$i]"
  echo "  + $(basename "$f")  (${dur}s × ${reps})"
done
n=${#files[@]}
filters+="${labels}concat=n=${n}:v=1:a=0,split[a][b];"
filters+="[a]palettegen=max_colors=256:stats_mode=single:reserve_transparent=1[p];"
filters+="[b][p]paletteuse=new=1:dither=sierra2_4a:alpha_threshold=128"

ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "$filters" -fps_mode passthrough -loop 0 "$OUT"

size=$(du -h "$OUT" | cut -f1)
printf '✔ %s  (%d GIF(s), %.1fs no total, %sx%s, %s)\n' "$OUT" "$n" "$total" "$WIDTH" "$HEIGHT" "$size"

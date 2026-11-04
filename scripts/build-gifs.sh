#!/usr/bin/env bash
# Junta todos os GIFs de assets/gifs/ num único assets/hero.gif.
# Cada GIF fica SECONDS segundos na tela (repete se for mais curto, corta se for mais longo)
# e depois passa para o próximo, em loop infinito. Não precisa de pipeline: rode localmente
# sempre que adicionar ou remover um GIF da pasta e faça o commit do hero.gif.
#
# Uso:
#   ./scripts/build-gifs.sh
#   SECONDS_EACH=8 WIDTH=480 HEIGHT=270 ./scripts/build-gifs.sh
#
# Requisito: ffmpeg  (Linux: sudo apt install ffmpeg · macOS: brew install ffmpeg ·
#                     Windows: winget install ffmpeg, e rode pelo Git Bash)
# A ordem segue o nome dos arquivos: 01-chrollo.gif, 02-outro.gif, ...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${SRC:-$ROOT/assets/gifs}"
OUT="${OUT:-$ROOT/assets/hero.gif}"
SECONDS_EACH="${SECONDS_EACH:-10}"
WIDTH="${WIDTH:-400}"
HEIGHT="${HEIGHT:-225}"
FPS="${FPS:-15}"
COLORS="${COLORS:-128}"

command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado. Instale e rode de novo." >&2; exit 1; }

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
for i in "${!files[@]}"; do
  inputs+=(-ignore_loop 0 -stream_loop -1 -t "$SECONDS_EACH" -i "${files[$i]}")
  # preenche o quadro WIDTHxHEIGHT sem distorcer (corta as sobras) e normaliza o fps
  filters+="[$i:v]fps=$FPS,scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos,crop=${WIDTH}:${HEIGHT},setsar=1,trim=duration=${SECONDS_EACH},setpts=PTS-STARTPTS[v$i];"
  labels+="[v$i]"
  echo "  + $(basename "${files[$i]}")"
done
n=${#files[@]}
filters+="${labels}concat=n=${n}:v=1:a=0,split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle"

ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "$filters" -loop 0 "$OUT"

size=$(du -h "$OUT" | cut -f1)
echo "✔ $OUT  (${n} GIF(s) × ${SECONDS_EACH}s = $((n * SECONDS_EACH))s, ${WIDTH}x${HEIGHT}, $size)"
if [ "$(du -k "$OUT" | cut -f1)" -gt 9000 ]; then
  echo "⚠ Arquivo grande: o GitHub pode não exibir imagens acima de ~10 MB. Tente FPS=12, COLORS=64 ou WIDTH=360." >&2
fi

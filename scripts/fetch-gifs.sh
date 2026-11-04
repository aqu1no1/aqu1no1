#!/usr/bin/env bash
# Baixa os GIFs listados em assets/gifs/sources.txt para assets/gifs/<nome>.gif.
# Rode no seu computador (precisa de curl). Depois rode ./scripts/build-gifs.sh.
#   ./scripts/fetch-gifs.sh          baixa só os que ainda não existem
#   FORCE=1 ./scripts/fetch-gifs.sh  baixa tudo de novo
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/assets/gifs"
LIST="$DIR/sources.txt"
[ -f "$LIST" ] || { echo "Não achei $LIST" >&2; exit 1; }

ok=0; fail=0
while read -r name url _; do
  [[ -z "${name:-}" || "$name" == \#* ]] && continue
  id="${url%%\?*}"; id="${id%/}"; id="${id##*/}"; id="${id##*-}"   # último trecho depois do último "-"
  out="$DIR/$name.gif"
  if [[ -f "$out" && -z "${FORCE:-}" ]]; then echo "  = $name (já existe)"; ok=$((ok+1)); continue; fi
  if curl -fsSL --retry 2 -o "$out.tmp" "https://media.giphy.com/media/$id/giphy.gif" && head -c 3 "$out.tmp" | grep -q GIF; then
    mv "$out.tmp" "$out"; echo "  + $name ($(du -h "$out" | cut -f1))"; ok=$((ok+1))
  else
    rm -f "$out.tmp"; echo "  ✗ $name — não consegui baixar ($url)" >&2; fail=$((fail+1))
  fi
done < "$LIST"
echo "✔ $ok baixado(s)$([ $fail -gt 0 ] && echo ", $fail com erro")"

#!/usr/bin/env bash
# Read-only: copies everything under asiko.africa's document root on the cPanel
# host into ./live-snapshot/ (text files with content, every file in MANIFEST.tsv).
#   CPANEL_TOKEN (required), CPANEL_USER, CPANEL_HOST, SITE_DOMAIN as in cpanel-deploy.sh
set -euo pipefail

: "${CPANEL_TOKEN:?CPANEL_TOKEN is not set}"
USER_="${CPANEL_USER:-mediaic1}"
HOST="${CPANEL_HOST:-mediaiconsafrica.com}"
DOMAIN="${SITE_DOMAIN:-asiko.africa}"
BASE="https://${HOST}:2083"
AUTH="Authorization: cpanel ${USER_}:${CPANEL_TOKEN}"
OUT="${OUT:-live-snapshot}"

api() { curl -sS --fail-with-body -H "$AUTH" "$@"; }

info=$(api "${BASE}/execute/DomainInfo/single_domain_data?domain=${DOMAIN}")
ROOT=$(echo "$info" | jq -r '.data.documentroot')
echo "document root: ${ROOT}"
mkdir -p "$OUT"
printf 'path\tsize\tmtime\n' > "$OUT/MANIFEST.tsv"

walk() {
  local dir="$1" rel="$2" r
  r=$(api -G "${BASE}/execute/Fileman/list_files" --data-urlencode "dir=${dir}" \
        --data-urlencode "show_hidden=1" --data-urlencode "include_mime=1")
  echo "$r" | jq -c '.data[]?' | while read -r e; do
    name=$(echo "$e" | jq -r '.file'); type=$(echo "$e" | jq -r '.type')
    path="${rel:+$rel/}${name}"
    if [ "$type" = dir ]; then
      walk "${dir}/${name}" "$path"
    else
      printf '%s\t%s\t%s\n' "$path" "$(echo "$e" | jq -r '.size')" \
        "$(date -u -d "@$(echo "$e" | jq -r '.mtime')" +%FT%TZ)" >> "$OUT/MANIFEST.tsv"
      case "$name" in
        *.html|*.htm|*.css|*.js|*.json|*.txt|*.xml|*.md|*.php|*.svg|.htaccess|*.webmanifest)
          mkdir -p "$OUT/$(dirname "$path")"
          api -G "${BASE}/execute/Fileman/get_file_content" --data-urlencode "dir=${dir}" \
            --data-urlencode "file=${name}" | jq -r '.data.content // empty' > "$OUT/$path" ;;
      esac
    fi
  done
}
walk "$ROOT" ""
echo "$(($(wc -l < "$OUT/MANIFEST.tsv") - 1)) files listed"

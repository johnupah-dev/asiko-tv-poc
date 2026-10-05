#!/usr/bin/env bash
# Uploads docs/ + deploy/asiko.africa.htaccess to asiko.africa's document root
# through the cPanel API. Run `node build.mjs` first.
#   CPANEL_TOKEN  cPanel API token (required — keep it in a secret, never in git)
#   CPANEL_USER   default mediaic1
#   CPANEL_HOST   default mediaiconsafrica.com
#   SITE_DOMAIN   default asiko.africa
set -euo pipefail

: "${CPANEL_TOKEN:?CPANEL_TOKEN is not set — add it under repo Settings > Secrets and variables > Actions}"
USER_="${CPANEL_USER:-mediaic1}"
HOST="${CPANEL_HOST:-mediaiconsafrica.com}"
DOMAIN="${SITE_DOMAIN:-asiko.africa}"
BASE="https://${HOST}:2083"
AUTH="Authorization: cpanel ${USER_}:${CPANEL_TOKEN}"
BACKUP_DIR="${BACKUP_DIR:-backup}"

api() { curl -sS --fail-with-body -H "$AUTH" "$@"; }
uapi_ok() { jq -e '.status == 1' >/dev/null; }

cd "$(dirname "$0")/.."
[ -f docs/index.html ] || { echo "docs/index.html missing — run node build.mjs"; exit 1; }

echo "== Finding the document root for ${DOMAIN}"
info=$(api "${BASE}/execute/DomainInfo/single_domain_data?domain=${DOMAIN}")
echo "$info" | uapi_ok || { echo "$info" | jq '.errors'; exit 1; }
ROOT=$(echo "$info" | jq -r '.data.documentroot')
HOME_=$(echo "$info" | jq -r '.data.homedir')
echo "document root: ${ROOT}"

echo "== Backing up the live index.html and .htaccess"
mkdir -p "$BACKUP_DIR"
for f in index.html .htaccess; do
  r=$(api -G "${BASE}/execute/Fileman/get_file_content" --data-urlencode "dir=${ROOT}" --data-urlencode "file=${f}" || true)
  if echo "$r" | uapi_ok 2>/dev/null; then
    echo "$r" | jq -r '.data.content' > "${BACKUP_DIR}/${f#.}.bak"
    echo "  saved ${f}"
  else
    echo "  ${f} not found (fine on a first deploy)"
  fi
done

echo "== Uploading"
stage=$(mktemp -d)
cp -r docs/. "$stage/"
cp deploy/asiko.africa.htaccess "$stage/.htaccess"

# cPanel API2 mkdir takes a path relative to the home directory
rel_root="${ROOT#"${HOME_}"/}"
( cd "$stage" && find . -type d ! -name . | sort ) | while read -r d; do
  d="${d#./}"
  parent="${rel_root}/$(dirname "$d")"; parent="${parent%/.}"
  api -G "${BASE}/json-api/cpanel" \
    --data-urlencode "cpanel_jsonapi_user=${USER_}" --data-urlencode "cpanel_jsonapi_apiversion=2" \
    --data-urlencode "cpanel_jsonapi_module=Fileman" --data-urlencode "cpanel_jsonapi_func=mkdir" \
    --data-urlencode "path=${parent}" --data-urlencode "name=$(basename "$d")" >/dev/null || true
done

( cd "$stage" && find . -type d | sort ) | while read -r d; do
  mapfile -t files < <(cd "$stage/$d" && find . -maxdepth 1 -type f -printf '%f\n' | sort)
  [ ${#files[@]} -eq 0 ] && continue
  target="${ROOT}/${d#./}"; target="${target%/.}"
  args=(-F "dir=${target}" -F "overwrite=1")
  i=1; for f in "${files[@]}"; do args+=(-F "file-${i}=@${stage}/${d}/${f};filename=${f}"); i=$((i+1)); done
  r=$(api "${BASE}/execute/Fileman/upload_files" "${args[@]}")
  echo "$r" | uapi_ok || { echo "upload to ${target} failed:"; echo "$r" | jq '.errors, .data.uploads'; exit 1; }
  echo "  ${target}: ${#files[@]} file(s)"
done

echo "== Verifying https://www.${DOMAIN}/"
sleep 3
page=$(curl -sSL --max-time 30 "https://www.${DOMAIN}/?deploy=$(date +%s)")
if echo "$page" | grep -q '__ASIKO_CFG__'; then
  echo "LIVE: www.${DOMAIN} is serving the new build"
else
  echo "Uploaded, but www.${DOMAIN} is not serving the new build (DNS may point elsewhere, or a cache is in front)"; exit 1
fi

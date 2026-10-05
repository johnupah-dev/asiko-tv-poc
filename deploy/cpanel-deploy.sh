#!/usr/bin/env bash
# Uploads a static site + its .htaccess to a domain's document root through the
# cPanel API. Defaults deploy asiko.africa (run `node build.mjs` first).
#   CPANEL_TOKEN   cPanel API token (required — keep it in a secret, never in git)
#   CPANEL_USER    default mediaic1
#   CPANEL_HOST    default mediaiconsafrica.com
#   SITE_DOMAIN    default asiko.africa
#   SRC_DIR        folder to upload, default docs
#   HTACCESS       .htaccess source, default deploy/asiko.africa.htaccess
#   HTACCESS_MODE  replace (default) uploads HTACCESS as-is; prepend keeps the
#                  live .htaccess and puts HTACCESS's block above it
#   VERIFY_MARKER  string the live page must contain, default __ASIKO_CFG__
#   GUARD_DOMAINS  space-separated domains whose document root must differ from
#                  SITE_DOMAIN's (stops one site overwriting another)
set -euo pipefail

: "${CPANEL_TOKEN:?CPANEL_TOKEN is not set — add it under repo Settings > Secrets and variables > Actions}"
USER_="${CPANEL_USER:-mediaic1}"
HOST="${CPANEL_HOST:-mediaiconsafrica.com}"
DOMAIN="${SITE_DOMAIN:-asiko.africa}"
BASE="https://${HOST}:2083"
AUTH="Authorization: cpanel ${USER_}:${CPANEL_TOKEN}"
BACKUP_DIR="${BACKUP_DIR:-backup}"
SRC="${SRC_DIR:-docs}"
HTA="${HTACCESS:-deploy/asiko.africa.htaccess}"
HTA_MODE="${HTACCESS_MODE:-replace}"
MARKER="${VERIFY_MARKER:-__ASIKO_CFG__}"

api() { curl -sS --fail-with-body -H "$AUTH" "$@"; }
uapi_ok() { jq -e '.status == 1' >/dev/null; }

cd "$(dirname "$0")/.."
[ -f "${SRC}/index.html" ] || { echo "${SRC}/index.html missing (for docs/, run node build.mjs)"; exit 1; }
[ -f "$HTA" ] || { echo "${HTA} missing"; exit 1; }

echo "== Finding the document root for ${DOMAIN}"
info=$(api "${BASE}/execute/DomainInfo/single_domain_data?domain=${DOMAIN}")
echo "$info" | uapi_ok || { echo "$info" | jq '.errors'; exit 1; }
ROOT=$(echo "$info" | jq -r '.data.documentroot')
HOME_=$(echo "$info" | jq -r '.data.homedir')
echo "document root: ${ROOT}"
for g in ${GUARD_DOMAINS:-}; do
  gi=$(api "${BASE}/execute/DomainInfo/single_domain_data?domain=${g}")
  echo "$gi" | uapi_ok || { echo "could not look up ${g}:"; echo "$gi" | jq '.errors'; exit 1; }
  groot=$(echo "$gi" | jq -r '.data.documentroot')
  [ "$groot" != "$ROOT" ] || { echo "ABORT: ${g} shares document root ${ROOT} with ${DOMAIN} — deploying would overwrite it"; exit 1; }
  echo "  ${g} lives in ${groot} — separate, ok"
done

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
cp -r "${SRC}/." "$stage/"
rm -f "$stage/.htaccess"
case "$HTA_MODE" in
  replace) cp "$HTA" "$stage/.htaccess" ;;
  prepend)
    # keep whatever cPanel / the host already put in the live .htaccess, drop
    # any block we prepended last time, and put the current block on top
    live="${BACKUP_DIR}/htaccess.bak"
    { cat "$HTA"; echo
      [ -f "$live" ] && sed '/^# >>> managed by cpanel-deploy.sh/,/^# <<< managed by cpanel-deploy.sh/d' "$live"
    } > "$stage/.htaccess" ;;
  *) echo "HTACCESS_MODE must be replace or prepend"; exit 1 ;;
esac

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
if echo "$page" | grep -qF "$MARKER"; then
  echo "LIVE: www.${DOMAIN} is serving the new build"
else
  echo "Uploaded, but www.${DOMAIN} is not serving the new build (DNS may point elsewhere, or a cache is in front)"; exit 1
fi

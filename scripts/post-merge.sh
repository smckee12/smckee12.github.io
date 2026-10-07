#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# This is a static Jekyll site, not a Node application or a database service.
# Replit's workflow reconciliation restarts the preview and runs its Jekyll build.
for path in _config.yml _layouts/default.html index.md about.md experience.md contact.md assets/css/style.css; do
  if [[ ! -f "$path" ]]; then
    printf 'Post-merge setup failed: required site file is missing: %s\n' "$path" >&2
    exit 1
  fi
done

printf 'Static Jekyll site verified. No application dependencies or migrations are required.\n'
printf 'The configured preview workflow will rebuild the site during workflow reconciliation.\n'

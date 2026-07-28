#!/usr/bin/env bash
set -euo pipefail

branch="${GITHUB_REF_NAME:-main}"
max_attempts=5

for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  if git pull --rebase origin "$branch"; then
    if git push origin "HEAD:$branch"; then
      exit 0
    fi
  else
    git rebase --abort || true
    echo "Cannot rebase generated commit onto origin/$branch; refusing to overwrite remote changes." >&2
    exit 1
  fi

  if (( attempt < max_attempts )); then
    sleep "$((attempt * 2))"
  fi
done

echo "Failed to publish generated commit after $max_attempts attempts." >&2
exit 1

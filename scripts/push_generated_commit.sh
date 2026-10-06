#!/usr/bin/env bash
set -euo pipefail

branch="${GITHUB_REF_NAME:-main}"
max_attempts=5

# pull --rebase 拒绝脏工作区时不列文件名，先把残留打进日志方便定位。
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: unstaged/untracked leftovers before push:" >&2
  git status --porcelain >&2
fi

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

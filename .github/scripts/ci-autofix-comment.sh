#!/usr/bin/env bash
# CI Auto Fix 的结果公示：把每次自动修复的结论评论到追踪 issue（无则创建）。
# 用法: ci-autofix-comment.sh <run_id> <workflow_name> <verdict|ESCALATE:...|BLOCKED:...>
set -euo pipefail

run_id="${1:?usage: ci-autofix-comment.sh <run_id> <workflow> <verdict>}"
workflow="${2:?}"
verdict="${3:?}"
title="CI 自动修复记录（ci-autofix）"

kind="${verdict%%:*}"
detail="${verdict#*:}"
[ "$detail" = "$verdict" ] && detail=""

case "$kind" in
  FIXED)    icon="✅"; label="已修复并触发重跑" ;;
  NOOP)     icon="🫧"; label="判定为 flaky/外部原因，未改码" ;;
  BLOCKED)  icon="⛔"; label="需要人工介入" ;;
  ESCALATE) icon="🔥"; label="自动修复轮之后二轮仍失败" ;;
  *)        icon="❓"; label="未知结论" ;;
esac

run_url="https://github.com/${GITHUB_REPOSITORY:-Nuctori/EverywhereWeGoGz}/actions/runs/${run_id}"
body=$(cat <<EOF
${icon} **${workflow}** run [${run_id}](${run_url})：${label}

${detail}

> ci-autofix agent 自动评论；一轮修复仅对 run_attempt < 2 出手。异议直接回复本 issue。
EOF
)

existing="$(gh issue list --state open --search "in:title \"$title\"" --json number --jq '.[0].number' 2>/dev/null || true)"
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "$body"
else
  gh issue create --title "$title" --body "$body

本 issue 由 ci-autofix 自动创建，用于汇总每次 CI 失败的自动修复结论。"
fi

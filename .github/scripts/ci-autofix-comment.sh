#!/usr/bin/env bash
# CI Auto Fix 的结果公示：把每次自动修复的结论评论到追踪 issue（无则创建）。
# 用法: ci-autofix-comment.sh <run_id> <workflow_name> <verdict|ESCALATE:...|BLOCKED:...>
# 防刷屏：同一工作流连续处于同一未解决状态（⛔/❓/🫧/🔥）时不再重发评论，
# 状态变化（如 ⛔→🫧→✅）或该工作流尚无记录时才发，避免周期性失败每周刷两条。
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
if [ -z "$existing" ]; then
  gh issue create --title "$title" --body "$body

本 issue 由 ci-autofix 自动创建，用于汇总每次 CI 失败的自动修复结论。"
  exit 0
fi

# 防刷屏：只有当该工作流最新一条记录来自 bot 且状态图标与本次相同时才跳过；
# 人工评论、无历史记录、状态变化（⛔→🫧→✅ 等）都放行。
last_author="$(gh issue view "$existing" --json comments --jq '.comments[-1].author.login // ""' 2>/dev/null || echo '')"
last_for_workflow="$(gh issue view "$existing" --json comments --jq "[.comments[] | select(.body | contains(\"**${workflow}** run\"))][-1].body // \"\"" 2>/dev/null || echo '')"

case "$last_author" in
  github-actions|github-actions\[bot\]|app/github-actions)
    case "$last_for_workflow" in
      "${icon}"*)
        echo "skip: ${workflow} 已处于 ${icon} 状态，不重复评论"
        exit 0
        ;;
    esac
    ;;
esac

gh issue comment "$existing" --body "$body"

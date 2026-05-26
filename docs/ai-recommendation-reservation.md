# AI 推荐功能预留

当前版本已预留“多轮 AI 对话推荐”的前端交互与接口边界，但不会调用真实模型服务。

## 已实现的预留点

- 对话入口：线路列表页左下角 `AI帮我选`。
- 对话容器：`src/sections/AiRecommendPanel.tsx`，使用抽屉承载多轮消息。
- 推荐接口边界：`src/lib/ai-recommendation.ts` 暴露 `requestAiRecommendations`。
- 推荐结果类型：`src/types/tour.ts` 中的 `AiRecommendationRequest`、`AiRecommendationResult`、`AiRecommendationItem`。
- 结果注入：`src/sections/TourList.tsx` 会将推荐线路在当前筛选结果内置顶，并把推荐理由传给卡片。
- 卡片展示：`src/sections/TourCard.tsx` 支持 `recommendationReason` 和 `recommendationRank`。

## 后续接真实 AI 的替换位置

优先替换 `src/lib/ai-recommendation.ts` 里的 `requestAiRecommendations`：

1. 将本地规则匹配替换为请求后端接口。
2. 后端接口保存或恢复 `conversationId` 对应的上下文。
3. 返回结构保持 `AiRecommendationResult`，只包含 `tourId`、`reason`、`matchedSignals`、`score`。

候选线路使用 `AiRecommendationCandidate` 轻量类型，不直接把完整 `Tour` 详情传给模型，避免 token 浪费和数据泄漏。

## 交互约定

推荐结果只在当前筛选结果内置顶。如果用户设置了筛选条件，AI 推荐不会强行展示不符合筛选的线路。

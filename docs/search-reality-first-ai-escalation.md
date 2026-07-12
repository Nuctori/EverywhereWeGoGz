# 搜索与 AI 推荐架构：现实优先、质量门控、AI 接管

> 目标：让搜索和推荐基于用户需求的客观现实，而不是不断堆叠写死的词法解析规则。  
> 核心原则：**现实先行，质量门控，AI 接管，审计兜底。**

---

## 0. 关键结论

这份文档定义的是目标架构和演进边界。最重要的结论是：

1. **本地 parser 只提取可审计硬约束，不负责软语义理解。**
2. **硬约束不等于自动 AI。硬约束先进入本地现实筛选和质量门控。**
3. **AI 不是词法触发，而是在本地结果质量不足时接管。**
4. **AI 可以理解软语义，但不能越过客观现实。**
5. **审计结果优先于 AI。审计失败时必须降级、重排或空态，不能让 AI 文案覆盖事实。**
6. **一次用户提交最多允许 1 次自动 AI 接管；失败后只允许本地降级，不允许自动重试链路。**

---

## 1. 背景

当前产品面对的是旅行团搜索与推荐场景。用户输入可能很简单：

- `沙扒湾`
- `香港`
- `云南`

也可能很复杂：

- `广州出发，国庆后，爸妈同行，5-7天，预算3000左右，不要太赶`
- `帮我找同时带温泉和沙滩，预算800内，最好2天游`
- `适合亲子，轻松一点，不想太商业化`

如果用传统 parser / keyword rule 去处理所有情况，会很快变成工程地狱：

```ts
if (query.includes('亲子')) ...
if (query.includes('适合')) ...
if (query.includes('轻松')) ...
if (query.includes('海边')) ...
if (query.includes('爸妈')) ...
```

这类规则的问题是：

1. 语义不收敛，同一个词在不同上下文里意思不同。
2. 反例无限，每加一个规则都会引出更多例外。
3. 软语义依赖世界知识和体验判断，不适合本地词法规则。
4. 规则分散后，普通搜索、AI 推荐、筛选器之间会产生行为不一致。

因此，正确方向不是继续扩 parser，而是把系统拆成：

```text
本地硬约束解析
  ↓
现实筛选 / 本地排序
  ↓
结果质量门控
  ↓
质量不足时 AI 接管语义解析和候选重排
  ↓
本地现实审计
  ↓
展示结果 / 本地降级 / 空态
```

---

## 2. 总体原则

### 2.1 现实优先

本地筛选必须基于可验证的客观现实：

- 目的地是否匹配
- 预算是否满足
- 天数是否满足
- 班期是否满足
- 出发/返程窗口是否满足
- 明确避开项是否冲突
- 候选线路是否真实存在
- 价格、天数、标签、行程事实是否来自候选数据

本地层不应该凭软语义推断用户真实意图。

---

### 2.2 硬约束可规则化，软语义不可词法规则化

#### 允许本地规则化的硬约束

这些信息接近客观事实，可被稳定解析和审计：

| 类型 | 示例 | 是否可规则化 | 说明 |
|---|---|---:|---|
| destination | 沙扒湾、香港、云南 | 是 | 依赖统一目的地 alias |
| budget | 预算3000内、600以内 | 是 | 可转成数值范围 |
| duration | 5-7天、2天游 | 是 | 可转成天数范围 |
| departure window | 国庆后、3天内、周末 | 是 | 可转成日期/窗口 |
| weekday | 周五出发、周日回 | 是 | 可转成星期约束 |
| hard avoid | 不要购物、不爬山、不要早起、不要坐船 | 有限可规则化 | 必须能映射到候选事实或风险项 |
| weather sensitivity | 怕热、避暑、台风、下雨 | 有限可规则化 | 作为风险提示/审计信号，不直接决定体验 |

#### avoid 的边界

`avoid` 最容易从硬约束滑向软语义，因此必须拆开：

| 类型 | 示例 | 处理方式 |
|---|---|---|
| 可硬校验 avoid | 不要购物、不爬山、不要早起、不要坐船、不要红眼航班 | 可进入硬约束和冲突审计 |
| 软提示 avoid | 不要太商业化、不要太赶、不要累、不想被坑、不想太普通 | 不做硬过滤，只作为 AI 软语义理解和文案提醒 |

原则：**如果无法稳定映射到候选事实，就不能作为硬过滤条件。**

#### 不允许本地词法规则化的软语义

这些语义不收敛，应交给 AI 理解：

| 类型 | 示例 | 为什么不能词法规则化 |
|---|---|---|
| 人群体验 | 适合爸妈、亲子友好 | 要结合天数、交通、强度、目的地体验 |
| 节奏偏好 | 不要太赶、轻松一点 | 需要理解行程安排，不是单词命中 |
| 氛围偏好 | 有氛围、高级感、小众 | 依赖世界知识和候选事实 |
| 价值判断 | 性价比高、别太坑 | 需要价格上下文和同类比较 |
| 世界知识 | 贫穷地方、避暑胜地、适合老人 | 需要模型知识，不应写死映射 |
| 上下文指代 | 像刚才那种、继续上一个 | 需要多轮语义判断 |

---

### 2.3 AI 是质量接管，不是词法触发

不推荐：

```ts
if (query.includes('亲子')) triggerAi();
if (query.includes('海边')) triggerAi();
if (query.includes('适合')) triggerAi();
```

推荐：

```ts
const hardConstraints = parseHardConstraints(query);
const localResult = runRealityBasedSearch(query, hardConstraints);
const quality = evaluateLocalSearchQuality({ query, hardConstraints, localResult });

if (userClickedAi || shouldEscalateToAi(quality)) {
  return auditAiResult(
    await runAiRecommendation({ query, hardConstraints, localResult, quality }),
    hardConstraints,
  );
}

return localResult;
```

AI 介入的原因应该是质量问题或用户显式授权，不是某个软语义词出现。

---

### 2.4 AI 不能越过现实

AI 可以理解软语义，但不能违反客观现实。

AI 输出必须经过本地审计：

- tourId 是否真实存在
- 是否严重超预算
- 是否目的地明显不符
- 是否天数明显不符
- 是否违反明确 hard avoid
- 文案是否声称了候选事实不存在的内容
- 是否把 fallback/非跟团产品当作高置信推荐

如果 AI 输出不合格，应：

1. 本地重排
2. 降级为本地推荐
3. 展示空态和可放宽条件
4. 用保守文案说明“先按可验证条件排序”
5. 不自动无限重试

硬规则：**审计结果优先于 AI。AI 与审计冲突时，必须以审计为准。**

---

## 3. 推荐架构

### 3.1 流程图

```text
用户输入
  ↓
normalize query
  ↓
parse hard constraints
  ↓
run local reality-based search
  ↓
evaluate local search quality
  ├─ acceptable → 展示普通搜索结果
  ↓
AI escalation
  ↓
AI parses soft semantics + reranks candidates
  ↓
audit AI result against hard constraints and candidate facts
  ├─ pass → 展示 AI 推荐
  ├─ demote/rewrite → 展示审计修正后的推荐
  └─ block → 回退本地结果 / 空态
```

---

### 3.2 模块划分建议

长期建议拆成这些模块：

```text
src/lib/search-routing.ts
  - 薄门面：当前搜索动作入口

src/lib/search-hard-constraints.ts
  - 只提取可审计硬约束
  - budget / duration / destination / dates / hard avoid

src/lib/search-quality-gate.ts
  - 评估本地结果质量
  - 判断是否需要 AI 接管

src/lib/ai-recommendation.ts
  - AI 推荐主链路
  - 后续应逐步拆分

src/lib/recommendation-audit.ts
  - 审计 AI 输出是否违反现实约束

src/lib/destination-resolver.ts
  - 唯一目的地 alias / hint source of truth
```

当前阶段可以先保持现有实现，但所有新增能力应按这个方向收敛。

---

## 4. 主搜索路由策略

### 4.1 目标态：主搜索先本地，AI 由质量门控升级

长期目标不是“输入有硬约束就直接 AI”，而是：

```text
主搜索 → 本地现实搜索 → 质量门控 → 必要时 AI 接管
```

硬约束的作用是：

1. 进入本地现实筛选。
2. 进入质量门控评估。
3. 进入 AI prompt 和审计边界。

硬约束本身**不等于**必须自动 AI。

---

### 4.2 当前过渡态

当前实现仍可能在主搜索输入出现明确硬约束时自动打开 AI。这是过渡态，不是最终目标。

| 输入 | 当前过渡行为 | 目标态行为 |
|---|---|---|
| 沙扒湾 | plain | plain |
| 帮我找沙扒湾 | plain | plain |
| 香港 | plain | plain |
| 三亚亲子 | plain | plain，本地质量低才升级 |
| 想去海边 | plain | plain，本地质量低才升级 |
| 预算3000内 | ai | 先本地筛选，再按质量门控决定是否 AI |
| 5-7天，预算3000 | ai | 先本地筛选，再按质量门控决定是否 AI |
| 国庆后，爸妈同行，预算3000，5-7天 | ai | 本地筛选后大概率质量门控升级 AI |
| 点击 AI 找团 | ai | ai，用户显式授权 |

团队后续实现 `search-quality-gate.ts` 后，应把主搜索从“硬约束直接 AI”迁移到“质量门控 AI”。

---

### 4.3 元语化路由结果

路由不应只返回布尔值，而应返回解释：

```ts
interface SearchRouteMeta {
  action: 'plain' | 'ai';
  reason: 'empty' | 'plain' | 'destination_only' | 'hard_constraints' | 'quality_escalation';
  hardConstraintCount: number;
  destinationHintCount: number;
  qualityIssues?: LocalSearchQualityIssue[];
}
```

这个结构让系统可解释、可测试、可审计。

---

## 5. 质量门控设计

### 5.1 为什么需要质量门控

仅靠输入判断是否 AI，仍然容易误判。

更好的触发方式是：

> 先跑低成本本地搜索，再判断结果质量。如果本地结果不够好，再让 AI 接管。

---

### 5.2 LocalSearchQuality 类型建议

```ts
interface LocalSearchQuality {
  acceptable: boolean;
  score: number;
  issues: LocalSearchQualityIssue[];
}

type LocalSearchQualityIssue =
  | 'no_results'
  | 'too_few_results'
  | 'weak_destination_match'
  | 'budget_conflict'
  | 'duration_conflict'
  | 'date_conflict'
  | 'low_fact_coverage'
  | 'soft_semantic_unresolved'
  | 'fallback_only_results';
```

---

### 5.3 升级规则表

先立一条总规则：

1. **用户显式点击 AI 找团时，始终允许 AI 接管，不受质量门控限制。**
2. **除显式 AI 外，其余入口必须先走本地搜索和质量门控。**
3. **AI 升级必须基于 issue，不基于词。**

| Issue | 单独是否可升级 | 条件 | 说明 |
|---|---:|---|---|
| `no_results` | 是 | 存在硬约束 | AI 可判断可放宽替代；纯空泛输入不自动升级 |
| `too_few_results` | 是 | 结果数低于阈值且存在硬约束 | 阈值建议初版用 `< 3`，后续用数据调优 |
| `budget_conflict` | 否 | 与 `no_results` / `too_few_results` / `low_fact_coverage` 叠加才升级 | 单独预算冲突先本地过滤/降级 |
| `duration_conflict` | 否 | 与 `no_results` / `too_few_results` 叠加才升级 | 单独冲突先本地提示 |
| `date_conflict` | 否 | 与 `no_results` / `too_few_results` 叠加才升级 | 可提示换日期，不一定 AI |
| `weak_destination_match` | 是 | 用户有明确目的地但前排弱匹配 | AI 可判断邻近替代，但审计必须标注 |
| `low_fact_coverage` | 是 | 前排结果无法覆盖硬约束证据 | AI 可重排候选 |
| `soft_semantic_unresolved` | 否 | 必须与 `low_fact_coverage` / `too_few_results` 叠加 | 防止软语义词表触发 |
| `fallback_only_results` | 否 | 只提示/降级，不自动 AI | 防止 fallback 触发成本回潮 |

---

### 5.4 质量门控应评估“结果现象”，不是词表

不推荐：

```ts
if (query.includes('爸妈')) return { issues: ['soft_semantic_unresolved'] };
```

推荐：

```ts
if (softPreferenceExists && topResultsDoNotHaveEvidence) {
  issues.push('soft_semantic_unresolved');
}
```

`soft_semantic_unresolved` 的触发条件必须是：

1. 用户表达了软偏好；并且
2. 本地候选池或前排结果缺少可验证事实来支撑该偏好；并且
3. 这个缺证会影响推荐质量。

最低可执行标准建议是：当以下证据源都无法支撑该软偏好时，才允许标记 unresolved：

- 候选的结构化体验标签 / categories / tags
- 行程长度、节奏、出发/返程时段等客观字段
- 目的地及其统一 alias / routeGroup / theme
- 已知天气、季节、温度或风险上下文
- 任何可验证的候选事实摘要（atoms / facts / highlights）

它不能只因为 query 中出现“爸妈 / 亲子 / 海边 / 适合”等词就触发。

---

## 6. AI 接管策略

### 6.1 何时允许 AI 接管

AI 接管发生在：

1. 用户显式点击 AI 找团
2. 质量门控给出可升级 issue
3. 多个硬约束之间需要取舍/放宽，并且本地结果质量不足

---

### 6.2 AI 接管时要做什么

AI 负责：

- 重新理解用户需求
- 判断哪些是硬约束，哪些是软偏好
- 结合候选池事实重排
- 给推荐理由
- 解释近似替代和取舍

AI 不负责：

- 编造不存在的线路
- 忽略预算/天数/目的地等明确现实约束
- 用文案掩盖候选事实缺失

---

### 6.3 成本护栏

默认策略：

```text
一次用户提交 → 最多一次自动 AI 接管 → 本地审计 → 展示结果
```

明确禁止：

```text
AI 排序 → AI 自评 → AI 重写 → AI 再润色 → AI 再校验
```

可执行护栏：

1. 每次用户提交最多 1 次自动 AI 接管。
2. 这次自动 AI 接管的状态位应由单次请求上下文中的 `requestId` / `conversation step id` / `requestVersion` 之一显式计数，避免异常路径重复进入。
3. 以下失败统一视为“本次 AI 失败”，不得自动重试链路：超时、网络错误、provider 错误、结构解析失败、AI 审计失败。
4. AI 失败后，只允许本地降级或空态，不允许自动二次调用其他 AI 兜底链路，除非产品明确提供“手动再试”。
5. AI 输出结构不合法时，先尝试本地解析已返回内容；不能解析则降级。
6. 用户主动再次提交才算下一轮。
7. 免费/弱模型和 lite prompt 不应承担多轮修复职责。

---

## 7. 多轮上下文策略

当前实现中：

- 正常 AI prompt：最多带最近 `4` 条 message
- lite prompt：最多带最近 `2` 条 message
- localStorage：最多持久化 `40` 条 message

注意：

> 持久化 40 条不等于每次发给模型 40 条。

推荐继续保持：

| 模式 | 上下文条数 | 理由 |
|---|---:|---|
| normal AI | 4 messages | 能理解最近补充，成本可控 |
| lite AI | 2 messages | 弱模型上下文越短越稳 |
| local persistence | 40 messages | 用于 UI 恢复，不直接增加模型成本 |

---

## 8. AI 结果审计

### 8.1 审计目标

AI 输出不是最终事实。最终展示前必须审计。

审计目标：

- 防止幻觉
- 防止违反硬约束
- 防止软语义文案说得过满
- 防止高价/错目的地/错天数结果被顶到前排

---

### 8.2 审计项

```ts
interface RecommendationAuditIssue {
  type:
    | 'unknown_tour_id'
    | 'budget_overrun'
    | 'destination_mismatch'
    | 'duration_mismatch'
    | 'date_mismatch'
    | 'avoid_conflict'
    | 'unsupported_claim'
    | 'non_tour_product';
  severity: 'block' | 'demote' | 'warn';
  message: string;
}
```

---

### 8.3 审计裁决权

硬规则：**审计结果优先于 AI。**

当 AI 与审计冲突时：

| 审计结果 | 展示行为 |
|---|---|
| block | 不展示该 AI item；如果全部 block，回退本地结果或空态 |
| demote | 允许展示，但不能在前排；文案必须说明取舍 |
| warn | 可展示，但文案必须保守，不能说满 |

AI 文案不能覆盖审计结果。被 `block` 的项绝不能作为“预算放宽替代”重新放回列表；若要作为替代，必须在排序阶段保留为 `demote + explicit_alternative_label`，而不是 block。

---

### 8.4 排序阶段 vs 展示阶段

| 问题 | 候选排序阶段 | AI 展示阶段 |
|---|---|---|
| 严重超预算 | 直接过滤或强降权，不得排前 | 默认 block；如果产品明确允许‘放宽预算替代’，则必须在进入展示阶段前改判为 `demote + explicit_alternative_label`，不能同时既 block 又展示 |
| 轻微超预算 | 降权，可作为替代 | demote + 文案说明 |
| 目的地完全不符 | 过滤或强降权 | block |
| 邻近目的地替代 | 可保留但低于精确匹配 | demote/warn + 明确标注替代 |
| 违反 hard avoid | 过滤 | block |
| 软语义证据不足 | 不做硬过滤 | warn + 保守文案 |
| 文案声称不存在事实 | 不适用 | rewrite / remove claim |

---

## 9. 测试不变量

测试必须拆成两类：**长期不变量** 和 **当前实现约束**。  
长期不变量不应锁死未来演进；当前实现约束可随质量门控上线后调整。

### 9.1 长期不变量

1. 简单地名不能仅因请求词被劫持到 AI。
2. 软语义词不能单独触发 AI。
3. AI 输出 tourId 必须来自候选池。
4. 明确 hard avoid 冲突候选不能作为高置信推荐。
5. 严重超预算线路不能排前；如作为替代必须明确标注。
6. 审计失败优先于 AI 文案。
7. 一次用户提交最多一次自动 AI 接管。

### 9.2 当前实现约束

当前实现仍处于过渡态，应维护以下测试，直到质量门控替换主搜索自动 AI 逻辑。

硬规则：**任何新增测试不得把当前过渡态行为当成长期契约。** 所有过渡态测试都必须带注释说明“未来质量门控上线后可调整”。

| 输入 | 当前期望 |
|---|---|
| 三亚 | plain / destination_only |
| 沙扒湾 | plain / destination_only |
| 帮我找沙扒湾 | plain / destination_only |
| 香港 | plain / destination_only |
| 三亚亲子 | plain / destination_only |
| 想去海边 | plain |
| 预算3000内 | ai / hard_constraints |
| 预算 + 天数 + 日期 | ai / hard_constraints |

质量门控上线后，`预算3000内` 这类输入应迁移为：

```text
plain local search first → quality gate → maybe AI
```

### 9.3 E2E 当前约束

1. 简单地名不打开 AI 面板。
2. 请求词 + 地名不打开 AI 面板。
3. 预算硬约束在当前过渡态会打开 AI 面板。
4. 复杂多约束查询在当前过渡态会打开 AI 面板。
5. 显式 AI 找团按钮始终打开 AI 面板。
6. 普通搜索清掉已有 AI 面板是当前 UI 策略；未来若改成“保留但折叠 AI 结果”，必须更新测试和交互说明。

---

## 10. 反模式

### 10.1 禁止：软语义词表驱动路由

```ts
if (query.includes('亲子')) return 'ai';
if (query.includes('海边')) return 'ai';
if (query.includes('适合')) return 'ai';
```

这会导致非收敛点规则化。

---

### 10.2 禁止：AI 越权覆盖现实

```text
用户预算 600，AI 推荐 37999 的线路并说“符合预算”
```

必须由本地审计拦住。

---

### 10.3 禁止：为了提升文案质量自动多轮调用 AI

```text
AI 排序 → AI 润色 → AI 自评 → AI 重写
```

除非未来有明确质量数据证明收益大于成本，否则默认禁止。

---

### 10.4 禁止：把 quality gate 伪装成词法规则

```ts
if (query.includes('爸妈')) issues.push('soft_semantic_unresolved');
```

必须改成结果现象判断：

```ts
if (hasSoftPreference && !topResultsHaveSupportingFacts) {
  issues.push('soft_semantic_unresolved');
}
```

---

## 11. 演进路线

### Phase 1：当前已完成方向

- 主搜索不再由软语义词表触发 AI
- 路由返回元语 reason
- 预算 fallback 明显超预算不排前
- E2E 覆盖 plain / ai 边界

---

### Phase 2：新增质量门控

建议新增：

```text
src/lib/search-quality-gate.ts
```

最小 API：

```ts
export function evaluateLocalSearchQuality(params: {
  query: string;
  hardConstraints: HardConstraints;
  results: RankedTour[];
}): LocalSearchQuality;

export function shouldEscalateToAi(quality: LocalSearchQuality): boolean;
```

初版只做：

- no_results
- too_few_results
- budget_conflict
- duration_conflict
- low_fact_coverage

不要一开始做复杂软语义词表。

---

### Phase 3：主搜索迁移到质量门控

目标：

```text
搜索按钮 → 本地搜索 → 质量门控 → 必要时 AI
```

迁移后应更新：

- `search-routing.ts`
- `scripts/test_destination_aliases.ts`
- `scripts/test_search_modes_ui.mjs`
- 本文档第 9.2 / 9.3 当前实现约束

---

### Phase 4：拆分 ai-recommendation God file

`src/lib/ai-recommendation.ts` 后续应逐步拆分：

```text
ai-intent.ts
ai-prompt-builder.ts
ai-result-normalizer.ts
recommendation-ranking.ts
recommendation-audit.ts
weather-context.ts
```

但不建议一次大拆。

---

## 12. 最终准则

### 一句话

> **现实先行，质量门控，AI 接管，审计兜底。**

### 更工程化的表述

1. 本地 parser 只提取可审计硬约束。
2. 本地搜索先给低成本现实答案。
3. 本地结果质量不足时，AI 接管软语义理解和候选重排。
4. AI 输出必须接受现实审计。
5. 不把非收敛软语义写成词法规则。
6. 用户主动追问才算下一轮 AI，不自动无限多轮。
7. 审计结果是最终事实裁决，优先级高于 AI 文案。

这套原则比全 parser、全 AI、词表触发 AI 都更稳，因为它同时优化：

- 推荐效果
- AI 成本
- 响应速度
- 可维护性
- 可解释性
- 事实可靠性

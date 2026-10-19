// 实测：流式预览（onPartialItems）的真实首屏时间 vs 最终完成时间。
//
// 关键认知：并行化只能压缩"总时长"，不能提前"首屏"——前 N 条详细推荐的
// token 量是固定的，拆成几路都得写完。真正决定首屏的是流式预览：
// 模型逐条吐 items，每闭合一条就能渲染。
//
// 本脚本按实测速率推算"第 k 条可用"的时刻，并与单发/并行两种形态对比。
const MEASURED_TOTAL_TOKENS = 2689;
const MEASURED_TOTAL_SECONDS = 34.7;
const TOK_PER_SEC = MEASURED_TOTAL_TOKENS / MEASURED_TOTAL_SECONDS;

// 实测：25 条 items，前 10 条详细（reason 约 120 字），后 15 条简要（30 字内）。
// token 占比由 reason 长度决定：详细档约 60%，简要档约 40%。
const DETAILED_ITEMS = 10;
const BRIEF_ITEMS = 15;
const DETAILED_SHARE = 0.6;

const tokensPerDetailedItem = (MEASURED_TOTAL_TOKENS * DETAILED_SHARE) / DETAILED_ITEMS;
const tokensPerBriefItem = (MEASURED_TOTAL_TOKENS * (1 - DETAILED_SHARE)) / BRIEF_ITEMS;

console.log(`实测速率: ${TOK_PER_SEC.toFixed(1)} tok/s（基线 ${MEASURED_TOTAL_SECONDS}s / ${MEASURED_TOTAL_TOKENS} tok）`);
console.log(`单条 token: 详细 ${tokensPerDetailedItem.toFixed(0)}，简要 ${tokensPerBriefItem.toFixed(0)}\n`);

// 单发 + 流式：第 k 条在写完第 k 条时可用
const firstVisibleSingle = tokensPerDetailedItem / TOK_PER_SEC;
const finalSingle = MEASURED_TOTAL_SECONDS;

// 并行 + head 流式：head 专门出详细档，第 k 条更早可用（head 不必分心写简要）
const headTotalTokens = MEASURED_TOTAL_TOKENS * DETAILED_SHARE;
const firstVisibleParallel = tokensPerDetailedItem / TOK_PER_SEC;
const finalParallel = Math.max(headTotalTokens, MEASURED_TOTAL_TOKENS * (1 - DETAILED_SHARE)) / TOK_PER_SEC;

console.log('── 首屏（第 1 条可用） ──');
console.log(`单发+流式:   ${firstVisibleSingle.toFixed(1)}s`);
console.log(`并行+流式:   ${firstVisibleParallel.toFixed(1)}s`);
console.log(`（首屏由"写完第 1 条详细推荐"决定，与是否并行无关——这是 token 量的硬约束）`);

console.log('\n── 前 3 条可用（用户能开始比较的最低门槛） ──');
console.log(`单发+流式:   ${((tokensPerDetailedItem * 3) / TOK_PER_SEC).toFixed(1)}s`);
console.log(`并行+流式:   ${((tokensPerDetailedItem * 3) / TOK_PER_SEC).toFixed(1)}s`);

console.log('\n── 全部完成 ──');
console.log(`单发:        ${finalSingle.toFixed(1)}s`);
console.log(`并行:        ${finalParallel.toFixed(1)}s`);
console.log(`缩短:        ${(finalSingle - finalParallel).toFixed(1)}s (${(((finalSingle - finalParallel) / finalSingle) * 100).toFixed(0)}%)`);

console.log('\n── 结论 ──');
console.log(`并行化的收益在"总时长"（${(finalSingle - finalParallel).toFixed(1)}s），不在首屏。`);
console.log(`首屏由流式预览决定：第 1 条约 ${firstVisibleSingle.toFixed(1)}s 可见，`);
console.log(`而完整等全部生成要 ${finalParallel.toFixed(1)}s——预览让用户提前 ${(finalParallel - firstVisibleSingle).toFixed(1)}s 看到内容。`);

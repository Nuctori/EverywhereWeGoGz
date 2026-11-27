// 创想巴士采集/建库回归测试：这几条都是真实踩过的坑，不是形式化断言。
//
//   1) 采集脚本 401 之后必须「先刷新令牌再重发」，不能拿着同一个过期 bearer 连打 4 次；
//      令牌真失效时必须中止本轮，而不是把 420 个城市对按退避磨完、留下半份数据。
//   2) 建库脚本返回 0 条创想线路时也必须覆盖写 bus-lines-cx.json，
//      否则上一轮的旧文件还躺在 public/data 里被前端当新数据取走（新主线 + 过期支线）。
//   3) 契约测试的「原始线路数」必须跟建库同口径：
//      缺坐标的线路本来就会被 toStop 丢掉，不能算成构建失败。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawPath = path.join(root, 'src/data/raw_cx_lines.json');
const outPath = path.join(root, 'public/data/bus-lines-cx.json');
const backupPath = path.join(root, 'tmp/cx-raw-test-backup.json');

const failures = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`[cx-test] ok   ${name}`);
  } catch (error) {
    failures.push({ name, message: error.message });
    console.log(`[cx-test] FAIL ${name}: ${error.message}`);
  }
};

// ---------- 1. 401 重试必须刷新令牌，硬 401 必须中止本轮 ----------
const puller = await import('./pull_cx_lines.mjs').catch((error) => ({ __importError: error }));

await check('pull_cx_lines 暴露可注入的 listPage（401 能刷新后重发）', () => {
  assert.ok(!puller.__importError, `导入失败：${puller.__importError?.message}`);
  assert.equal(typeof puller.makeListPage, 'function', '缺少 makeListPage 注入点，401 只能拿同一个过期令牌重试');
});

if (typeof puller.makeListPage === 'function') {
  await check('401 一次后刷新令牌并重发成功', async () => {
    let calls = 0;
    let refreshed = 0;
    const listPage = puller.makeListPage({
      pageSize: 50,
      fetchImpl: async (_url, init) => {
        calls += 1;
        const bearer = String(init.headers.Authorization ?? '');
        // 第一次用旧令牌 → 401；刷新后应当带新令牌并成功
        if (bearer.includes('old-token')) {
          return { ok: false, status: 401, text: async () => 'expired' };
        }
        return { ok: true, status: 200, json: async () => ({ items: [{ lineId: 'L1' }], totalCount: 1 }) };
      },
      onUnauthorized: async () => {
        refreshed += 1;
        return { access_token: 'new-token' };
      },
    });
    const payload = await listPage({ access_token: 'old-token' }, [4401, 4403], '2026-11-27', 0);
    assert.equal(payload.items.length, 1, '刷新后应当拿到数据');
    assert.ok(refreshed >= 1, '401 时没有调用刷新回调，只拿旧令牌重试');
    assert.ok(calls >= 2, '应当重发请求');
  });

  await check('令牌持续 401 时不重试到底，而是抛出可识别错误', async () => {
    const listPage = puller.makeListPage({
      pageSize: 50,
      fetchImpl: async () => ({ ok: false, status: 401, text: async () => 'auth failed' }),
      onUnauthorized: async () => ({ access_token: 'still-bad' }),
      retries: 2,
    });
    await assert.rejects(
      () => listPage({ access_token: 'bad' }, [4401, 4403], '2026-11-27', 0),
      (error) => String(error.message).includes('401'),
      '持续 401 应当抛出含 401 的错误',
    );
  });

  await check('401 被识别为「中止本轮」而不是逐个城市对磨完', () => {
    assert.equal(typeof puller.isFatalAuthError, 'function', '缺少 isFatalAuthError，主循环无法区分 401 和其它失败');
    assert.equal(puller.isFatalAuthError(new Error('HTTP 401 {"error":"x"}')), true);
    assert.equal(puller.isFatalAuthError(new Error('HTTP 429 ')), false);
  });
}

// ---------- 2 & 3. 建库产物与计数口径 ----------
const runBuild = () => execFileSync(process.execPath, [path.join(root, 'scripts/build_bus_lines.mjs')], {
  cwd: root,
  stdio: 'pipe',
});

const withRaw = (routes, fn) => {
  const original = existsSync(rawPath) ? readFileSync(rawPath, 'utf8') : null;
  try {
    writeFileSync(rawPath, JSON.stringify({ pulledAt: '2026-11-27', routes }, null, 1));
    fn();
  } finally {
    if (original !== null) writeFileSync(rawPath, original);
  }
};

const cxLine = (id, { withCoords = true } = {}) => ({
  lineId: id,
  lineName: `测试-${id}`,
  departTimes: ['08:00:00'],
  priceYuan: 20,
  board: [{ name: '广州上车点', lat: withCoords ? 23.12 : Number.NaN, lng: withCoords ? 113.26 : Number.NaN, cityName: '广州市' }],
  alight: [{ name: '深圳下车点', lat: withCoords ? 22.55 : Number.NaN, lng: withCoords ? 114.05 : Number.NaN, cityName: '深圳市' }],
});

await check('原始数据全是缺坐标线路时，也要覆盖写空的 bus-lines-cx.json', () => {
  writeFileSync(backupPath, JSON.stringify({ marker: 'stale' }));
  writeFileSync(outPath, JSON.stringify({ generatedAt: '1999-01-01', source: { providers: ['旧数据'] }, routes: [{ id: 'cx-OLD' }] }));
  try {
    withRaw([cxLine('L-NO-COORD', { withCoords: false })], () => runBuild());
    const payload = JSON.parse(readFileSync(outPath, 'utf8'));
    assert.ok(Array.isArray(payload.routes), '产物结构不对');
    assert.equal(payload.routes.length, 0, '应当写出 0 条，而不是留着上一轮的旧文件');
  } finally {
    rmSync(backupPath, { force: true });
  }
});

await check('契约计数与建库同口径（缺坐标线路不算构建失败）', () => {
  withRaw([cxLine('L1'), cxLine('L2', { withCoords: false })], () => {
    runBuild();
    // 建库会把缺坐标那条丢掉，契约测试必须按同样口径算，不能报「线路数对不上」
    execFileSync(process.execPath, [path.join(root, 'scripts/test_bus_lines_contract.mjs')], {
      cwd: root,
      stdio: 'pipe',
    });
  });
});

// ---------- 4. 连线必须是「沿行进方向排好序的走廊」，不是站点名单的连线 ----------
await check('多上车点/多下车点的线路按行进方向排序，不许来回折返', () => {
  // 真实形态：深圳、东莞一堆上车点 → 茂名、化州一堆下车点。接口给的是无序名单，
  // 直接按数组顺序连线就是截图里那张蜘蛛网（同一班车被画成横穿两座城市）。
  const line = {
    lineId: 'L-SPIDER',
    lineName: '深圳、东莞-茂名、化州',
    departTimes: ['09:00:00'],
    priceYuan: 80,
    board: [
      { name: '东莞上车点', lat: 23.02, lng: 113.75, cityName: '东莞市' },
      { name: '深圳西上车点', lat: 22.53, lng: 113.93, cityName: '深圳市' },
      { name: '深圳东上车点', lat: 22.60, lng: 114.13, cityName: '深圳市' },
    ],
    alight: [
      { name: '化州下车点', lat: 21.66, lng: 110.64, cityName: '茂名市' },
      { name: '茂名下车点', lat: 21.66, lng: 110.92, cityName: '茂名市' },
    ],
  };
  withRaw([line], () => {
    runBuild();
    const payload = JSON.parse(readFileSync(outPath, 'utf8'));
    const route = payload.routes.find((item) => item.id === 'cx-L-SPIDER');
    assert.ok(route, '没建出这条线路');
    const stops = route.stops;
    assert.equal(stops[0].role, 'board', '第一个点必须在上车组里');
    // 同一组内必须单调推进：这条走廊东西向（经度跨度远大于纬度），按经度自东向西检查。
    const forward = stops.map((stop) => -stop.lng);
    const inversions = forward.filter((value, index) => index > 0 && value < forward[index - 1] - 0.02);
    assert.equal(inversions.length, 0, `连线上出现 ${inversions.length} 处折返（应按行进方向排序）`);
    // 出发地/目的地按出现最多的城市判定，而不是数组里第一个站点
    assert.equal(route.originCity, '深圳市', `出发城市判定错误：${route.originCity}`);
    assert.equal(route.destinationCity, '茂名市', `目的地城市判定错误：${route.destinationCity}`);
  });
});

if (failures.length > 0) {
  console.error(`\n[cx-test] ${failures.length} 条失败`);
  for (const failure of failures) console.error(`  - ${failure.name}: ${failure.message}`);
  process.exitCode = 1;
} else {
  console.log('\n[cx-test] all assertions passed');
}

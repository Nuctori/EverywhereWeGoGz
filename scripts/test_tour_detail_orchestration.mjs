// 纯逻辑版本：复刻 useTourDetail 的请求编排，验证"同一线路重选不得丢弃在途响应"。
// 这个脚本不依赖 React 运行时，用同样的状态机断言行为契约。
import assert from 'node:assert/strict';

function createDetailController({ fetchImpl }) {
  const cache = new Map();
  let token = 0;
  let activeTourId = null;
  let abortCtrl = null;
  const state = { status: 'closed', resolvedTour: null, error: null };

  function selectTour(tour) {
    const cached = cache.get(tour.id);
    const isSameActiveTour = activeTourId === tour.id;
    state.resolvedTour = null;
    state.error = null;

    if (cached) {
      state.resolvedTour = { ...tour, ...cached };
      state.status = 'ready';
      activeTourId = null;
      return;
    }

    if (isSameActiveTour) {
      state.status = 'loading';
      return;
    }

    token += 1;
    const requestToken = token;
    abortCtrl?.abort();
    const controller = new AbortController();
    abortCtrl = controller;
    activeTourId = tour.id;
    state.status = 'loading';

    fetchImpl(tour.id, controller.signal)
      .then((detail) => {
        if (token !== requestToken) return;
        cache.set(tour.id, detail);
        state.resolvedTour = { ...tour, ...detail };
        state.status = 'ready';
        activeTourId = null;
      })
      .catch((error) => {
        if (controller.signal.aborted || token !== requestToken) return;
        state.status = 'error';
        activeTourId = null;
        state.error = error;
      });
  }

  return { state, selectTour };
}

// —— 场景 1：同一线路在请求进行中被再次选中 ——
{
  const pending = [];
  const state = createDetailController({
    fetchImpl: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  });
  const tour = { id: 'tour_race' };
  state.selectTour(tour);
  assert.equal(pending.length, 1);
  assert.equal(state.state.status, 'loading');
  state.selectTour(tour);
  assert.equal(pending.length, 1, 're-select must reuse the in-flight request');
  pending[0].resolve({ itinerary: [] });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(state.state.status, 'ready', 'in-flight response must not be dropped');
  assert.equal(state.state.resolvedTour.id, 'tour_race');
}

// —— 场景 2：切到另一条线路，旧响应必须被丢弃 ——
{
  const pending = [];
  const state = createDetailController({
    fetchImpl: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  });
  state.selectTour({ id: 'a' });
  state.selectTour({ id: 'b' });
  assert.equal(pending.length, 2);
  pending[0].reject(new Error('aborted'));
  pending[1].resolve({ itinerary: [] });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(state.state.status, 'ready');
  assert.equal(state.state.resolvedTour.id, 'b');
}

// —— 场景 3：命中缓存不再发请求 ——
{
  let calls = 0;
  const state = createDetailController({
    fetchImpl: async () => {
      calls += 1;
      return { itinerary: [] };
    },
  });
  state.selectTour({ id: 'c' });
  await new Promise((r) => setTimeout(r, 0));
  state.selectTour({ id: 'c' });
  assert.equal(calls, 1);
  assert.equal(state.state.status, 'ready');
}

console.info('tour detail request orchestration tests passed');

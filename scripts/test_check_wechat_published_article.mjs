import assert from 'node:assert/strict';
import { buildCheckResult, getLatestPublishedArticle } from './check_wechat_published_article.mjs';

const payload = {
  item: [{
    article_id: 'article-2',
    content: {
      update_time: 1760000000,
      news_item: [{ title: 'Latest article', url: 'https://mp.weixin.qq.com/s/article-2' }],
    },
  }],
};

assert.deepEqual(getLatestPublishedArticle(payload), {
  articleId: 'article-2',
  title: 'Latest article',
  url: 'https://mp.weixin.qq.com/s/article-2',
  updateTime: 1760000000,
});

assert.equal(buildCheckResult(payload, 'article-1').hasNewArticle, true);
assert.equal(buildCheckResult(payload, 'article-2').hasNewArticle, false);
assert.equal(buildCheckResult(payload, '').hasNewArticle, false);
assert.equal(buildCheckResult(payload, '').shouldUpdateBaseline, true);
assert.equal(buildCheckResult({ item: [] }, 'article-1').latestArticle, null);
assert.throws(() => getLatestPublishedArticle({ errcode: 40001, errmsg: 'invalid credential' }), /invalid credential/);

console.log('check_wechat_published_article tests passed');

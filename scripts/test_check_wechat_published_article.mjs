import assert from 'node:assert/strict';
import {
  buildCheckResult,
  buildPublishedArticlesRequest,
  getLatestPublishedArticle,
  parsePreviousArticleIds,
} from './check_wechat_published_article.mjs';

const payload = {
  item: [
    {
      article_id: 'article-3',
      content: {
        update_time: 1760000000,
        news_item: [{ title: 'Newest article', url: 'https://mp.weixin.qq.com/s/article-3' }],
      },
    },
    {
      article_id: 'article-2',
      content: {
        update_time: 1759990000,
        news_item: [{ title: 'Older article', url: 'https://mp.weixin.qq.com/s/article-2' }],
      },
    },
  ],
};

assert.deepEqual(getLatestPublishedArticle(payload), {
  articleId: 'article-3',
  title: 'Newest article',
  url: 'https://mp.weixin.qq.com/s/article-3',
  updateTime: 1760000000,
});
assert.deepEqual(parsePreviousArticleIds('["article-1"]'), ['article-1']);
assert.deepEqual(parsePreviousArticleIds('', 'article-1'), ['article-1']);

assert.deepEqual(buildPublishedArticlesRequest(20), { offset: 0, count: 20, no_content: 0 });

const firstRun = buildCheckResult(payload, []);
assert.equal(firstRun.baselineInitialized, true);
assert.equal(firstRun.hasNewArticle, false);
assert.deepEqual(firstRun.nextProcessedArticleIds, ['article-3', 'article-2']);

const laterRun = buildCheckResult(payload, ['article-2']);
assert.equal(laterRun.hasNewArticle, true);
assert.deepEqual(laterRun.newArticles.map((article) => article.articleId), ['article-3']);

const legacyMigration = buildCheckResult(payload, ['article-2'], { initializeBaseline: true });
assert.equal(legacyMigration.baselineInitialized, true);
assert.equal(legacyMigration.hasNewArticle, false);
assert.deepEqual(legacyMigration.nextProcessedArticleIds, ['article-3', 'article-2']);

assert.equal(buildCheckResult(payload, ['article-3', 'article-2']).hasNewArticle, false);
assert.equal(buildCheckResult({ item: [] }, ['article-1']).newArticles.length, 0);
assert.throws(() => getLatestPublishedArticle({ errcode: 40001, errmsg: 'invalid credential' }), /invalid credential/);

console.log('check_wechat_published_article tests passed');

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';

const DEFAULT_WECHAT_CONTENT_SOURCE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: markdown };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = stripWrappingQuotes(line.slice(index + 1).trim());
    data[key] = value;
  }
  return { data, body: markdown.slice(match[0].length) };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderInlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  return html;
}

export function markdownToHtml(markdown) {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const blocks = [];
  let paragraph = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed === '---') {
      flushParagraph();
      flushList();
      blocks.push('<hr>');
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks.join('\n');
}

export function resolveArticlePath(rootDir, options = {}) {
  if (options.articlePath) return path.resolve(rootDir, options.articlePath);
  if (options.outDir) return path.join(path.resolve(rootDir, options.outDir), 'article.md');
  if (options.runDate) return path.join(rootDir, 'weekly-wechat-posts', options.runDate, 'article.md');
  throw new Error('Missing article path. Provide --article, --out-dir, or --date.');
}

export function resolveOutputDir(articlePath) {
  return path.dirname(articlePath);
}

export function resolveCoverFile(rootDir, articlePath, frontmatter) {
  const cover = frontmatter.cover || frontmatter.coverImage || frontmatter.image || '';
  if (!cover) throw new Error('Article frontmatter is missing cover.');
  if (cover.startsWith('/')) {
    return path.join(rootDir, 'public', cover.slice(1).replaceAll('/', path.sep));
  }
  return path.resolve(path.dirname(articlePath), cover);
}

export async function prepareCoverForUpload(coverPath, outputDir) {
  if (!fs.existsSync(coverPath)) {
    throw new Error(`Cover image not found: ${coverPath}`);
  }
  const targetPath = path.join(outputDir, 'cover-upload.jpg');
  await sharp(coverPath).jpeg({ quality: 88 }).toFile(targetPath);
  return targetPath;
}

function applyProxyEnv() {
  const proxy =
    process.env.WECHAT_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    '';
  if (!proxy) return;

  process.env.HTTP_PROXY = process.env.HTTP_PROXY || proxy;
  process.env.HTTPS_PROXY = process.env.HTTPS_PROXY || proxy;
  process.env.NODE_USE_ENV_PROXY = process.env.NODE_USE_ENV_PROXY || '1';
  if (typeof http.setGlobalProxyFromEnv === 'function') {
    http.setGlobalProxyFromEnv({
      http_proxy: process.env.HTTP_PROXY,
      https_proxy: process.env.HTTPS_PROXY,
      no_proxy: process.env.NO_PROXY || process.env.no_proxy || '',
    });
  }
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${text.slice(0, 300)}`);
  }
  return data;
}

export async function getAccessToken({ appId, appSecret }) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);
  const data = await fetchJson(url, { method: 'GET' });
  if (!data?.access_token) {
    throw new Error(`WeChat access_token missing: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.access_token;
}

export async function uploadCoverMedia(accessToken, coverFilePath) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('type', 'image');

  const form = new FormData();
  const fileBuffer = fs.readFileSync(coverFilePath);
  form.set('media', new Blob([fileBuffer], { type: 'image/jpeg' }), path.basename(coverFilePath));

  const data = await fetchJson(url, {
    method: 'POST',
    body: form,
  });

  if (!data?.media_id) {
    throw new Error(`WeChat media_id missing: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return data.media_id;
}

export function buildDraftPayload({ frontmatter, html, thumbMediaId, sourceUrl, commentsOpen, fansOnly }) {
  return {
    articles: [
      {
        title: frontmatter.title,
        author: frontmatter.author || '老广去边度',
        digest: frontmatter.summary || frontmatter.description || '',
        content: html,
        content_source_url: sourceUrl || frontmatter.sourceUrl || frontmatter.contentSourceUrl || '',
        thumb_media_id: thumbMediaId,
        need_open_comment: commentsOpen ? 1 : 0,
        only_fans_can_comment: fansOnly ? 1 : 0,
      },
    ],
  };
}

export async function createDraft(accessToken, payload) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  url.searchParams.set('access_token', accessToken);
  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!data?.media_id) {
    throw new Error(`WeChat draft media_id missing: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

export function readWeChatConfig(env = process.env) {
  const appId = (env.WECHAT_APP_ID || '').trim();
  const appSecret = (env.WECHAT_APP_SECRET || '').trim();
  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID / WECHAT_APP_SECRET are required.');
  }
  return {
    appId,
    appSecret,
    sourceUrl: (env.WECHAT_CONTENT_SOURCE_URL || DEFAULT_WECHAT_CONTENT_SOURCE_URL).trim(),
    commentsOpen: (env.WECHAT_NEED_OPEN_COMMENT || '1').trim() !== '0',
    fansOnly: (env.WECHAT_ONLY_FANS_CAN_COMMENT || '0').trim() === '1',
    proxyUrl: (env.WECHAT_PROXY_URL || env.HTTPS_PROXY || env.HTTP_PROXY || '').trim(),
  };
}

export async function publishMarkdownArticle(rootDir, options = {}) {
  applyProxyEnv();
  const config = readWeChatConfig();
  const articlePath = resolveArticlePath(rootDir, options);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article file not found: ${articlePath}`);
  }

  const markdown = fs.readFileSync(articlePath, 'utf8');
  const { data: frontmatter, body } = parseFrontmatter(markdown);
  if (!frontmatter.title || !frontmatter.summary || !frontmatter.cover) {
    throw new Error('Article frontmatter must include title, summary, and cover.');
  }

  const outputDir = resolveOutputDir(articlePath);
  const coverPath = resolveCoverFile(rootDir, articlePath, frontmatter);
  const uploadCoverPath = await prepareCoverForUpload(coverPath, outputDir);
  const html = markdownToHtml(body);
  const htmlPath = path.join(outputDir, 'article.html');
  fs.writeFileSync(htmlPath, `${html}\n`, 'utf8');

  const accessToken = await getAccessToken(config);
  const thumbMediaId = await uploadCoverMedia(accessToken, uploadCoverPath);
  const payload = buildDraftPayload({
    frontmatter,
    html,
    thumbMediaId,
    sourceUrl: options.sourceUrl || config.sourceUrl,
    commentsOpen: config.commentsOpen,
    fansOnly: config.fansOnly,
  });
  const payloadPath = path.join(outputDir, 'draft-payload.json');
  fs.writeFileSync(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const draft = await createDraft(accessToken, payload);
  const result = {
    publishedAt: new Date().toISOString(),
    articlePath,
    htmlPath,
    payloadPath,
    coverPath,
    uploadCoverPath,
    thumbMediaId,
    mediaId: draft.media_id,
    proxyUsed: config.proxyUrl || null,
  };
  fs.writeFileSync(path.join(outputDir, 'publish-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

export async function preparePublishBundle(rootDir, options = {}) {
  const articlePath = resolveArticlePath(rootDir, options);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article file not found: ${articlePath}`);
  }

  const markdown = fs.readFileSync(articlePath, 'utf8');
  const { data: frontmatter, body } = parseFrontmatter(markdown);
  if (!frontmatter.title || !frontmatter.summary || !frontmatter.cover) {
    throw new Error('Article frontmatter must include title, summary, and cover.');
  }

  const outputDir = resolveOutputDir(articlePath);
  const coverPath = resolveCoverFile(rootDir, articlePath, frontmatter);
  const uploadCoverPath = await prepareCoverForUpload(coverPath, outputDir);
  const html = markdownToHtml(body);
  const htmlPath = path.join(outputDir, 'article.html');
  fs.writeFileSync(htmlPath, `${html}\n`, 'utf8');

  const bundle = {
    generatedAt: new Date().toISOString(),
    title: frontmatter.title,
    summary: frontmatter.summary,
    author: frontmatter.author || '老广去边度',
    sourceUrl: options.sourceUrl || process.env.WECHAT_CONTENT_SOURCE_URL || DEFAULT_WECHAT_CONTENT_SOURCE_URL,
    commentsOpen: (process.env.WECHAT_NEED_OPEN_COMMENT || '1').trim() !== '0',
    fansOnly: (process.env.WECHAT_ONLY_FANS_CAN_COMMENT || '0').trim() === '1',
    articlePath,
    htmlPath,
    coverPath,
    uploadCoverPath,
  };

  const bundlePath = path.join(outputDir, 'publish-bundle.json');
  fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  return { bundle, bundlePath };
}

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';
import { ensureReferencedQrAssets } from './weekly_wechat_article.mjs';

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
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  return html;
}

function mimeTypeFromFileName(fileName) {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function renderMarkdownImage(alt, src, options = {}) {
  const width = options.width || '100%';
  const maxWidth = options.maxWidth || '100%';
  const display = options.display || 'block';
  const borderRadius = options.borderRadius || '8px';
  return `<div style="margin:18px 0 20px;text-align:center;"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" style="display:${display};width:${width};max-width:${maxWidth};height:auto;border-radius:${borderRadius};"></div>`;
}

function renderSupportBlock({ ctaLabel, href, address, qrAlt, qrSrc }) {
  return [
    '<div style="margin:14px 0 28px;padding:16px 18px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;">',
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:8px 16px;border-radius:999px;background:#0f766e;color:#ffffff;text-decoration:none;font-size:15px;line-height:1.2;font-weight:600;">${escapeHtml(ctaLabel)}</a>`,
    '<div style="margin:14px 0 6px;font-size:13px;line-height:1.5;color:#6b7280;">详情地址</div>',
    `<a href="${escapeHtml(address)}" style="display:block;font-size:14px;line-height:1.7;color:#0f172a;text-decoration:none;font-weight:600;">老广去边度站内详情页</a>`,
    `<div style="margin-top:6px;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">${escapeHtml(address)}</div>`,
    '<div style="margin:14px 0 8px;font-size:13px;line-height:1.5;color:#6b7280;">扫码查看详情</div>',
    `<div style="text-align:center;"><img src="${escapeHtml(qrSrc)}" alt="${escapeHtml(qrAlt || '报名二维码')}" style="display:block;margin:0 auto;width:200px;max-width:100%;height:auto;border-radius:0;"></div>`,
    '</div>',
  ].join('');
}

function consumeBlankLines(lines, startIndex) {
  let index = startIndex;
  while (index < lines.length && !lines[index].trim()) index += 1;
  return index;
}

function tryRenderSupportBlock(lines, startIndex) {
  const ctaMatch = lines[startIndex]?.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
  if (!ctaMatch) return null;

  let cursor = consumeBlankLines(lines, startIndex + 1);
  const addressMatch = lines[cursor]?.trim().match(/^地址[:：]\s*(https?:\/\/\S+)$/);
  if (!addressMatch) return null;

  cursor = consumeBlankLines(lines, cursor + 1);
  const qrHint = lines[cursor]?.trim();
  if (!qrHint || !qrHint.startsWith('扫码')) return null;

  cursor = consumeBlankLines(lines, cursor + 1);
  const qrMatch = lines[cursor]?.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
  if (!qrMatch) return null;

  return {
    nextIndex: cursor,
    html: renderSupportBlock({
      ctaLabel: ctaMatch[1],
      href: ctaMatch[2],
      address: addressMatch[1],
      qrAlt: qrMatch[1],
      qrSrc: qrMatch[2],
    }),
  };
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
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

    const supportBlock = tryRenderSupportBlock(lines, index);
    if (supportBlock) {
      flushParagraph();
      flushList();
      blocks.push(supportBlock.html);
      index = supportBlock.nextIndex;
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

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      blocks.push(renderMarkdownImage(imageMatch[1], imageMatch[2]));
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
  if (/^https?:\/\//i.test(cover)) {
    return cover;
  }
  if (cover.startsWith('/')) {
    return path.join(rootDir, 'public', cover.slice(1).replaceAll('/', path.sep));
  }
  return path.resolve(path.dirname(articlePath), cover);
}

export async function prepareCoverForUpload(coverPath, outputDir) {
  const targetPath = path.join(outputDir, 'cover-upload.jpg');
  if (/^https?:\/\//i.test(String(coverPath))) {
    const response = await fetch(String(coverPath));
    if (!response.ok) {
      throw new Error(`Cover image download failed: ${response.status} ${String(coverPath)}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await sharp(bytes).jpeg({ quality: 88 }).toFile(targetPath);
    return targetPath;
  }
  if (!fs.existsSync(coverPath)) {
    throw new Error(`Cover image not found: ${coverPath}`);
  }
  await sharp(coverPath).jpeg({ quality: 88 }).toFile(targetPath);
  return targetPath;
}

function collectHtmlImageSources(html) {
  const sources = [];
  const seen = new Set();
  const regex = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;
  for (const match of html.matchAll(regex)) {
    const src = String(match[1] || '').trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    sources.push(src);
  }
  return sources;
}

function replaceHtmlImageSources(html, replacements) {
  let output = html;
  for (const [source, target] of replacements.entries()) {
    output = output.replaceAll(`src="${source}"`, `src="${target}"`);
  }
  return output;
}

async function loadImageAsset(rootDir, articlePath, source) {
  const decodedSource = decodeHtmlEntities(source);
  if (/^https?:\/\//i.test(decodedSource)) {
    const response = await fetch(decodedSource);
    if (!response.ok) {
      throw new Error(`Inline image download failed: ${response.status} ${decodedSource}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const url = new URL(decodedSource);
    const fileName = path.basename(url.pathname || 'image.jpg') || 'image.jpg';
    const contentType = response.headers.get('content-type') || mimeTypeFromFileName(fileName);
    return { bytes, fileName, contentType };
  }

  let filePath = decodedSource;
  if (decodedSource.startsWith('/')) {
    filePath = path.join(rootDir, 'public', decodedSource.slice(1).replaceAll('/', path.sep));
  } else {
    filePath = path.resolve(path.dirname(articlePath), decodedSource);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Inline image not found: ${decodedSource}`);
  }

  return {
    bytes: fs.readFileSync(filePath),
    fileName: path.basename(filePath),
    contentType: mimeTypeFromFileName(filePath),
  };
}

export async function uploadArticleImage(accessToken, imageAsset) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/media/uploadimg');
  url.searchParams.set('access_token', accessToken);

  const form = new FormData();
  form.set(
    'media',
    new Blob([imageAsset.bytes], { type: imageAsset.contentType }),
    imageAsset.fileName,
  );

  const data = await fetchJson(url, {
    method: 'POST',
    body: form,
  });

  if (!data?.url) {
    throw new Error(`WeChat inline image url missing: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.url;
}

export async function rewriteHtmlImagesForWechat(rootDir, articlePath, html, accessToken) {
  const replacements = new Map();
  for (const source of collectHtmlImageSources(html)) {
    if (/^https?:\/\/mmbiz\.qpic\.cn\//i.test(source)) continue;
    const asset = await loadImageAsset(rootDir, articlePath, source);
    const uploadedUrl = await uploadArticleImage(accessToken, asset);
    replacements.set(source, uploadedUrl);
  }
  return replaceHtmlImageSources(html, replacements);
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
    sourceUrl: (env.WECHAT_CONTENT_SOURCE_URL || '').trim(),
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
  const rawHtml = markdownToHtml(body);
  const htmlPath = path.join(outputDir, 'article.html');

  const accessToken = await getAccessToken(config);
  const thumbMediaId = await uploadCoverMedia(accessToken, uploadCoverPath);
  await ensureReferencedQrAssets(outputDir, body);
  const html = await rewriteHtmlImagesForWechat(rootDir, articlePath, rawHtml, accessToken);
  fs.writeFileSync(htmlPath, `${html}\n`, 'utf8');
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
  await ensureReferencedQrAssets(outputDir, body);

  const bundle = {
    generatedAt: new Date().toISOString(),
    title: frontmatter.title,
    summary: frontmatter.summary,
    author: frontmatter.author || '老广去边度',
    sourceUrl: options.sourceUrl || process.env.WECHAT_CONTENT_SOURCE_URL || '',
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

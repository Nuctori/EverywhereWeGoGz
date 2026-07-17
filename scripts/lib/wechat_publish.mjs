import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ensureReferencedQrAssets } from './weekly_wechat_article.mjs';

const SITE_BASE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';

function resolveLocalImage(url) {
  const str = String(url || '').trim();
  if (!str) return null;

  // 1) If the URL starts with SITE_BASE_URL, strip it and check public/...
  if (str.startsWith(SITE_BASE_URL)) {
    const relPath = str.slice(SITE_BASE_URL.length).replace(/[/\\]/g, path.sep);
    if (relPath) {
      const candidate = path.join('public', relPath);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  // 2) If the URL contains /data/image-cache/, try that path directly
  const cacheIdx = str.indexOf('/data/image-cache/');
  if (cacheIdx !== -1) {
    const relPath = str.slice(cacheIdx + 1).replace(/[/\\]/g, path.sep);
    const candidate = path.join('public', relPath);
    if (fs.existsSync(candidate)) return candidate;
  }

  // 3) For any HTTP URL, compute the cache hash and check local cache
  //    The image cache uses: sha1(url).slice(0,16) as filename
  try {
    const urlObj = new URL(str);
    const hostDir = urlObj.host.replace(/:/g, '_');
    const ext = path.extname(urlObj.pathname).toLowerCase();
    const hash = crypto.createHash('sha1').update(str).digest('hex').slice(0, 16);
    const cacheDir = 'public/data/image-cache';
    if (fs.existsSync(cacheDir)) {
      // Check webp first, then original extension
      const webpPath = path.join(cacheDir, hostDir, `${hash}.webp`);
      if (fs.existsSync(webpPath)) return webpPath;
      if (ext) {
        const origPath = path.join(cacheDir, hostDir, `${hash}${ext}`);
        if (fs.existsSync(origPath)) return origPath;
      }
      // Also try without hostDir — search all cache subdirs by hash
      const domains = fs.readdirSync(cacheDir);
      for (const domain of domains) {
        const domainDir = path.join(cacheDir, domain);
        if (!fs.statSync(domainDir).isDirectory()) continue;
        const webpPath2 = path.join(domainDir, `${hash}.webp`);
        if (fs.existsSync(webpPath2)) return webpPath2;
      }
    }
  } catch {
    // URL parsing failed, skip hash search
  }

  return null;
}

function generateFallbackImage(width, height, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    <rect x="${width/2-40}" y="${height/2-40}" width="80" height="80" rx="8" fill="#9ca3af"/>
    <text x="${width/2}" y="${height/2+60}" font-family="sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">${label || '图片加载中'}</text>
  </svg>`;
  return Buffer.from(svg);
}

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
  return `<div style="margin:16px 0 18px;text-align:center;"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" style="display:${display};width:${width};max-width:${maxWidth};height:auto;border-radius:${borderRadius};"></div>`;
}

function renderSupportBlock({ ctaLabel, href, address, qrAlt, qrSrc }) {
  return [
    '<div style="margin:16px 0 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;">',
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

function renderHeading(level, text) {
  const styles = {
    1: 'margin:0 0 18px;font-size:28px;line-height:1.35;font-weight:700;color:#0f172a;',
    2: 'margin:30px 0 14px;padding-left:10px;border-left:4px solid #0f766e;font-size:22px;line-height:1.4;font-weight:700;color:#0f172a;',
    3: 'margin:26px 0 12px;font-size:19px;line-height:1.5;font-weight:700;color:#0f172a;',
    4: 'margin:0 0 14px;font-size:18px;line-height:1.6;font-weight:700;color:#111827;',
    5: 'margin:0 0 12px;font-size:17px;line-height:1.6;font-weight:700;color:#111827;',
    6: 'margin:0 0 10px;font-size:16px;line-height:1.6;font-weight:700;color:#111827;',
  };
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 1));
  return `<h${safeLevel} style="${styles[safeLevel]}">${renderInlineMarkdown(text)}</h${safeLevel}>`;
}

function renderParagraph(lines) {
  return `<p style="margin:0 0 14px;font-size:16px;line-height:1.82;color:#1f2937;">${lines.map(renderInlineMarkdown).join('<br>')}</p>`;
}

function renderList(items) {
  return `<ul style="margin:0 0 14px;padding-left:1.35em;color:#1f2937;">${items.map((item) => `<li style="margin:0 0 8px;font-size:15px;line-height:1.75;">${renderInlineMarkdown(item)}</li>`).join('')}</ul>`;
}

function renderHorizontalRule() {
  return '<hr style="margin:30px 0 24px;border:0;border-top:1px solid #dbe4ea;">';
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
    blocks.push(renderParagraph(paragraph));
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(renderList(listItems));
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
      blocks.push(renderHorizontalRule());
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
      blocks.push(renderHeading(level, headingMatch[2]));
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
    // Try local file system first (image cache is checked out in CI)
    const localPath = resolveLocalImage(coverPath);
    if (localPath) {
      console.warn(`Cover image resolved locally: ${localPath}`);
      await sharp(localPath).jpeg({ quality: 88 }).toFile(targetPath);
      return targetPath;
    }
    try {
      const response = await fetch(String(coverPath), { signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer());
        await sharp(bytes).jpeg({ quality: 88 }).toFile(targetPath);
        return targetPath;
      }
      console.warn(`Cover image download failed (${response.status}): ${String(coverPath)}`);
    } catch (err) {
      console.warn(`Cover image fetch error: ${err.message}`);
    }
    // Fallback: solid-color cover
    const fallbackBuffer = generateFallbackImage(1200, 630, '老广去边度');
    await sharp(fallbackBuffer).jpeg({ quality: 88 }).toFile(targetPath);
    console.warn(`Generated fallback cover image -> ${targetPath}`);
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

function hashInlineImageSource(source) {
  return crypto.createHash('sha1').update(String(source)).digest('hex').slice(0, 12);
}

function normalizeInlineImageExtension(fileName, contentType) {
  const lowerName = String(fileName || '').toLowerCase();
  const lowerType = String(contentType || '').toLowerCase();
  if (lowerType.includes('image/png') || lowerName.endsWith('.png')) return '.png';
  if (lowerType.includes('image/gif') || lowerName.endsWith('.gif')) return '.gif';
  if (
    lowerType.includes('image/jpeg') ||
    lowerType.includes('image/jpg') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg')
  ) {
    return '.jpg';
  }
  return '.jpg';
}

async function normalizeInlineImageAsset(imageAsset) {
  const fileName = path.basename(imageAsset.fileName || 'image.jpg');
  const contentType = String(imageAsset.contentType || '').toLowerCase();
  const needsConversion =
    contentType.includes('image/webp') ||
    contentType.includes('image/avif') ||
    fileName.toLowerCase().endsWith('.webp') ||
    fileName.toLowerCase().endsWith('.avif');

  if (needsConversion) {
    const converted = await sharp(imageAsset.bytes).jpeg({ quality: 88 }).toBuffer();
    return {
      bytes: converted,
      fileName: `${path.parse(fileName).name}.jpg`,
      contentType: 'image/jpeg',
    };
  }

  return {
    bytes: imageAsset.bytes,
    fileName,
    contentType: imageAsset.contentType || mimeTypeFromFileName(fileName),
  };
}

async function materializeInlineImageAsset(rootDir, articlePath, outputDir, source) {
  const imageAsset = await loadImageAsset(rootDir, articlePath, source);
  const normalizedAsset = await normalizeInlineImageAsset(imageAsset);
  const assetDir = path.join(outputDir, 'wechat-assets');
  fs.mkdirSync(assetDir, { recursive: true });
  const assetFileName = `${hashInlineImageSource(source)}${normalizeInlineImageExtension(
    normalizedAsset.fileName,
    normalizedAsset.contentType,
  )}`;
  const assetPath = path.join(assetDir, assetFileName);
  fs.writeFileSync(assetPath, normalizedAsset.bytes);
  return path.posix.join('wechat-assets', assetFileName);
}

async function rewriteHtmlImagesForBundle(rootDir, articlePath, html, outputDir) {
  const replacements = new Map();
  for (const source of collectHtmlImageSources(html)) {
    if (!/^https?:\/\//i.test(source)) continue;
    const localPath = await materializeInlineImageAsset(rootDir, articlePath, outputDir, source);
    replacements.set(source, localPath);
  }
  return replaceHtmlImageSources(html, replacements);
}

async function loadImageAsset(rootDir, articlePath, source) {
  const decodedSource = decodeHtmlEntities(source);
  if (/^https?:\/\//i.test(decodedSource)) {
    // Try local file system first (image cache is checked out in CI)
    const localPath = resolveLocalImage(decodedSource);
    if (localPath) {
      console.warn(`Inline image resolved locally: ${localPath}`);
      const bytes = fs.readFileSync(localPath);
      const fileName = path.basename(localPath);
      return normalizeInlineImageAsset({ bytes, fileName, contentType: mimeTypeFromFileName(fileName) });
    }
    try {
      const response = await fetch(decodedSource, { signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer());
        const url = new URL(decodedSource);
        const fileName = path.basename(url.pathname || 'image.jpg') || 'image.jpg';
        const contentType = response.headers.get('content-type') || mimeTypeFromFileName(fileName);
        return normalizeInlineImageAsset({ bytes, fileName, contentType });
      }
      console.warn(`Inline image download failed (${response.status}): ${decodedSource}`);
    } catch (err) {
      console.warn(`Inline image fetch error: ${err.message}`);
    }
    // Fallback: visible placeholder
    const fallbackBuffer = generateFallbackImage(400, 300, '');
    return normalizeInlineImageAsset({
      bytes: fallbackBuffer,
      fileName: 'placeholder.svg',
      contentType: 'image/svg+xml',
    });
  }

  let filePath = decodedSource;
  if (path.isAbsolute(decodedSource) && fs.existsSync(decodedSource)) {
    filePath = decodedSource;
  } else if (decodedSource.startsWith('/')) {
    filePath = path.join(rootDir, 'public', decodedSource.slice(1).replaceAll('/', path.sep));
  } else {
    filePath = path.resolve(path.dirname(articlePath), decodedSource);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Inline image not found: ${decodedSource}`);
  }

  return normalizeInlineImageAsset({
    bytes: fs.readFileSync(filePath),
    fileName: path.basename(filePath),
    contentType: mimeTypeFromFileName(filePath),
  });
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
  await ensureReferencedQrAssets(outputDir, body);
  const htmlWithLocalAssets = await rewriteHtmlImagesForBundle(rootDir, articlePath, html, outputDir);
  fs.writeFileSync(htmlPath, `${htmlWithLocalAssets}\n`, 'utf8');

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

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';

const DEFAULT_WECHAT_CONTENT_SOURCE_URL = 'https://nuctori.github.io/EverywhereWeGoGz/';
const DEFAULT_QR_SERVICE_URL = 'https://quickchart.io/qr';
const PARAGRAPH_STYLE = 'margin:0 0 16px;line-height:1.85;font-size:16px;color:#1f2328;';
const LEAD_PARAGRAPH_STYLE = 'margin:0 0 18px;line-height:1.9;font-size:17px;color:#1f2328;';
const H1_STYLE = 'margin:0 0 20px;font-size:28px;line-height:1.35;font-weight:700;color:#111827;';
const H2_STYLE = 'margin:30px 0 14px;font-size:22px;line-height:1.45;font-weight:700;color:#111827;';
const H3_STYLE = 'margin:24px 0 10px;font-size:18px;line-height:1.5;font-weight:700;color:#111827;';
const IMAGE_WRAP_STYLE = 'margin:18px 0 20px;text-align:center;';
const IMAGE_STYLE = 'display:block;width:100%;height:auto;border-radius:8px;';
const QR_IMAGE_STYLE = 'display:inline-block;max-width:220px;width:52%;height:auto;';
const HR_STYLE = 'border:none;border-top:1px solid #e5e7eb;margin:24px 0;';
const QR_CALLOUT_STYLE = 'margin:18px 0 24px;padding:14px 16px;background:#f7f8fa;border-radius:8px;';
const QR_LABEL_STYLE = 'margin:0 0 10px;line-height:1.75;font-size:14px;color:#4b5563;';
const LINK_STYLE = 'color:#0f766e;text-decoration:none;';
const WECHAT_DIGEST_MAX_CHARS = 120;

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
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2" style="${LINK_STYLE}">$1</a>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  return html;
}

function parseStandaloneImage(line) {
  const match = line.trim().match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);
  if (!match) return null;
  return { alt: match[1] || '', src: match[2] };
}

function renderStandaloneImage(line) {
  const image = parseStandaloneImage(line);
  if (!image) return null;
  const imageStyle = /二维码/.test(image.alt) ? QR_IMAGE_STYLE : IMAGE_STYLE;
  return `<div style="${IMAGE_WRAP_STYLE}"><img src="${image.src}" alt="${escapeHtml(image.alt)}" style="${imageStyle}"></div>`;
}

export function markdownToHtml(markdown) {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());

  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let listType = null;
  let quoteLines = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    if (paragraph.length === 1) {
      const standaloneImage = renderStandaloneImage(paragraph[0]);
      if (standaloneImage) {
        blocks.push(standaloneImage);
        paragraph = [];
        return;
      }
    }

    const hasStandaloneImages = paragraph.some((line) => parseStandaloneImage(line));
    if (!hasStandaloneImages) {
      const style = blocks.length === 0 ? LEAD_PARAGRAPH_STYLE : PARAGRAPH_STYLE;
      blocks.push(`<p style="${style}">${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
      paragraph = [];
      return;
    }

    let textBuffer = [];
    const flushTextBuffer = () => {
      if (textBuffer.length === 0) return;
      const style = blocks.length === 0 ? LEAD_PARAGRAPH_STYLE : PARAGRAPH_STYLE;
      blocks.push(`<p style="${style}">${textBuffer.map(renderInlineMarkdown).join('<br>')}</p>`);
      textBuffer = [];
    };

    for (const line of paragraph) {
      const standaloneImage = renderStandaloneImage(line);
      if (standaloneImage) {
        flushTextBuffer();
        blocks.push(standaloneImage);
        continue;
      }
      textBuffer.push(line);
    }
    flushTextBuffer();
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const rendered = listItems
      .map((item, index) => {
        const prefix = listType === 'ol' ? `${index + 1}. ` : '• ';
        return `<p style="${PARAGRAPH_STYLE}">${renderInlineMarkdown(prefix + item)}</p>`;
      })
      .join('\n');
    blocks.push(rendered);
    listItems = [];
    listType = null;
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const imageLines = quoteLines.filter((line) => /^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/.test(line));
    const textLines = quoteLines.filter((line) => !/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/.test(line));
    const inner = [];
    if (textLines.length > 0) {
      inner.push(`<p style="${QR_LABEL_STYLE}">${textLines.map(renderInlineMarkdown).join('<br>')}</p>`);
    }
    for (const line of imageLines) {
      const [, alt, src] = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/) || [];
      inner.push(
        `<div style="margin:8px 0 0;text-align:center;"><img src="${src}" alt="${escapeHtml(alt || '')}" style="${QR_IMAGE_STYLE}"></div>`,
      );
    }
    blocks.push(`<div style="${QR_CALLOUT_STYLE}">${inner.join('')}</div>`);
    quoteLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (trimmed === '---') {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push(`<hr style="${HR_STYLE}">`);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = headingMatch[1].length;
      const style =
        level === 1 ? H1_STYLE
          : level === 2 ? H2_STYLE
            : H3_STYLE;
      blocks.push(`<h${Math.min(level, 3)} style="${style}">${renderInlineMarkdown(headingMatch[2])}</h${Math.min(level, 3)}>`);
      continue;
    }

    const unorderedListMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedListMatch) {
      flushParagraph();
      flushQuote();
      listType = listType || 'ul';
      listItems.push(unorderedListMatch[1]);
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      flushParagraph();
      flushQuote();
      listType = listType || 'ol';
      listItems.push(orderedListMatch[1]);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushQuote();
  return blocks.join('\n');
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"');
}

function stripHtmlTags(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function truncateWechatDigest(value, maxChars = WECHAT_DIGEST_MAX_CHARS) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
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
  const isRemoteCover = /^https?:\/\//i.test(coverPath);
  const targetPath = path.join(outputDir, 'cover-upload.jpg');
  let coverInput = coverPath;

  if (isRemoteCover) {
    const response = await fetch(coverPath, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Remote cover fetch failed: ${response.status} ${coverPath}`);
    }
    coverInput = Buffer.from(await response.arrayBuffer());
  } else if (!fs.existsSync(coverPath)) {
    throw new Error(`Cover image not found: ${coverPath}`);
  }

  await sharp(coverInput).jpeg({ quality: 88 }).toFile(targetPath);
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

export async function uploadInlineImage(accessToken, imageUrl) {
  const response = await fetch(imageUrl, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Inline image fetch failed: ${response.status} ${imageUrl}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const url = new URL('https://api.weixin.qq.com/cgi-bin/media/uploadimg');
  url.searchParams.set('access_token', accessToken);

  const extension =
    contentType.includes('png') ? '.png'
      : contentType.includes('webp') ? '.webp'
        : contentType.includes('gif') ? '.gif'
          : '.jpg';

  const form = new FormData();
  form.set('media', new Blob([imageBuffer], { type: contentType }), `inline${extension}`);

  const data = await fetchJson(url, {
    method: 'POST',
    body: form,
  });

  if (!data?.url) {
    throw new Error(`WeChat inline image URL missing: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return data.url;
}

function deriveInlineImageExtension(contentType) {
  const normalized = String(contentType || '').toLowerCase();
  if (normalized.includes('png')) return '.png';
  return '.jpg';
}

function getInlineImageFileName(originalUrl, index, extension) {
  const parsed = (() => {
    try {
      return new URL(originalUrl);
    } catch {
      return null;
    }
  })();
  const baseName = parsed ? path.basename(parsed.pathname) : path.basename(originalUrl);
  const stem = baseName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/^-+|-+$/g, '');
  const safeStem = stem || `inline-${index + 1}`;
  return `${String(index + 1).padStart(2, '0')}-${safeStem}${extension}`;
}

export async function prepareInlineImageAssetsForHtml(html, outputDir) {
  const imageDir = path.join(outputDir, 'inline-images');
  fs.mkdirSync(imageDir, { recursive: true });

  const imageMap = new Map();
  const matches = [...html.matchAll(/<img\s+[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi)];

  for (const match of matches) {
    const originalUrl = match[1];
    if (imageMap.has(originalUrl)) continue;

    const response = await fetch(originalUrl, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Inline image fetch failed: ${response.status} ${originalUrl}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const extension = deriveInlineImageExtension(contentType);
    const fileName = getInlineImageFileName(originalUrl, imageMap.size, extension);
    const relativePath = `inline-images/${fileName}`;
    const targetPath = path.join(imageDir, fileName);

    if (extension === '.png') {
      fs.writeFileSync(targetPath, imageBuffer);
    } else {
      await sharp(imageBuffer).jpeg({ quality: 88 }).toFile(targetPath);
    }

    imageMap.set(originalUrl, relativePath);
  }

  let convertedHtml = html;
  for (const [originalUrl, relativePath] of imageMap.entries()) {
    convertedHtml = convertedHtml.split(originalUrl).join(relativePath);
  }

  return {
    html: convertedHtml,
    inlineImages: Array.from(imageMap.entries()).map(([originalUrl, relativePath]) => ({
      originalUrl,
      relativePath,
    })),
    inlineImagesDir: imageDir,
  };
}

export function buildQrFallbackUrl(targetUrl) {
  const url = new URL(DEFAULT_QR_SERVICE_URL);
  url.searchParams.set('text', targetUrl);
  url.searchParams.set('size', '320');
  url.searchParams.set('margin', '2');
  return url.toString();
}

function normalizeHeadingText(text) {
  return String(text || '')
    .replace(/^[#\s]+/, '')
    .replace(/^[0-9]+\.\s*/, '')
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
    .trim();
}

function buildMarkdownWithFrontmatter(frontmatterBlock, body) {
  if (!frontmatterBlock) {
    return `${body.trim()}\n`;
  }
  return `${frontmatterBlock.trim()}\n\n${body.trim()}\n`;
}

function stripLeadingTitleHeading(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let firstContentIndex = 0;
  while (firstContentIndex < lines.length && !lines[firstContentIndex].trim()) {
    firstContentIndex += 1;
  }
  if (firstContentIndex < lines.length && /^#\s+/.test(lines[firstContentIndex].trim())) {
    lines.splice(firstContentIndex, 1);
    while (firstContentIndex < lines.length && !lines[firstContentIndex].trim()) {
      lines.splice(firstContentIndex, 1);
    }
  }
  return lines.join('\n').trim();
}

function collectExternalLinkEntries(body, options = {}) {
  const sourceUrl = (options.sourceUrl || '').trim();
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const seen = new Set();
  const entries = [];
  let currentHeading = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^#{2,6}\s+(.+)$/);
    if (headingMatch) {
      currentHeading = normalizeHeadingText(headingMatch[1]);
      continue;
    }

    if (/^!\[[^\]]*]\((https?:\/\/[^)\s]+)\)$/.test(trimmed)) {
      continue;
    }

    const linkRegex = /(^|[^!])\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    for (const match of trimmed.matchAll(linkRegex)) {
      const label = match[2]?.trim() || '查看链接';
      const url = match[3]?.trim() || '';
      if (!url || seen.has(url)) continue;
      if (sourceUrl && url === sourceUrl) continue;
      seen.add(url);

      let entryLabel = label;
      if (/查看行程|查看线路|立即查看/.test(label) && currentHeading) {
        entryLabel = currentHeading;
      } else if (/阅读原文/.test(label)) {
        entryLabel = '阅读原文';
      }

      entries.push({
        label: entryLabel,
        actionLabel: label,
        url,
      });
    }
  }

  return entries;
}

export function injectQrFallbackIntoMarkdown(markdown, options = {}) {
  const frontmatterMatch = markdown.match(/^---\n[\s\S]*?\n---\n?/);
  const frontmatterBlock = frontmatterMatch ? frontmatterMatch[0] : '';
  const { body } = parseFrontmatter(markdown);
  const cleanedBody = stripLeadingTitleHeading(body);
  const lines = cleanedBody.replace(/\r\n/g, '\n').split('\n');
  const output = [];
  let currentHeading = '';
  let lastLinkUrl = '';
  let lastLinkLabel = '';

  const flushQrBlock = () => {
    if (!lastLinkUrl) return;
    output.push('');
    output.push(`地址：${lastLinkUrl}`);
    output.push('');
    output.push(`> 扫码查看详情`);
    output.push(`> ![${currentHeading || lastLinkLabel || '线路'} 报名二维码](${buildQrFallbackUrl(lastLinkUrl)})`);
    output.push('');
    lastLinkUrl = '';
    lastLinkLabel = '';
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^#{2,6}\s+(.+)$/);
    if (headingMatch) {
      flushQrBlock();
      currentHeading = normalizeHeadingText(headingMatch[1]);
      output.push(line);
      continue;
    }

    const standaloneImage = parseStandaloneImage(trimmed);
    if (standaloneImage && /二维码/.test(standaloneImage.alt || '')) {
      lastLinkUrl = '';
      lastLinkLabel = '';
      output.push(line);
      continue;
    }

    const linkMatch = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (linkMatch && /查看行程|查看线路|立即查看/.test(linkMatch[1])) {
      output.push(line);
      lastLinkLabel = linkMatch[1];
      lastLinkUrl = linkMatch[2];
      continue;
    }

    output.push(line);
  }

  flushQrBlock();
  return buildMarkdownWithFrontmatter(frontmatterBlock, output.join('\n'));
}

export async function uploadInlineImagesForHtml(accessToken, html) {
  const imageMap = new Map();
  const matches = [...html.matchAll(/<img\s+[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi)];

  for (const match of matches) {
    const originalUrl = match[1];
    if (imageMap.has(originalUrl)) continue;
    const uploadedUrl = await uploadInlineImage(accessToken, originalUrl);
    imageMap.set(originalUrl, uploadedUrl);
  }

  let convertedHtml = html;
  for (const [originalUrl, uploadedUrl] of imageMap.entries()) {
    convertedHtml = convertedHtml.split(originalUrl).join(uploadedUrl);
  }

  return {
    html: convertedHtml,
    uploadedImages: Array.from(imageMap.entries()).map(([originalUrl, uploadedUrl]) => ({
      originalUrl,
      uploadedUrl,
    })),
  };
}

export function buildDraftPayload({ frontmatter, html, thumbMediaId, sourceUrl, commentsOpen, fansOnly }) {
  return {
    articles: [
      {
        title: frontmatter.title,
        author: frontmatter.author || '老广去边度',
        digest: truncateWechatDigest(frontmatter.summary || frontmatter.description || ''),
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
  const sourceUrl = options.sourceUrl || config.sourceUrl;
  const markdownWithQrFallback = injectQrFallbackIntoMarkdown(markdown, { sourceUrl });
  const parsedMarkdown = parseFrontmatter(markdownWithQrFallback);
  const html = markdownToHtml(parsedMarkdown.body);
  const htmlPath = path.join(outputDir, 'article.html');
  const markdownPathWithQr = path.join(outputDir, 'article.with-qr.md');
  fs.writeFileSync(markdownPathWithQr, `${markdownWithQrFallback}\n`, 'utf8');

  const accessToken = await getAccessToken(config);
  const thumbMediaId = await uploadCoverMedia(accessToken, uploadCoverPath);
  const uploaded = await uploadInlineImagesForHtml(accessToken, html);
  fs.writeFileSync(htmlPath, `${uploaded.html}\n`, 'utf8');
  const payload = buildDraftPayload({
    frontmatter,
    html: uploaded.html,
    thumbMediaId,
    sourceUrl,
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
    markdownPathWithQr,
    inlineImageCount: uploaded.uploadedImages.length,
    proxyUsed: config.proxyUrl || null,
  };
  fs.writeFileSync(path.join(outputDir, 'publish-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'inline-image-map.json'), `${JSON.stringify(uploaded.uploadedImages, null, 2)}\n`, 'utf8');
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
  const sourceUrl = options.sourceUrl || process.env.WECHAT_CONTENT_SOURCE_URL || DEFAULT_WECHAT_CONTENT_SOURCE_URL;
  const markdownWithQrFallback = injectQrFallbackIntoMarkdown(markdown, { sourceUrl });
  const parsedMarkdown = parseFrontmatter(markdownWithQrFallback);
  const html = markdownToHtml(parsedMarkdown.body);
  const inlineAssets = await prepareInlineImageAssetsForHtml(html, outputDir);
  const htmlPath = path.join(outputDir, 'article.html');
  fs.writeFileSync(htmlPath, `${inlineAssets.html}\n`, 'utf8');
  const markdownPathWithQr = path.join(outputDir, 'article.with-qr.md');
  fs.writeFileSync(markdownPathWithQr, `${markdownWithQrFallback}\n`, 'utf8');

  const bundle = {
    generatedAt: new Date().toISOString(),
    title: frontmatter.title,
    summary: frontmatter.summary,
    author: frontmatter.author || '老广去边度',
    sourceUrl,
    commentsOpen: (process.env.WECHAT_NEED_OPEN_COMMENT || '1').trim() !== '0',
    fansOnly: (process.env.WECHAT_ONLY_FANS_CAN_COMMENT || '0').trim() === '1',
    articlePath,
    markdownPathWithQr,
    htmlPath,
    inlineImagesDir: inlineAssets.inlineImagesDir,
    coverPath,
    uploadCoverPath,
  };

  const bundlePath = path.join(outputDir, 'publish-bundle.json');
  fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  return { bundle, bundlePath };
}

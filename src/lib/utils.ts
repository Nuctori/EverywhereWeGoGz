import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 保留原始图片协议；部分供应商的 http 图片服务器不支持 https。
export function normalizeImageUrl(path: string) {
  if (!path) return path
  return path
}

// 拼接 BASE_URL 以兼容 Vite 部署路径（子目录部署场景）
export function resolveAssetUrl(path: string) {
  if (!path) return path
  const normalizedPath = normalizeImageUrl(path)
  if (/^(?:https?:)?\/\//.test(normalizedPath) || normalizedPath.startsWith('data:') || normalizedPath.startsWith('blob:')) return normalizedPath

  const baseUrl = import.meta.env.BASE_URL || "/"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

  if (normalizedPath.startsWith("/")) {
    return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath
  }

  return `${baseUrl}${normalizedPath}`
}
// 附加缓存版本号 __DATA_VERSION__，确保静态站点更新后浏览器不缓存旧数据
declare const __DATA_VERSION__: string;

export function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__ || Date.now().toString())}`;
}

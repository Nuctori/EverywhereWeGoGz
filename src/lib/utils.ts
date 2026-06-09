import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 将 http 强制升级为 https，防止混合内容安全警告
export function normalizeImageUrl(path: string) {
  if (!path) return path
  if (path.startsWith('http://')) {
    return `https://${path.slice('http://'.length)}`
  }
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

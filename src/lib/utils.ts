import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeImageUrl(path: string) {
  if (!path) return path
  if (path.startsWith('http://')) {
    return `https://${path.slice('http://'.length)}`
  }
  return path
}

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

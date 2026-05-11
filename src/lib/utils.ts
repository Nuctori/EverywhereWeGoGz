import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(path: string) {
  if (!path) return path
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path

  const baseUrl = import.meta.env.BASE_URL || "/"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

  if (path.startsWith("/")) {
    return normalizedBase ? `${normalizedBase}${path}` : path
  }

  return `${baseUrl}${path}`
}

// 图片不可用时的 SVG 回退占位图，显示温和的线路占位文案及标题
export function getFallbackImage(title: string): string {
  const safeTitle = title.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[char] || char));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)"/>
      <rect x="72" y="72" width="656" height="456" rx="28" fill="#ffffff" opacity="0.8"/>
      <g fill="none" stroke="#cbd5e1" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
        <path d="M270 220h260v180H270z"/>
        <path d="M310 340l55-55 45 45 35-35 45 45"/>
        <circle cx="340" cy="255" r="18"/>
      </g>
      <text x="400" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#64748b">老广精选线路</text>
      <text x="400" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">${safeTitle}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

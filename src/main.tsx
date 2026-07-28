import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function registerStaticAssetServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const baseUrl = import.meta.env.BASE_URL || '/';
  try {
    await navigator.serviceWorker.register(`${baseUrl}sw.js`, {
      scope: baseUrl,
      updateViaCache: 'none',
    });
    await navigator.serviceWorker.ready;
  } catch (error) {
    // Static resources remain available from GitHub Pages when SW registration fails.
    console.warn('[sw] static asset fallback unavailable:', error);
  }
}

async function bootstrap() {
  await registerStaticAssetServiceWorker();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();

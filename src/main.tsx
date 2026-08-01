import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function registerStaticAssetServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Never route local development data through the production CDN pool. An
  // older worker can still be registered from a previous local run, so remove
  // it before the app starts making data requests.
  const isLocalDevelopment = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (isLocalDevelopment) {
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith('everywhere-we-go-static-'))
          .map((key) => caches.delete(key)),
      );
    }
    if (wasControlled) window.location.reload();
    return;
  }

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

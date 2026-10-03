import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import './index.css';
import { StoreProvider } from './store';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Motiv nastavíme hned, aby při načtení neproblikla špatná barva
try {
  const raw = localStorage.getItem('maturitni-trener:data');
  const theme = raw ? JSON.parse(raw)?.settings?.theme : 'system';
  const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch {
  /* nevadí */
}

/**
 * Některé náhledy souborů (aplikace, správci souborů) běží v uzavřeném rámu,
 * kde nejde měnit adresu stránky – tam použijeme navigaci v paměti.
 */
function canUseHashRouter(): boolean {
  try {
    if (!/^(https?|file):$/.test(window.location.protocol)) return false;
    new URL(window.location.href);
    window.history.replaceState(window.history.state, '', window.location.href);
    return true;
  } catch {
    return false;
  }
}

const Router = canUseHashRouter() ? HashRouter : MemoryRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <StoreProvider>
          <App />
        </StoreProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);

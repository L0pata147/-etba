import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { StoreProvider } from './store';
import { App } from './App';

// Motiv nastavíme hned, aby při načtení neproblikla špatná barva
try {
  const raw = localStorage.getItem('maturitni-trener:data');
  const theme = raw ? JSON.parse(raw)?.settings?.theme : 'system';
  const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch {
  /* nevadí */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);

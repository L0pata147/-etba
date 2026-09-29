import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { Dashboard } from './pages/Dashboard';
import { Books } from './pages/Books';
import { BookEdit } from './pages/BookEdit';
import { BookDetail } from './pages/BookDetail';
import { Training } from './pages/Training';
import { SessionPage } from './pages/SessionPage';
import { Simulation, SimulationRun } from './pages/Simulation';
import { Terms } from './pages/Terms';
import { NonArt } from './pages/NonArt';
import { Unknown } from './pages/Unknown';
import { Plan } from './pages/Plan';
import { AiTeacher } from './pages/AiTeacher';
import { SettingsPage } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';

const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })));

export function App() {
  const { data } = useStore();
  if (!data.settings.onboarded) return <Onboarding />;
  return (
    <Layout>
      <Suspense fallback={<div className="py-20 text-center text-slate-500">Načítám…</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/knihy" element={<Books />} />
        <Route path="/knihy/nova" element={<BookEdit />} />
        <Route path="/knihy/:id" element={<BookDetail />} />
        <Route path="/knihy/:id/upravit" element={<BookEdit />} />
        <Route path="/trenink" element={<Training />} />
        <Route path="/trenink/relace" element={<SessionPage />} />
        <Route path="/simulace" element={<Simulation />} />
        <Route path="/simulace/:id" element={<SimulationRun />} />
        <Route path="/pojmy" element={<Terms />} />
        <Route path="/neumelecky" element={<NonArt />} />
        <Route path="/doucit" element={<Unknown />} />
        <Route path="/pokrok" element={<Stats />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/ai" element={<AiTeacher />} />
        <Route path="/nastaveni" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  );
}

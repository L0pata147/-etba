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
import { SiteHome } from './pages/site/SiteHome';
import { TopicDetail } from './pages/site/TopicDetail';
import { SiteOral } from './pages/site/SiteOral';
import { SitePractical } from './pages/site/SitePractical';
import { SiteTraining } from './pages/site/SiteTraining';
import { HwHome } from './pages/hw/HwHome';
import { HwTest } from './pages/hw/HwTest';
import { CloudHome } from './pages/cloud/CloudHome';
import { CloudPractical } from './pages/cloud/CloudPractical';
import { WritingPage } from './pages/Writing';
import { Drill } from './pages/Drill';
import { SearchPage } from './pages/Search';
import { TerminalPage } from './pages/Terminal';
import { QuestionOfDay } from './pages/QuestionOfDay';

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
        <Route path="/site" element={<SiteHome />} />
        <Route path="/site/tema/:id" element={<TopicDetail />} />
        <Route path="/site/losovani" element={<SiteOral />} />
        <Route path="/site/prakticka" element={<SitePractical />} />
        <Route path="/site/trenink" element={<SiteTraining key="site" />} />
        <Route path="/tema/:id" element={<TopicDetail />} />
        <Route path="/hw" element={<HwHome />} />
        <Route path="/hw/test" element={<HwTest />} />
        <Route path="/hw/trenink" element={<SiteTraining key="hw" subject="hw" />} />
        <Route path="/cloud" element={<CloudHome />} />
        <Route path="/cloud/prakticka" element={<CloudPractical />} />
        <Route path="/cloud/trenink" element={<SiteTraining key="cloud" subject="cloud" />} />
        <Route path="/sloh" element={<WritingPage />} />
        <Route path="/dril" element={<Drill />} />
        <Route path="/hledat" element={<SearchPage />} />
        <Route path="/terminal" element={<TerminalPage />} />
        <Route path="/otazka-dne" element={<QuestionOfDay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import { useStore } from '../store';
import { buildSession, type SessionConfig } from '../lib/session';
import { uid } from '../lib/random';
import { SessionRunner } from '../components/SessionRunner';

interface SessionState {
  cfg: SessionConfig;
  key: string;
}

export function useStartSession() {
  const navigate = useNavigate();
  return useCallback((cfg: SessionConfig) => navigate('/trenink/relace', { state: { cfg, key: uid() } satisfies SessionState }), [navigate]);
}

export function SessionPage() {
  const loc = useLocation();
  const state = loc.state as SessionState | null;
  if (!state?.cfg) return <Navigate to="/trenink" replace />;
  return <SessionInner key={state.key} cfg={state.cfg} />;
}

function SessionInner({ cfg }: { cfg: SessionConfig }) {
  const { data } = useStore();
  // Otázky se sestaví jen jednou při startu (další změny dat je nepřegenerují)
  const [initial] = useState(() => buildSession(data, cfg));
  const [round, setRound] = useState<{ qs: Question[]; n: number }>({ qs: initial, n: 0 });
  const title = useMemo(() => (round.n ? `${cfg.title} – opakování chyb` : cfg.title), [cfg.title, round.n]);
  return (
    <SessionRunner
      key={round.n}
      questions={round.qs}
      title={title}
      mode={cfg.mode}
      difficulty={cfg.difficulty}
      showSections={cfg.bySection}
      onRestart={(qs) => setRound((r) => ({ qs, n: r.n + 1 }))}
    />
  );
}

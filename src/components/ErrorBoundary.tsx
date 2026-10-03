import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Místo prázdné obrazovky ukáže, co se stalo a co dělat */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chyba aplikace', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="card p-6">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-2 text-xl font-bold">Něco se pokazilo</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Aplikace narazila na chybu. Tvoje uložená data jsou v pořádku. Zkus stránku načíst znovu. Pokud jsi soubor otevřel v náhledu (např. v aplikaci nebo správci souborů),
            otevři ho raději přímo v prohlížeči Chrome, Edge nebo Safari.
          </p>
          <p className="mt-3 rounded-lg bg-slate-100 p-2 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{this.state.error.message}</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white" onClick={() => this.setState({ error: null })}>
              Zkusit znovu
            </button>
            <button className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold dark:border-slate-700" onClick={() => window.location.reload()}>
              Načíst znovu
            </button>
          </div>
        </div>
      </div>
    );
  }
}

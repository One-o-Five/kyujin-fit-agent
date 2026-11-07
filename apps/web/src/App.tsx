import { useEffect, useState } from 'react';
import { fetchHealth } from './api';

type State =
  { kind: 'loading' } | { kind: 'ok'; time: string } | { kind: 'error'; message: string };

export function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    fetchHealth()
      .then((h) => setState({ kind: 'ok', time: h.time }))
      .catch((e: unknown) => setState({ kind: 'error', message: String(e) }));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>kyujin-fit-agent</h1>
      <p>
        API: {state.kind === 'loading' && '確認中…'}
        {state.kind === 'ok' && `稼働中（${state.time}）`}
        {state.kind === 'error' && `接続できません（${state.message}）`}
      </p>
    </main>
  );
}

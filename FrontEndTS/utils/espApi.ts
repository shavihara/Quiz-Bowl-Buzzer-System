const BASE = 'http://esp32.local';

export async function postConfig(durationMs: number) {
  const res = await fetch(`${BASE}/api/game/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ durationMs })
  });
  return res.ok;
}

export async function startGame() {
  const res = await fetch(`${BASE}/api/game/start`, { method: 'POST' });
  return res.ok;
}

export async function resetGame() {
  const res = await fetch(`${BASE}/api/game/reset`, { method: 'POST' });
  return res.ok;
}

export async function getStatus() {
  const res = await fetch(`${BASE}/api/status`);
  if (!res.ok) throw new Error('status failed');
  return res.json();
}

export function connectEvents(onBuzzer: (p: { teamIndex: number; orderNo: number; timestamp: number }) => void,
                              onResult: (r: { top3: number[] }) => void) {
  const es = new EventSource(`${BASE}/events`);
  es.addEventListener('buzzer', (e: MessageEvent) => {
    try { const data = JSON.parse(e.data); onBuzzer(data); } catch {}
  });
  es.addEventListener('result', (e: MessageEvent) => {
    try { const data = JSON.parse(e.data); onResult(data); } catch {}
  });
  es.onerror = () => {
    es.close();
    setTimeout(() => connectEvents(onBuzzer, onResult), 3000);
  };
  return es;
}


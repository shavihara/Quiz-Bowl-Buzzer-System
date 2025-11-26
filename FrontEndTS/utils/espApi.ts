let BASE: string = (typeof localStorage !== 'undefined' && localStorage.getItem('espBaseUrl')) || 'http://esp32.local';
export function setEspBaseUrl(url: string) {
  BASE = url;
  try { localStorage.setItem('espBaseUrl', url); } catch {}
}
export function getEspBaseUrl() {
  return BASE;
}

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

export async function getHealth() {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error('health failed');
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
    // Simple fallback: poll status once to keep UI roughly in sync
    getStatus().then((s) => {
      if (Array.isArray(s.pressOrder) && s.pressOrder.length) {
        onResult({ top3: s.pressOrder.slice(0, 3) });
      }
    }).catch(() => {});
    setTimeout(() => connectEvents(onBuzzer, onResult), 3000);
  };
  return es;
}

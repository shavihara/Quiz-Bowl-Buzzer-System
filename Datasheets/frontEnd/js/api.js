const BASE='http://esp32.local';
async function getJSON(p){ const r=await fetch(BASE+p,{headers:{'Accept':'application/json'}}); return r.json(); }
async function postJSON(p,b){ const r=await fetch(BASE+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}); return r.json().catch(()=>({})); }


// Какого размера картинки реально показываются — против того, что скачивается.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = ["", "news.html", "directory.html", "events.html", "shopping.html",
  "entertainment.html", "real-estate.html", "city-map.html", "contest.html",
  "auto/index.html", "auto/listing.html?id=c3"];
async function run(path, w) {
  const t = await (await fetch("http://localhost:9222/json/new?about:blank", { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
  let id = 0; const pend = new Map(); const lw = [];
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
    if (m.method === "Page.loadEventFired") lw.splice(0).forEach(f => f()); };
  const cmd = (me, p = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p })); return new Promise(r => pend.set(i, r)); };
  const ev = async x => { const r = await cmd("Runtime.evaluate", { expression: `${x}.then(o=>JSON.stringify(o))`, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return JSON.parse(r.result.value); };
  await cmd("Page.enable"); await cmd("Runtime.enable"); await cmd("Network.enable");
  await cmd("Network.setCacheDisabled", { cacheDisabled: true });
  await cmd("Emulation.setDeviceMetricsOverride", { width: w, height: 1000, deviceScaleFactor: 1, mobile: false });
  const l = new Promise(r => lw.push(r)); await cmd("Page.navigate", { url: "http://localhost:8000/" + path });
  await Promise.race([l, sleep(9000)]);
  await cmd("Runtime.evaluate", { expression: `(async()=>{const h=innerHeight;
    for(let y=0;y<=document.body.scrollHeight;y+=h){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}
    window.scrollTo(0,0);})()`, awaitPromise: true }, 60000);
  await sleep(500);
  const r = await ev(`(async()=>[...document.images].map(i=>({
      src: i.currentSrc.replace(location.origin+'/',''),
      nat: i.naturalWidth+'x'+i.naturalHeight,
      box: Math.round(i.getBoundingClientRect().width)+'x'+Math.round(i.getBoundingClientRect().height),
      bw: Math.round(i.getBoundingClientRect().width)
    })).filter(o=>o.bw>0))()`);
  ws.close(); await fetch(`http://localhost:9222/json/close/${t.id}`); return r;
}
const groups = {};
for (const p of PAGES) for (const o of await run(p, 1920)) {
  const dir = o.src.split('/').slice(0,2).join('/');
  (groups[dir] ||= []).push(o);
}
console.log("папка           показов  скачивается     показывается (макс)");
for (const [d, list] of Object.entries(groups)) {
  const maxW = Math.max(...list.map(o => +o.box.split('x')[0]));
  const maxH = Math.max(...list.map(o => +o.box.split('x')[1]));
  const nats = [...new Set(list.map(o => o.nat))];
  console.log(d.padEnd(15), String(list.length).padEnd(8), nats.join(',').slice(0,15).padEnd(15), `${maxW}x${maxH}`);
}
console.log("\nсамые крупные показы:");
const all = Object.values(groups).flat().sort((a,b)=>b.bw-a.bw);
for (const o of all.slice(0,6)) console.log(`  ${o.nat} → ${o.box}   ${o.src}`);

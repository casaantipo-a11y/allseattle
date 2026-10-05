// Layout measurement over CDP (headless Edge/Chrome), the trustworthy way described in
// .claude/rules/layout-check.md: device emulation (never --window-size), cache disabled,
// a fresh tab per width, step-scroll so loading="lazy" fires, compact JSON out.
//
// node measure.mjs <url> [--widths 375,768,1024,1440,1920] [--sel ".a,.b"] [--shot] [--out dir] [--port 9333]
//   url      full URL (http://localhost:8000/auto/ or http://localhost:3000/cars)
//   --sel    comma-separated selectors; first 3 matches of each get their rect (x,y,w,h, bottom)
//   --shot   also save a PNG per width into --out (default: OS temp) and print the paths
//
// Prints one JSON object: { url, widths: { "375": {...}, ... }, issues: [...] }.
// `issues` lists only what is wrong, so a clean run is `"issues": []`.
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? def : argv[i + 1]
}
const url = argv.find((a) => /^https?:\/\//.test(a))
if (!url) {
  console.error('usage: node measure.mjs <url> [--widths 375,1024,1440] [--sel ".a,.b"] [--shot] [--out dir]')
  process.exit(1)
}
const widths = flag('widths', '375,768,1024,1440,1920').split(',').map(Number)
const selectors = (flag('sel', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
const shot = argv.includes('--shot')
const outDir = flag('out', join(tmpdir(), 'measure-shots'))
const port = Number(flag('port', 9333))

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean)
const exe = BROWSERS.find((p) => existsSync(p))
if (!exe) {
  console.error('No Edge/Chrome found; set CHROME_PATH')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'measure-prof-'))
const browser = spawn(
  exe,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const http = async (path, method = 'GET') => (await fetch(`http://127.0.0.1:${port}${path}`, { method })).json()

async function waitForBrowser() {
  for (let i = 0; i < 50; i++) {
    try {
      return await http('/json/version')
    } catch {
      await sleep(200)
    }
  }
  throw new Error('browser did not open its debugging port')
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  const listeners = []
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) listeners.forEach((l) => l(msg))
  }
  const open = new Promise((r, j) => {
    ws.onopen = r
    ws.onerror = j
  })
  return {
    open,
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const n = ++id
        pending.set(n, { resolve, reject })
        ws.send(JSON.stringify({ id: n, method, params }))
      }),
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  }
}

const withTimeout = (p, ms, what) =>
  Promise.race([p, sleep(ms).then(() => Promise.reject(new Error(`timeout: ${what}`)))])

// Runs inside the page.
const PROBE = (sels) => {
  const r2 = (n) => Math.round(n * 100) / 100
  const rect = (el) => {
    const b = el.getBoundingClientRect()
    return { x: r2(b.x), y: r2(b.y + scrollY), w: r2(b.width), h: r2(b.height), bottom: r2(b.bottom + scrollY) }
  }
  const visible = (el) => {
    const b = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const describe = (el) =>
    el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ` "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`
  const small = [...document.querySelectorAll('a, button, input, select, textarea, [role=button], summary')]
    .filter(visible)
    // Inline text links inside prose are an agreed exception to the 44px rule (CLAUDE.md).
    .filter((el) => getComputedStyle(el).display !== 'inline')
    .filter((el) => {
      const b = el.getBoundingClientRect()
      return b.height < 44 || b.width < 44
    })
  const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src)
  const header = document.querySelector('#site-header-functional, header.site-header, body > header')
  scrollTo(0, 600)
  const headerTop = header ? r2(header.getBoundingClientRect().top) : null
  scrollTo(0, 0)
  const navOverflow = ['.nav-links', '.nav-secondary', '.nav-stack']
    .map((s) => document.querySelector(s))
    .filter(Boolean)
    .filter((el) => el.scrollWidth > el.clientWidth + 1)
    .map((el) => '.' + el.className.split(' ')[0])
  const out = {
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    narrowQuery: matchMedia('(max-width:460px)').matches,
    bodyFont: getComputedStyle(document.body).fontSize,
    pageHeight: document.documentElement.scrollHeight,
    headerTopScrolled: headerTop,
    navOverflow,
    smallTargets: small.length,
    smallTargetsSample: small.slice(0, 6).map(describe),
    brokenImages: broken.slice(0, 10),
    rects: {},
  }
  for (const s of sels) {
    try {
      out.rects[s] = [...document.querySelectorAll(s)].slice(0, 3).map(rect)
    } catch (e) {
      out.rects[s] = `bad selector: ${e.message}`
    }
  }
  return out
}

async function measureWidth(width) {
  const target = await http('/json/new?about:blank', 'PUT')
  const page = cdp(target.webSocketDebuggerUrl)
  await page.open
  const errors = []
  page.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.split('\n')[0] || m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`.trim())
  })
  try {
    await page.send('Network.enable')
    await page.send('Network.setCacheDisabled', { cacheDisabled: true })
    await page.send('Runtime.enable')
    await page.send('Log.enable')
    await page.send('Page.enable')
    const mobile = width < 1024
    await page.send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 812 : 900, deviceScaleFactor: 1, mobile })
    const loaded = new Promise((r) => page.on((m) => m.method === 'Page.loadEventFired' && r()))
    await page.send('Page.navigate', { url })
    await withTimeout(loaded, 45000, `load ${url} @${width}`)
    const ev = async (expr) => (await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value
    // Step down a viewport at a time (instant scroll skips lazy images otherwise), then back up.
    await ev(`(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)) } scrollTo(0, 0); await new Promise(r => setTimeout(r, 400)) })()`)
    const m = await ev(`(${PROBE})(${JSON.stringify(selectors)})`)
    m.consoleErrors = [...new Set(errors)].slice(0, 10)
    if (shot) {
      mkdirSync(outDir, { recursive: true })
      const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      const file = join(outDir, `${new URL(url).pathname.replace(/[^a-z0-9]+/gi, '_') || 'root'}-${width}.png`)
      writeFileSync(file, Buffer.from(data, 'base64'))
      m.screenshot = file
    }
    return m
  } finally {
    page.close()
    await http(`/json/close/${target.id}`).catch(() => {})
  }
}

const result = { url, widths: {}, issues: [] }
try {
  const version = await waitForBrowser()
  for (const w of widths) {
    let m
    try {
      m = await measureWidth(w)
    } catch (e) {
      result.issues.push(`@${w}: ${e.message}`)
      continue
    }
    result.widths[w] = m
    const is = (cond, text) => cond && result.issues.push(`@${w}: ${text}`)
    is(m.innerWidth !== w, `innerWidth is ${m.innerWidth}, emulation or a grid column inflated the layout`)
    is(w <= 460 && !m.narrowQuery, 'matchMedia(max-width:460px) is false — emulation did not apply, numbers are wrong')
    is(m.scrollWidth > m.innerWidth, `horizontal scroll: scrollWidth ${m.scrollWidth} > ${m.innerWidth}`)
    is(m.headerTopScrolled !== null && m.headerTopScrolled !== 0, `header not pinned when scrolled (top ${m.headerTopScrolled})`)
    is(w >= 1024 && m.navOverflow.length > 0, `nav row scrolls sideways: ${m.navOverflow.join(', ')}`)
    is(w < 1024 && m.smallTargets > 0, `${m.smallTargets} touch targets under 44px`)
    is(m.brokenImages.length > 0, `${m.brokenImages.length} broken images`)
    is(m.consoleErrors.length > 0, `${m.consoleErrors.length} console errors`)
    void version
  }
} finally {
  try {
    const v = await http('/json/version')
    const b = cdp(v.webSocketDebuggerUrl)
    await b.open
    await b.send('Browser.close').catch(() => {})
  } catch {}
  await sleep(500)
  try {
    execFileSync('taskkill', ['/pid', String(browser.pid), '/T', '/F'], { stdio: 'ignore' })
  } catch {}
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {}
}
console.log(JSON.stringify(result, null, 1))

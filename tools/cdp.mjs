// 极简 CDP 驱动：启动 headless Chrome，屏蔽 Google 字体（模拟国内网络），返回 { send, eval, go, shot, close }
// 用法见 tools/README.md
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function open({ width = 1180, height = 1000, dark = false, scale = 1 } = {}) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), 'gewu-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 200 && !ws; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
    if (!ws) await sleep(100);
  }
  if (!ws) throw new Error('Chrome 没有启动');
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: width < 600 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
  const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  return {
    send, eval: evaluate, sleep,
    async go(url, wait = 900) { await send('Page.navigate', { url }); await sleep(wait); },
    // 截取某个元素（document 坐标）
    async shot(selector, out) {
      const b = await evaluate(`const el=document.querySelector(${JSON.stringify(selector)});const r=el.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}`);
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
      if (!s.result) throw new Error('截图失败: ' + JSON.stringify(s.error));
      writeFileSync(out, Buffer.from(s.result.data, 'base64'));
      return out;
    },
    close() { ws.close(); chrome.kill(); setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }); } catch {} }, 500); },
  };
}

// 在页面里用 SIM 按 0.5 ms 步长推进到 sec 秒（与引擎相同的步长），返回页面内表达式
export const stepExpr = (load, sec) => `
  const D=JSON.parse(document.getElementById('data').textContent);const P={};D.problem.params.forEach(p=>P[p.key]=p.def);
  Object.assign(P,${JSON.stringify(load)});const S=SIM.init(P);const n=Math.round(${sec}/5e-4);
  for(let i=0;i<n&&!S.done;i++)SIM.step(S,P,5e-4);`;

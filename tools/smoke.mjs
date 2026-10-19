// 实际播放检查：逐页点遍第一个选项参数的每个模式、每个预设并发射，报告 JS 报错、横向溢出、状态条位置
// node tools/smoke.mjs <宽度> <0浅|1深> <页面编号,逗号分隔，或 all>
import { open } from './cdp.mjs';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [W = '1180', dark = '0', list = 'all'] = process.argv.slice(2);
const pages = list === 'all'
  ? ['index', ...readdirSync(root).filter(f => /^[A-Z]{2,3}-[A-Z]{3}-\d\d\.html$/.test(f)).map(f => f.slice(0, -5)).sort()]
  : list.split(',');
const b = await open({ width: +W, height: 900, dark: dark === '1' });
let bad = 0;
for (const f of pages) {
  await b.go(`file://${root}/${f}.html`);
  const r = await b.eval(`
    window.__e=[];addEventListener('error',e=>__e.push(e.message));
    const de=document.documentElement,play=document.getElementById('play');
    const res={overflow:de.scrollWidth>de.clientWidth,runs:0,play:play?.textContent};
    if(!play)return {...res,cards:document.querySelectorAll('a.card').length,errs:__e};
    const segs=document.querySelector('.seg[id^="f-"]');const modes=segs?[...segs.querySelectorAll('button')]:[null];
    for(const m of modes){ if(m){m.click();await new Promise(r=>setTimeout(r,80));}
      const n=document.querySelectorAll('#presets button').length;
      for(let i=0;i<n;i++){document.querySelectorAll('#presets button')[i].click();play.click();
        await new Promise(r=>setTimeout(r,300));res.runs++;}}
    res.statusPos=getComputedStyle(document.getElementById('status')).position;res.errs=__e;return res`);
  if (r.overflow || r.errs.length) bad++;
  console.log(`${W} ${dark === '1' ? '深' : '浅'} ${f.padEnd(11)} ${r.overflow ? '横向溢出!' : '无溢出'} 预设播放 ${r.runs} 次 ${r.play ?? ''} 状态条 ${r.statusPos ?? '-'} 报错 ${r.errs.length ? JSON.stringify(r.errs) : '0'}`);
}
b.close();
process.exit(bad ? 1 : 0);

// 打印读数：node tools/readout.mjs <页面编号> '<[[参数覆盖对象, 秒], ...]>'
// 读数回归：node tools/readout.mjs <页面编号> --regress <旧版本 html 路径>   （新旧版本在全部预设、变式、若干时刻上比较 readouts / status / verdict）
import { open, stepExpr } from './cdp.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, arg, old] = process.argv.slice(2);
const b = await open({ width: 760, height: 900 });
if (arg === '--regress') {
  const run = async file => {
    await b.go('file://' + file, 700);
    return b.eval(`const D0=JSON.parse(document.getElementById('data').textContent);const out=[];
      const loads=[{},...D0.presets.map(p=>p.load),...D0.variants.map(v=>v.load).filter(Boolean)];
      for(const ld of loads)for(const sec of [0.05,0.4,1.2,3]){${stepExpr('__LD__', '__SEC__').replace('"__LD__"', 'ld').replace("'__SEC__'", 'sec').replace('__SEC__', 'sec')}
        out.push(JSON.stringify([ld,sec,SIM.readouts(S,P),S.status.text,SIM.verdict(P)]));}
      return out`);
  };
  const A = await run(resolve(old)), B = await run(`${root}/${id}.html`);
  let diff = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) { if (diff < 3) console.log('差异', i, '\n  旧', A[i]?.slice(0, 300), '\n  新', B[i]?.slice(0, 300)); diff++; }
  console.log(`${id}: ${A.length} 组，差异 ${diff}`);
  b.close(); process.exit(diff ? 1 : 0);
}
await b.go(`file://${root}/${id}.html`, 600);
for (const [load, sec] of JSON.parse(arg || '[[{},1]]')) {
  const r = await b.eval(stepExpr(load, sec) + `return {status:S.status.text,ro:SIM.readouts(S,P).map(x=>x.join('=')).join(' | ')}`);
  console.log(JSON.stringify(load), sec + ' s →', r.status, '\n   ', r.ro);
}
b.close();

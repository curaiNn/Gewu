// 确定性截图：用页面里的 SIM 按 0.5 ms 推进到指定时刻再 draw，截取画布
// node tools/simshot.mjs <页面编号> <输出前缀> <宽度> <0浅|1深> '<[[名字, 参数覆盖对象, 秒], ...]>'
import { open, stepExpr } from './cdp.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, out, W = '760', dark = '0', list = '[["a",{},1]]'] = process.argv.slice(2);
const b = await open({ width: +W, height: 900, dark: dark === '1', scale: 2 });
for (const [name, load, sec] of JSON.parse(list)) {
  await b.go(`file://${root}/${id}.html`, 600);
  const st = await b.eval(stepExpr(load, sec) + `
    const cv=document.getElementById('cv'),tok=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();
    SIM.draw(cv.getContext('2d'),S,P,cv.width,cv.height,tok);document.getElementById('status').textContent=S.status.text;return S.status.text`);
  await b.shot('#cv', `${out}-${name}.png`);
  console.log(`${out}-${name}.png  ${st}`);
}
b.close();

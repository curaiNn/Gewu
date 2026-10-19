# 自查工具

需要 Node 22+（自带 WebSocket）和本机 Google Chrome（路径不同时用环境变量 `CHROME` 指定）；拼图用 Python 的 PIL。浏览器以无头模式启动，屏蔽 Google 字体，模拟国内网络。

| 脚本 | 用途 | 用法 |
|---|---|---|
| `smoke.mjs` | 实际播放检查：逐个模式、逐个预设点「发射」，报告 JS 报错、横向溢出、状态条位置 | `node tools/smoke.mjs 360 1 EM-ACG-02,MEC-MOM-03`（宽度、0 浅 / 1 深、页面编号或 `all`） |
| `readout.mjs` | 打印指定参数、指定时刻的读数；`--regress` 对比新旧两版的读数 | `node tools/readout.mjs MEC-MOM-03 '[[{"scene":"arc"},5]]'`；`node tools/readout.mjs MEC-MOM-03 --regress /path/旧版.html` |
| `simshot.mjs` | 确定性截图：按 0.5 ms 步长推进到指定时刻再画，截取画布 | `node tools/simshot.mjs EM-ACG-02 /tmp/acg 760 0 '[["load",{"mode":"load"},10]]'` |
| `montage.py` | 把多张截图拼成一张 | `python3 -I tools/montage.py out.png 3 a.png b.png c.png` |
| `shared.py` | 共用代码（CSS、FIG、通用引擎）与 `template.html` 逐字节比对 | `python3 -I tools/shared.py` |

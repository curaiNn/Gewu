# 格物 Gewu · 协作约定（给 AI 助手）

项目说明、生产流水线（S1–S6）、母题卡模板、页面与画风规范都在 [`project-instructions.md`](project-instructions.md)，母题总表在 [`index.md`](index.md)。本文件只记录协作上的约定。

## 发布（部署）
- 「发布」指部署到自建服务器 **http://8.133.160.230/**（阿里云上海，nginx，站点根目录 `/var/www/gewu`，root 公钥登录）。claude.ai 上早期的 Artifact 不再同步。
- 只上传 `index.html` 和各母题页 `{编号}.html`；`.md`、`survey/`、`template.html` 不上传。
- 步骤：
  ```bash
  rsync -az index.html <页面>.html root@8.133.160.230:/var/www/gewu/
  ssh root@8.133.160.230 'chmod 644 /var/www/gewu/*.html && chown root:root /var/www/gewu/*.html'
  ```
  上传后用 curl 确认每个页面返回 200，且内容与本地一致。
- 入口页的卡片只能链接已经上线的页面；页面还没做完时，部署用临时去掉对应卡片的入口页，不改本地文件。
- **每次发布完，都把访问地址发给用户**：入口 http://8.133.160.230/ ，以及本次新增或更新的每个页面 `http://8.133.160.230/{编号}.html`。

## 代码仓
- 物理母题的工作提交到 `main`。目录可能被别的会话共用（如化学会话的 `chm-eql-01` 分支），开工和提交前先 `git branch --show-current` 确认分支。
- 提交、推送只在用户要求时做。

## 页面质量
- 页面基于 `template.html`，只替换数据 JSON 与 SIM 模块；CSS、通用渲染引擎、FIG 线稿工具在所有页面里逐字节一致，改动要同步到全部页面。
- 改了共用代码或物理后，做读数回归（新旧版本同参数同时刻的 readouts 对比）和全部预设的实际播放检查（桌面与 360px 手机宽度、浅色与深色）。

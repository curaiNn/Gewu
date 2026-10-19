"""共用代码一致性检查：python3 -I tools/shared.py [页面...]（默认全部母题页）
比较 CSS（<style> 内）、FIG（线稿工具段）、通用渲染引擎段与 template.html 是否逐字节一致。"""
import glob, hashlib, os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def parts(path):
    s = open(path, encoding='utf-8').read()
    css = s[s.index('<style>'):s.index('</style>')]
    fig = s[s.index('/* ================= 线稿绘图工具 FIG'):s.index('/* ================= SIM 模块')]
    eng = s[s.index('/* ================= 通用渲染引擎'):s.rindex('</script>')]
    return {k: hashlib.md5(v.encode()).hexdigest()[:8] for k, v in (('CSS', css), ('FIG', fig), ('引擎', eng))}

ref = parts(os.path.join(root, 'template.html'))
pages = sys.argv[1:] or sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(root, '*.html'))
                              if re.fullmatch(r'[A-Z]{2,3}-[A-Z]{3}-\d\d', os.path.basename(p)[:-5]))
print('template', ref)
bad = 0
for pg in pages:
    h = parts(os.path.join(root, pg + '.html'))
    diff = [k for k in ref if h[k] != ref[k]]
    bad += bool(diff)
    print(f'{pg:11} {"一致" if not diff else "不一致: " + "、".join(diff)}')
sys.exit(1 if bad else 0)

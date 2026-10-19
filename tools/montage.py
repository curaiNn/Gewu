"""拼图：python3 -I tools/montage.py <输出.png> <列数> <图1> <图2> ..."""
import sys
from PIL import Image

out, cols, *files = sys.argv[1:]
cols = int(cols)
ims = [Image.open(f).convert('RGB') for f in files]
w = max(i.width for i in ims)
h = max(i.height for i in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), (200, 200, 200))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * (w + 8), (k // cols) * (h + 8)))
sheet.thumbnail((1600, 1600))
sheet.save(out)

import os
src='src'
import base64
head=open(f'{src}/head.html').read(); body=open(f'{src}/body.html').read()
def uri(p,m): return f'data:{m};base64,'+base64.b64encode(open(p,'rb').read()).decode()
SUB={'%%ICON180%%':uri('brand/icon-180.png','image/png'),'%%ICON32%%':uri('brand/icon-32.png','image/png'),'%%COVER%%':uri('brand/cover-raw.jpg','image/jpeg')}
for k,v in SUB.items(): head=head.replace(k,v); body=body.replace(k,v)
three=open('vendor/three.min.js').read()
assert '</script' not in three.lower()
js='\n'.join(open(f'{src}/{f}').read() for f in sorted(os.listdir(src)) if f.endswith('.js'))
assert '</script' not in js.lower()
scripts=f'<script>{three}</script>\n<script>\n(function(){{\n{js}\n}})();\n</script>'

open('index.html','w').write(f'<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n{head}</head><body>\n{body}\n{scripts}\n</body></html>')


print('ok', os.path.getsize('index.html'))

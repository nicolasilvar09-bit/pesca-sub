# Gera o index.html (arquivo único) juntando src/head.html, src/body.html, o Three.js e os módulos src/*.js em ordem.
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(ROOT, 'src')
head = open(f'{src}/head.html', encoding='utf-8').read()
body = open(f'{src}/body.html', encoding='utf-8').read()
three = open(os.path.join(ROOT, 'vendor/three.min.js'), encoding='utf-8').read()
assert '</script' not in three.lower()
js = '\n'.join(open(f'{src}/{f}', encoding='utf-8').read() for f in sorted(os.listdir(src)) if f.endswith('.js'))
assert '</script' not in js.lower()
# o setTimeout deixa a tela de carregamento aparecer antes de montar a ilha
scripts = f'<script>{three}</script>\n<script>\nsetTimeout(function(){{\n{js}\n}}, 30);\n</script>'
out = f'<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n{head}</head><body>\n{body}\n{scripts}\n</body></html>\n'
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)
print('ok', os.path.getsize(os.path.join(ROOT, 'index.html')))

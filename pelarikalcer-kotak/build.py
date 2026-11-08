import subprocess, os, pathlib
D = pathlib.Path(__file__).parent
env = dict(os.environ, NODE_PATH=str(D.parent / 'pelarikalcer' / 'node_modules'))
subprocess.run([str(D.parent / 'pelarikalcer/node_modules/.bin/esbuild'), 'src/main.js', '--bundle', '--minify', '--format=iife', '--outfile=dist/main.js'], cwd=D, env=env, check=True)
js = (D / 'dist/main.js').read_text().replace('</script', '<\\/script')
html = (D / 'src/template.html').read_text().replace('/*KODE*/', js)
(D / 'dist/index.html').write_text(html)
out = D.parent / 'public' / 'pelarikalcer'; out.mkdir(exist_ok=True); (out / 'index.html').write_text(html)
art = html.split('<head>', 1)[1].split('</head>', 1)[0]
body = html.split('<body>', 1)[1].rsplit('</body>', 1)[0]
head_clean = art.replace('<meta charset="utf-8">', '').replace('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">', '')
(D / 'dist/artifact.html').write_text(head_clean + body)
print('ok', len(html) // 1024, 'KB')

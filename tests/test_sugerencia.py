import subprocess, os, threading, http.server, functools, json
from playwright.sync_api import sync_playwright
# Prueba automática (Playwright + Chromium) con datos SINTÉTICOS. Ejecutar: python tests/run_all.py
import tempfile
SP = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(SP, '..'))
OUT = os.environ.get('TEST_OUT') or tempfile.mkdtemp(prefix='f7tests-')

DATA=subprocess.check_output(['node',os.path.join(SP,'datos_sinteticos.js')]).decode()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1', 0),functools.partial(Q,directory=SITE)); threading.Thread(target=srv.serve_forever,daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]; res=[]
with sync_playwright() as p:
    br=p.chromium.launch(); pg=br.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B+'/'); pg.evaluate('d=>localStorage.setItem("f7minutos.club.v2",d)',DATA); pg.reload(); pg.wait_for_timeout(500)
    pg.click('nav [data-id=setup]'); pg.click('button[data-a=start]'); pg.wait_for_timeout(300)
    t=pg.inner_text('#app'); res.append(('Prebenjamín sin sugerencia ni chips', '💡' not in t and 'Equilibrado' in t and pg.locator('button[data-a=sug]').count()==0))
    pg.click('button[data-a=team][data-id=ale]'); pg.click('nav [data-id=setup]'); pg.wait_for_timeout(200); pg.click('button[data-a=start]'); pg.wait_for_timeout(300)
    t=pg.inner_text('#app'); res.append(('Alevín con recordatorio formativo sin chips', '💡' in t and 'arriesgar' not in t and pg.locator('button[data-a=sug]').count()==0))
    print([l for l in t.split('\n') if '💡' in l])
    res.append(('sin errores JS', not errs))
    br.close()
srv.shutdown()
for n,o in res: print(('OK   ' if o else 'FALLO'),n)
import sys; sys.exit(0 if all(o for _,o in res) else 1)

import subprocess, sys, os, threading, http.server, functools
from playwright.sync_api import sync_playwright
# Prueba automática (Playwright + Chromium) con datos SINTÉTICOS. Ejecutar: python tests/run_all.py
import tempfile
SP = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(SP, '..'))
OUT = os.environ.get('TEST_OUT') or tempfile.mkdtemp(prefix='f7tests-')

DATA = subprocess.check_output(['node', os.path.join(SP, 'datos_sinteticos.js')]).decode()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=SITE))
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d' % srv.server_address[1]; fails = []
def ok(c, m):
    print(('OK   ' if c else 'FALLO') + ' ' + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, service_workers='allow')
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(B + '/'); pg.evaluate('d=>localStorage.setItem("f7minutos.club.v2",d)', DATA); pg.reload(); pg.wait_for_timeout(1200)
    src0 = pg.evaluate('localStorage.getItem("f7minutos.club.v2")')
    btn = pg.locator('header a[data-a=ftms]')
    ok(btn.count() == 1 and btn.is_visible(), 'botón FTMS visible en la cabecera de la app de minutos')
    pg.screenshot(path=OUT + '/n1_minutos.png', clip={'x': 0, 'y': 0, 'width': 390, 'height': 200})
    btn.click(); pg.wait_for_url('**/ftms/'); pg.wait_for_timeout(800)
    ok('Conectado a la app de minutos' in pg.inner_text('#app'), 'FTMS abre y está conectado')
    pg.screenshot(path=OUT + '/n2_ftms.png', clip={'x': 0, 'y': 0, 'width': 390, 'height': 200})
    pg.click('header a.hbtn'); pg.wait_for_timeout(1000)
    ok(pg.url.rstrip('/') == B and pg.locator('header a[data-a=ftms]').count() == 1, 'botón Minutos vuelve a la app de minutos (' + pg.url + ')')
    # partido en marcha: pide confirmación
    pg.click('nav [data-id=setup]'); pg.wait_for_timeout(200)
    pg.click('button[data-a=start]'); pg.wait_for_timeout(200); pg.click('button[data-a=play]'); pg.wait_for_timeout(300)
    msgs = []
    pg.once('dialog', lambda d: (msgs.append(d.message), d.dismiss()))
    pg.click('header a[data-a=ftms]'); pg.wait_for_timeout(500)
    ok(msgs and 'partido en marcha' in msgs[0] and '/ftms' not in pg.url, 'con partido en marcha pide confirmación y Cancelar se queda')
    pg.once('dialog', lambda d: d.accept())
    pg.click('header a[data-a=ftms]'); pg.wait_for_url('**/ftms/'); pg.wait_for_timeout(600)
    ok('partido en curso' in pg.inner_text('#app'), 'FTMS avisa de que hay un partido en curso')
    pg.click('header a.hbtn'); pg.wait_for_timeout(800)
    ok(pg.evaluate('JSON.parse(localStorage.getItem("f7minutos.club.v2")).teams.pre.match.running') is True, 'el partido sigue en marcha al volver')
    # cachés y sin conexión
    pg.wait_for_timeout(1000)
    keys = pg.evaluate('caches.keys()')
    ok(any(k.startswith('f7-') and k!='f7-fonts' for k in keys) and any(k.startswith('ftms-') for k in keys), 'conviven las cachés de las dos apps ' + str(keys))
    ctx.set_offline(True)
    pg.goto(B + '/ftms/'); pg.wait_for_timeout(800)
    ok('Conectado a la app de minutos' in pg.inner_text('#app'), 'sin conexión: abre el FTMS')
    pg.click('header a.hbtn'); pg.wait_for_timeout(800)
    ok(pg.locator('header a[data-a=ftms]').count() == 1, 'sin conexión: vuelve a la app de minutos')
    ctx.set_offline(False)
    ok(not errs, 'sin errores de JavaScript ' + str(errs[:3]))
    br.close()
srv.shutdown()
print('\nRESULTADO:', 'TODO OK' if not fails else f'{len(fails)} FALLOS'); sys.exit(1 if fails else 0)

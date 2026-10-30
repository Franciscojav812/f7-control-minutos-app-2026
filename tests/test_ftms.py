import json, subprocess, sys, os, time, threading, http.server, functools
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
B = 'http://127.0.0.1:%d' % srv.server_address[1]
fails = []
def ok(c, m):
    print(('OK   ' if c else 'FALLO') + ' ' + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True, permissions=['clipboard-read', 'clipboard-write'])
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append(m.text))
    # 1) app de minutos con datos sintéticos
    pg.goto(B + '/'); pg.evaluate('d=>localStorage.setItem("f7minutos.club.v2",d)', DATA); pg.reload(); pg.wait_for_timeout(500)
    src0 = pg.evaluate('localStorage.getItem("f7minutos.club.v2")')
    ok('Historial' in pg.inner_text('body') or 'Partidos' in pg.inner_text('body'), 'la app de minutos carga los datos sintéticos')
    # 2) FTMS sin barra final -> redirección
    pg.goto(B + '/ftms'); pg.wait_for_timeout(600)
    ok(pg.url.endswith('/ftms/'), 'redirige /ftms a /ftms/ (' + pg.url + ')')
    t = pg.inner_text('#app')
    ok('Conectado a la app de minutos' in t, 'conector en modo directo')
    ok('5 partidos' in t, 'cuenta los partidos de los dos equipos')
    pg.screenshot(path=OUT + '/s1_inicio.png', full_page=True)
    # 3) post-partido del partido con goleada en contra (P3, Rival Este)
    pg.click('nav [data-id=post]'); pg.wait_for_timeout(200)
    ok(pg.locator('text=Pendiente').count() == 5, '5 partidos pendientes de formulario')
    pg.click('button[data-a=open]:has-text("Rival Este")'); pg.wait_for_timeout(200)
    t = pg.inner_text('#app')
    ok('Goles tras perder el balón' in t, 'regla de transición defensiva sin formulario')
    ok('♟️' not in t and 'Objetivo de la semana' in t, 'Prebenjamín: un objetivo y sin ajuste de sistema')
    # rellenar formulario
    for i in range(3):
        pg.locator('button[data-a=gset][data-k=zona][data-v=Centro]').nth(i).click(); pg.wait_for_timeout(80)
    pg.locator('button[data-a=gset][data-k=perdida][data-v=Salida]').nth(0).click(); pg.wait_for_timeout(80)
    pg.locator('button[data-a=fset][data-k=perd][data-v="3-5"]').click(); pg.wait_for_timeout(80)
    pg.locator('button[data-a=fset][data-k=presion][data-v=Alta]').click(); pg.wait_for_timeout(80)
    pg.locator('button[data-a=fset][data-k="rat.final"][data-v="4"]').click(); pg.wait_for_timeout(80)
    pg.locator('button[data-a=fset][data-k="rat.actitud"][data-v="5"]').click(); pg.wait_for_timeout(80)
    pg.select_option('select[data-f=sisR]', '3-2-1'); pg.wait_for_timeout(80)
    pg.fill('textarea[data-f=nota]', 'Nota sintética de prueba'); pg.wait_for_timeout(80)
    t = pg.inner_text('#app')
    ok('Nos entran por el centro' in t, 'regla de zona central con el formulario')
    ok('Pérdidas en la salida' in t, 'regla de pérdidas en salida')
    ok(t.count('🏃 Tarea:') == 1 and 'Concepto UEFA C' in t, 'Prebenjamín: una ficha de tarea y concepto UEFA')
    ok('Solo para el entrenador' in t, 'sección de cuaderno del entrenador')
    pg.screenshot(path=OUT + '/s2_informe.png', full_page=True)
    # persistencia tras recargar
    pg.reload(); pg.wait_for_timeout(400)
    pg.click('nav [data-id=post]'); pg.wait_for_timeout(150)
    ok(pg.locator('text=Hecho').count() == 1, 'el formulario se guarda tras recargar')
    pg.click('button[data-a=open]:has-text("Rival Este")'); pg.wait_for_timeout(150)
    ok(pg.input_value('textarea[data-f=nota]') == 'Nota sintética de prueba', 'la nota se conserva')
    pg.click('button[data-a=copy]'); pg.wait_for_timeout(300)
    clip = pg.evaluate('navigator.clipboard.readText()')
    ok('OBJETIVO DE LA SEMANA' in clip and 'Rival Este' in clip and 'Tarea:' in clip, 'copiar charla al portapapeles'); print(clip)
    # 4) mejoras -> game plan
    pg.click('button[data-a=toPlan]'); pg.wait_for_timeout(200)
    vals = [pg.input_value(f'input[data-c="{i}"]') for i in range(3)]
    ok(sum(1 for v in vals if v) == 1, 'el objetivo pasa a las consignas del Game Plan')
    pg.fill('input[data-p=rival]', 'Rival Próximo'); pg.select_option('select[data-p=sis]', '3-2-1'); pg.wait_for_timeout(150)
    for i in range(7):
        pg.select_option(f'select[data-xi="{i}"]', f'p{i+1}'); pg.wait_for_timeout(60)
    pg.select_option('select[data-ab=cf]', 'p6'); pg.select_option('select[data-ab=m1]', 'p2')
    ok('repetido' not in pg.inner_text('#app'), 'alineación sin duplicados')
    pg.select_option('select[data-xi="6"]', 'p1'); pg.wait_for_timeout(100)
    ok('repetido' in pg.inner_text('#app'), 'avisa de jugador repetido')
    pg.select_option('select[data-xi="6"]', 'p7'); pg.wait_for_timeout(100)
    pg.screenshot(path=OUT + '/s3_plan.png', full_page=True)
    pg.click('button[data-a=match]'); pg.wait_for_timeout(250)
    ov = pg.inner_text('#over')
    ok('Rival Próximo' in ov and 'Consignas' in ov and 'Jugador' in ov, 'vista de partido con alineación y consignas')
    ok(pg.locator('#over .pl').count() == 7, 'vista de partido pinta 7 jugadores')
    pg.screenshot(path=OUT + '/s4_partido.png')
    pg.click('button[data-a=closeM]'); pg.wait_for_timeout(100)
    # 5) semáforo
    pg.click('nav [data-id=carga]'); pg.wait_for_timeout(200)
    t = pg.inner_text('#app')
    ok('Juega casi todo' in t and 'no mide carga física' in t, 'reparto marca rojo al que juega casi todo')
    ok('Pocos minutos' in t, 'semáforo marca azul al que juega poco')
    ok('Portero (juega todo)' in t, 'el portero no sale como sobrecarga')
    pg.screenshot(path=OUT + '/s5_carga.png', full_page=True)
    # 6) equipo Alevín
    pg.click('button[data-a=team][data-id=ale]'); pg.wait_for_timeout(150)
    ok('AB' in pg.inner_text('#app'), 'cambio a Alevín B muestra su plantilla')
    pg.click('nav [data-id=post]'); pg.click('button[data-a=open]:has-text("Rival Centro")'); pg.wait_for_timeout(150)
    t = pg.inner_text('#app')
    ok('Puntería' in t, 'regla de puntería (más tiros fuera que a puerta)')
    ok('Objetivos de la semana' in t and t.count('🏃 Tarea:') == 2 and '2-3-1 → 3-2-1' in t, 'Alevín: dos objetivos con ficha y ajuste 2-3-1 → 3-2-1')
    # 7) exportaciones
    pg.click('nav [data-id=inicio]'); pg.wait_for_timeout(150)
    for a, fn in [('expFt', 'ftms-copia.json'), ('csvPost', 'ftms-postpartido.csv'), ('csvGol', 'ftms-goles-contra.csv')]:
        with pg.expect_download() as d: pg.click(f'button[data-a={a}]')
        path = OUT + '/' + fn; d.value.save_as(path)
        ok(d.value.suggested_filename == fn and os.path.getsize(path) > 50, f'descarga {fn}')
    csvp = open(OUT + '/ftms-postpartido.csv', encoding='utf-8-sig').read()
    ok(csvp.splitlines()[0].startswith('equipo,partido_id,partido_n') and '1762209600000' in csvp, 'CSV post-partido con partido_id del Excel')
    # 8) la app de minutos NO se ha modificado
    src1 = pg.evaluate('localStorage.getItem("f7minutos.club.v2")')
    ok(src0 == src1, 'FTMS no modifica f7minutos.club.v2')
    # 9) importar copia FTMS en un navegador limpio + importar JSON de minutos
    ctx2 = br.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True); p2 = ctx2.new_page()
    p2.on('pageerror', lambda e: errs.append('ctx2 ' + str(e)))
    p2.goto(B + '/ftms/'); p2.wait_for_timeout(300)
    ok('No encuentro datos' in p2.inner_text('#app'), 'sin datos muestra instrucciones')
    open(OUT + '/minutos.json', 'w').write(json.dumps({'app': 'minutos-f7', 'version': 3, 'all': json.loads(DATA)}))
    with p2.expect_file_chooser() as fc: p2.click('button[data-a=impMin]')
    fc.value.set_files(OUT + '/minutos.json'); p2.wait_for_timeout(300)
    ok('Usando una copia importada' in p2.inner_text('#app'), 'importa la copia JSON de la app de minutos')
    p2.on('dialog', lambda d: d.accept())
    with p2.expect_file_chooser() as fc: p2.click('button[data-a=impFt]')
    fc.value.set_files(OUT + '/ftms-copia.json'); p2.wait_for_timeout(300)
    p2.click('nav [data-id=post]'); p2.wait_for_timeout(150)
    ok(p2.locator('text=Hecho').count() == 1, 'restaura la copia FTMS')
    # 10) app de minutos sigue funcionando tras usar FTMS
    pg.goto(B + '/'); pg.wait_for_timeout(500)
    ok(pg.evaluate('localStorage.getItem("f7minutos.club.v2")') is not None and 'Prebenjam' in pg.inner_text('body'), 'la app de minutos sigue cargando')
    ok(not errs, 'sin errores de JavaScript ' + (str(errs[:3]) if errs else ''))
    br.close()
srv.shutdown()
print('\nRESULTADO:', 'TODO OK' if not fails else f'{len(fails)} FALLOS')
sys.exit(1 if fails else 0)

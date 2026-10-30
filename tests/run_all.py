#!/usr/bin/env python3
"""Ejecuta todas las pruebas automáticas de Minutos F7 + FTMS.

Uso:   python tests/run_all.py
Requisitos:  pip install playwright   y   python -m playwright install chromium
             Node.js (para comprobar la sintaxis del JavaScript)
Todas las pruebas usan datos SINTÉTICOS (tests/datos_sinteticos.js): nunca datos reales de jugadores.
"""
import os, re, subprocess, sys, tempfile
T = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(T, '..'))
fallos = []
def paso(nombre, ok, detalle=''):
    print(('OK   ' if ok else 'FALLO') + ' ' + nombre + (('\n' + detalle) if (detalle and not ok) else ''))
    if not ok: fallos.append(nombre)

print('== Sintaxis del JavaScript')
tmp = tempfile.mkdtemp(prefix='f7sint-')
html = open(os.path.join(R, 'ftms', 'index.html'), encoding='utf-8').read()
for i, sc in enumerate(re.findall(r'<script>(.*?)</script>', html, re.S)):
    open(os.path.join(tmp, f'ftms_{i}.js'), 'w', encoding='utf-8').write(sc)
archivos = [os.path.join(R, 'app.js'), os.path.join(R, 'sw.js'), os.path.join(R, 'ftms', 'sw.js')] + [os.path.join(tmp, f) for f in sorted(os.listdir(tmp))]
for f in archivos:
    r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
    paso('node --check ' + os.path.relpath(f, R) if f.startswith(R) else 'node --check ftms/index.html (' + os.path.basename(f) + ')', r.returncode == 0, r.stderr)

for t in ['test_ftms.py', 'test_navegacion.py', 'test_ejercicios.py', 'test_sugerencia.py']:
    print('\n== ' + t)
    r = subprocess.run([sys.executable, os.path.join(T, t)], capture_output=True, text=True)
    print(r.stdout.strip()[-6000:])
    paso(t, r.returncode == 0, r.stderr[-3000:])

print('\nRESULTADO GLOBAL:', 'TODO OK' if not fallos else f'{len(fallos)} FALLOS: ' + ', '.join(fallos))
sys.exit(1 if fallos else 0)

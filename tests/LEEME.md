# Pruebas automáticas

Comprueban las dos apps (Minutos F7 y FTMS) en un navegador real (Chromium) con **datos inventados**
(`datos_sinteticos.js`). Nunca uses aquí datos reales de jugadores: son menores.

## Ejecutarlas en tu ordenador

```bash
pip install playwright pillow
python -m playwright install chromium
python tests/run_all.py
```

Necesitas también Node.js (para comprobar la sintaxis del JavaScript).
Al final verás `RESULTADO GLOBAL: TODO OK` o la lista de lo que ha fallado.

## En GitHub

Cada vez que se sube un cambio a `main`, GitHub Actions ejecuta estas mismas pruebas
(pestaña **Actions** del repositorio). Si algo se rompe, aparece una cruz roja en el commit.

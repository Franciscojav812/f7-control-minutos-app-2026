# Pruebas automáticas

Comprueban las dos partes de Banquillo (Minutos y Táctica, antes FTMS) en un navegador real (Chromium) con **datos inventados**
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

## Qué cubre cada archivo

| Archivo | Qué comprueba |
| --- | --- |
| `test_ftms.py` | Táctica: lectura de datos, post-partido, informe, Game Plan, reparto |
| `test_navegacion.py` | Botones para pasar de Minutos a Táctica y vuelta, cachés |
| `test_ejercicios.py` | Ejercicios: lista, filtros, ficha, animación, ejercicios propios |
| `test_sugerencia.py` | Recordatorios formativos por categoría |
| `test_equipos.py` | Equipos configurables y fútbol 11 (exportación incluida) |
| `test_clubes_offline.py` | Nombre y logo, clubs con escudo, y uso completo **sin conexión** |

// Datos SINTÉTICOS con la estructura de f7minutos.club.v2 (nombres inventados)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const POS = ['Portero','DFC','DFC','LI','LD','MC','MC','DC','ED','EI','DC','MC','DFC','DC','MC'];
function team(n, half, pfx) {
  const players = Array.from({ length: n }, (_, i) => ({ id: 'p' + (i + 1), name: `Jugador ${String(i + 1).padStart(2, '0')} ${pfx}`, pos: POS[i] || 'MC', conv: true }));
  const history = [];
  const plan = [
    { rival: 'Rival Norte', form: '3-2-1', gf: 3, gc: 1, causas: ['Balón parado'] },
    { rival: 'Rival Sur', form: '3-2-1', gf: 1, gc: 1, causas: ['Error defensivo'] },
    { rival: 'Rival Este', form: '2-2-2', gf: 2, gc: 4, causas: ['Pérdida de balón', 'Contraataque', 'Pérdida de balón', 'Balón parado'] },
    { rival: 'Rival Oeste', form: '3-1-2', gf: 0, gc: 0, causas: [] },
    { rival: 'Rival Centro', form: '2-3-1', gf: 1, gc: 3, causas: ['Pérdida de balón', 'Pérdida de balón', 'Contraataque'] },
  ];
  plan.forEach((P, gi) => {
    const total = half * 2 * 60000 + Math.round(rnd() * 120000);
    const roster = players.filter((p, i) => !(gi === 3 && i === n - 1)); // uno no convocado en P4
    const fieldMs = (total * 6) / (roster.length - 1);
    const ps = roster.map((p, i) => {
      let ms = i === 0 ? total : Math.max(0, Math.round(fieldMs + (rnd() - 0.5) * 8 * 60000));
      if (i === 1) ms = Math.round(total * 0.97);           // siempre juega casi todo -> rojo
      if (i === roster.length - 1) ms = Math.round(total * 0.1); // pocos minutos -> azul
      return { id: p.id, name: p.name, pos: p.pos, posMs: { [p.pos]: ms }, ms, titular: i < 7 };
    });
    const acts = []; let t = 30000;
    const on = roster.slice(0, 7).map(p => p.id);
    const mk = (lado, res, extra) => { t += 60000 + Math.round(rnd() * 120000); const min = Math.floor(t / 60000) + 1;
      const part = min <= half ? 1 : 2; acts.push({ k: 'tiro', t, part, min: Math.min(min, half * 2), add: 0, lado, res, on, form: P.form, ...extra }); };
    for (let i = 0; i < P.gf; i++) mk('favor', 'gol', { autor: on[6], asist: on[5], orig: i === 0 ? 'Córner' : 'Jugada', pen: false });
    P.causas.forEach(c => mk('contra', 'gol', { por: on[0], orig: c, pen: false }));
    for (let i = 0; i < 3; i++) mk('favor', 'parada', { autor: on[5] });
    for (let i = 0; i < (gi === 4 ? 5 : 2); i++) mk('favor', 'fuera', { autor: on[4] });
    for (let i = 0; i < 3; i++) mk('contra', 'parada', { por: on[0] });
    acts.push({ k: 'corner', lado: 'contra', t: t + 1, part: 2, min: half * 2 - 1, add: 0, on, form: P.form });
    acts.push({ k: 'ocasion', lado: 'contra', t: t + 2, part: 2, min: half * 2 - 1, add: 0, on, form: P.form });
    history.push({ id: 1761000000000 + gi * 604800000, date: new Date(Date.UTC(2026, 9, 3 + gi * 7, 11)).toISOString(), rival: P.rival, jornada: String(gi + 1),
      comp: 'Liga', loc: gi % 2 ? 'Visitante' : 'Local', notes: {}, total, half, gf: P.gf, gc: P.gc, add1: 0, add2: 0, sis: P.form, sg: [{ f: P.form, ms: total }],
      players: ps, events: [], acts });
  });
  return { players, starters: players.slice(0, 7).map(p => p.id), match: null, history, nid: n + 1, form: '3-2-1', minMin: 0, runMin: 10 };
}
const ALL = { cur: 'pre', tab: 'hist', teams: { pre: team(15, 20, 'PA'), ale: team(11, 25, 'AB') }, set: { auto: false, lastBak: 0 }, ver: 3 };
process.stdout.write(JSON.stringify(ALL));

// Runs the ORIGINAL trimsheet.js in a stub DOM and compares its output to calc.js.
const fs = require('fs'), vm = require('vm'), path = require('path');
const WB = require('../public/calc.js');
const src = fs.readFileSync(path.join(__dirname, '../_orig/trimsheet.js'), 'utf8');
function el() { return { innerHTML: '', innerText: '', value: '', classList: { add(){}, remove(){}, toggle(){} },
  addEventListener(){}, firstElementChild: { innerText: 'VT - X', innerHTML: '' }, nextElementSibling: {} }; }
const els = {}; const limits = el();
const document = { querySelector: s => s === '#limits' ? limits : (els[s] = els[s] || el()), querySelectorAll: () => [] };
const ctx = vm.createContext({ document, console, Object, parseFloat });
vm.runInContext(src + `
;globalThis.__run = (i, f, p, c) => { ffuel.value = f; ppicweight.value = p; ccoweight.value = c; document.querySelector("#limits").innerHTML = "Yes"; outdedo(i + 1);
  return { html: output.innerHTML, limits: document.querySelector('#limits').innerHTML }; };
globalThis.__keys = Object.keys(aircrafts);`, ctx);

let n = 0, fail = 0;
const nums = h => (h.replace(/<[^>]+>/g, ' ').match(/-?\d+\.\d+/g) || []);
const cases = [];
for (const f of [20, 60, 100, 120, 150, 168, 200]) for (const p of [55, 75, 95]) for (const c of [0, 60, 90]) cases.push([f, p, c]);
for (let i = 0; i < 200; i++) cases.push([+(Math.random()*200+1).toFixed(1), +(Math.random()*70+45).toFixed(1), Math.random()<.3?0:+(Math.random()*70+45).toFixed(1)]);
ctx.__keys.forEach((k, i) => { if (!WB.find(k)) { console.log('skip (removed):', k); return; }
  for (const [f, p, c] of cases) {
    const o = ctx.__run(i, f, p, c);
    const ac = WB.find(k); const r = WB.compute(k === 'tlb' ? Object.assign({}, ac, { taxi: 0 }) : ac, f, p, c); // original had no TLB taxi
    const on = nums(o.html);
    // Original: weight/arm/moment numbers. Check take-off weight, moment, CG and lbs appear identically.
    const want = [r.takeoff.w.toFixed(2), r.takeoff.m.toFixed(2), r.takeoff.cg.toFixed(2), r.takeoff.cg.toFixed(3), r.fuelKg.toFixed(2)];
    if (k !== 'tlb') want.push(r.ramp.w.toFixed(2), r.ramp.m.toFixed(2), r.takeoff.lb.toFixed(2), r.taxi.m.toFixed(2));
    n++;
    const miss = want.filter(w => !on.includes(w));
    if (miss.length) { fail++; if (fail < 10) console.log('MISMATCH', k, f, p, c, miss); }
  }
});
console.log(`${n} cases, ${fail} mismatches`);
// Show where original limit text disagrees with correct check
let ld = 0; ctx.__keys.forEach((k,i)=>{ if (!WB.find(k)) return; for (const [f,p,c] of cases){ const o=ctx.__run(i,f,p,c); const a=WB.find(k); const r=WB.compute(k==='tlb'?Object.assign({},a,{taxi:0}):a,f,p,c);
  if ((o.limits.toUpperCase()==='YES') !== r.withinLimits) { ld++; if (ld<6) console.log('limit diff', k,f,p,c,'orig',o.limits,'cg',r.takeoff.cg.toFixed(2)); } }});
console.log('limit-verdict differences:', ld);
// VT-RUM sample
const s = WB.compute('RUM', 120, 75, 70); console.log('RUM 120L/75/70:', s.takeoff.w.toFixed(2), 'kg CG', s.takeoff.cg.toFixed(2), s.withinLimits);
const t = WB.compute('TLB', 300, 80, 0); console.log('TLB 300L/80/0 (taxi 5):', t.ramp.w.toFixed(2), '->', t.takeoff.w.toFixed(2), 'kg CG', t.takeoff.cg.toFixed(2));
process.exit(fail ? 1 : 0);

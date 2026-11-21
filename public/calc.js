/* Carver Aviation W&B — pure calculation module (browser global + Node export).
 * Units follow the original Trimsheet app: weights in kg, arms in inches,
 * fuel entered in litres and converted at 0.72 kg/L, lbs = kg × 2.2.
 */
(function (root) {
  'use strict';

  var FUEL_DENSITY = 0.72; // kg per litre
  var KG_TO_LB = 2.2;

  // Aircraft types (station arms + CG limits), from the original app.
  var TYPES = {
    c172: {
      fuelArm: 48,
      frontSeatArm: 37,
      cgMin: 35.0,
      cgMax: 47.3,
      limitText: 'CG limit range: 35.0 to 47.3 in aft of datum',
      // Unused stations shown on the sheet for completeness.
      extraStations: [
        { name: 'Rear passengers', arm: 73 },
        { name: 'Baggage area 1', arm: 95 },
        { name: 'Baggage area 2', arm: 123 }
      ]
    },
    tlb: {
      fuelArm: 30.32,
      frontSeatArm: -37.4,
      cgMin: 12.6,
      cgMax: 18.92,
      limitText: 'CG limit FWD 0.320 m (12.6 in), AFT 0.481 m (18.92 in)',
      extraStations: [
        { name: 'Seat 3', arm: -5.75 },
        { name: 'Seat 4', arm: -5.75 },
        { name: 'Seat 5', arm: 34.13 },
        { name: 'Seat 6', arm: 34.13 },
        { name: 'Seat 7', arm: 34.13 },
        { name: 'Baggage (max 400 lb)', arm: 60.7 }
      ]
    }
  };

  // Fleet. bem = basic empty weight (kg), arm = BEM CG arm (in), taxi = start/taxi fuel (kg).
  var AIRCRAFT = [
    { reg: 'TNT', bem: 760.81, arm: 40.02, taxi: 3.8, type: 'c172' },
    { reg: 'FTV', bem: 765.00, arm: 39.49, taxi: 3.8, type: 'c172' },
    { reg: 'LEO', bem: 764.00, arm: 40.18, taxi: 3.8, type: 'c172' },
    { reg: 'ICE', bem: 765.00, arm: 39.22, taxi: 3.0, type: 'c172' },
    { reg: 'HOT', bem: 717.00, arm: 41.73, taxi: 3.0, type: 'c172' },
    { reg: 'AAG', bem: 760.90, arm: 43.87, taxi: 3.8, type: 'c172' },
    { reg: 'AAL', bem: 766.50, arm: 43.06, taxi: 3.8, type: 'c172' },
    { reg: 'RUM', bem: 758.16, arm: 43.03, taxi: 3.8, type: 'c172' },
    { reg: 'TLB', bem: 1419.20, arm: 14.95, taxi: 5, type: 'tlb' } // taxi 5 kg per Carver (original app used 0)
  ];

  function find(reg) {
    reg = String(reg || '').toUpperCase().replace(/^VT-?/, '');
    for (var i = 0; i < AIRCRAFT.length; i++) if (AIRCRAFT[i].reg === reg) return AIRCRAFT[i];
    return null;
  }

  /**
   * compute(reg, fuelLitres, picKg, copilotKg) -> load sheet object.
   * Mirrors the original app: ramp = BEM + fuel + PIC + co-pilot;
   * take-off = ramp − taxi fuel (taxi at fuel arm).
   */
  function compute(reg, fuelL, pic, co) {
    var ac = typeof reg === 'object' ? reg : find(reg);
    if (!ac) throw new Error('Unknown aircraft ' + reg);
    var t = TYPES[ac.type];
    fuelL = +fuelL || 0; pic = +pic || 0; co = +co || 0;

    var fuel = fuelL * FUEL_DENSITY;
    var bemMoment = ac.bem * ac.arm;
    var rows = [
      { name: 'Basic empty weight', w: ac.bem, arm: ac.arm, m: bemMoment },
      { name: 'Usable fuel', w: fuel, arm: t.fuelArm, m: fuel * t.fuelArm },
      { name: 'Pilot (PIC)', w: pic, arm: t.frontSeatArm, m: pic * t.frontSeatArm },
      { name: 'Co-pilot (student)', w: co, arm: t.frontSeatArm, m: co * t.frontSeatArm }
    ];
    t.extraStations.forEach(function (s) {
      rows.push({ name: s.name, w: null, arm: s.arm, m: null });
    });

    var rampW = ac.bem + fuel + pic + co;
    var rampM = bemMoment + fuel * t.fuelArm + pic * t.frontSeatArm + co * t.frontSeatArm; // same op order as original
    var taxiM = ac.taxi * t.fuelArm;
    var towW = rampW - ac.taxi;
    var towM = rampM - taxiM;
    var cg = towM / towW;

    return {
      aircraft: ac,
      type: t,
      fuelL: fuelL,
      fuelKg: fuel,
      rows: rows,
      ramp: { w: rampW, m: rampM, cg: rampM / rampW },
      taxi: { w: ac.taxi, arm: t.fuelArm, m: taxiM },
      takeoff: { w: towW, m: towM, cg: cg, lb: towW * KG_TO_LB },
      withinLimits: cg >= t.cgMin && cg <= t.cgMax
    };
  }

  var api = { AIRCRAFT: AIRCRAFT, TYPES: TYPES, FUEL_DENSITY: FUEL_DENSITY, KG_TO_LB: KG_TO_LB, find: find, compute: compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WB = api;
})(this);

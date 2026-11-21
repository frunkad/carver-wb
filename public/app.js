(function () {
  'use strict';
  var WB = window.WB;
  var $ = function (id) { return document.getElementById(id); };
  var f2 = function (n) { return n.toFixed(2); };
  var store = {
    get: function (k) { try { return localStorage.getItem('wb.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('wb.' + k, v); } catch (e) {} }
  };

  var selected = null;
  var fuel = $('fuel'), pic = $('pic'), co = $('co');

  // Fleet buttons
  var fleet = $('fleet');
  WB.AIRCRAFT.forEach(function (ac) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ac';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.dataset.reg = ac.reg;
    b.innerHTML = '<span class="pre">VT-</span>' + ac.reg;
    b.addEventListener('click', function () { select(ac.reg, true); });
    fleet.appendChild(b);
  });

  function select(reg, focusNext) {
    selected = WB.find(reg);
    Array.prototype.forEach.call(fleet.children, function (b) {
      b.setAttribute('aria-checked', String(b.dataset.reg === reg));
    });
    store.set('reg', reg);
    update();
    if (focusNext && !fuel.value) fuel.focus();
  }

  function num(el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; }

  function update() {
    var fl = num(fuel), p = num(pic), c = num(co);
    $('fuelErr').textContent = fuel.value && !fl ? 'Enter fuel in litres' : '';
    var SEAT_SANE = 200;
    $('picErr').textContent = pic.value && !p ? 'Enter pilot weight' : p > SEAT_SANE ? 'Check weight: over ' + SEAT_SANE + ' kg' : '';
    $('coErr').textContent = c > SEAT_SANE ? 'Check weight: over ' + SEAT_SANE + ' kg' : '';
    var ready = selected && fl && p;
    $('hint').hidden = !!ready;
    $('result').hidden = !ready;
    if (!ready) return;

    var r = WB.compute(selected, fl, p, c);
    var t = r.type, ac = r.aircraft;

    var st = $('status');
    var msgs = [];
    if (!r.cgOk) msgs.push('✕ CG OUT OF LIMITS');
    if (r.overRamp > 0) msgs.push('✕ OVER MAX RAMP by ' + f2(r.overRamp) + ' kg');
    if (r.weightOk === false) msgs.push('✕ OVER MTOW by ' + f2(r.overMtow) + ' kg');
    if (r.overMzfw > 0) msgs.push('✕ OVER MZFW by ' + f2(r.overMzfw) + ' kg');
    if (!msgs.length) msgs.push('✓ CG within limits');
    st.className = 'status ' + (r.withinLimits ? 'ok' : 'bad');
    st.innerHTML = '<b>VT-' + ac.reg + '</b><span>' + msgs.join('<br>') + '</span>';
    var wl = $('weightLimits');
    function card(label, limit, over, okText) {
      var bad = over > 0;
      return '<div class="' + (bad ? 'bad' : 'ok') + '"><span>' + label + '</span><b>' + f2(limit) + ' kg</b><em>' +
        (bad ? 'over by ' + f2(over) + ' kg' : okText) + '</em></div>';
    }
    if (r.mtow) {
      wl.className = 'wlimits';
      var h = '';
      if (r.maxRamp) h += card('Max ramp', r.maxRamp, r.overRamp, f2(-r.overRamp) + ' kg margin');
      h += card('MTOW', r.mtow, r.overMtow, f2(-r.overMtow) + ' kg margin');
      h += '<div class="' + (r.minBurnForMlw > 0 ? 'warn' : 'ok') + '"><span>MLW</span><b>' + f2(r.mlw) + ' kg</b><em>' +
        (r.minBurnForMlw > 0 ? 'burn ≥ ' + f2(r.minBurnForMlw) + ' kg before landing' : 'TOW ≤ MLW') + '</em></div>';
      if (r.mzfw) h += card('MZFW', r.mzfw, r.overMzfw, 'ZFW ' + f2(r.zfw) + ' kg');
      wl.innerHTML = h;
    } else {
      wl.className = 'wlimits na';
      wl.innerHTML = '<div><span>MTOW / MLW</span><b>not set</b><em>weight not checked for this aircraft</em></div>';
    }
    $('kTow').innerHTML = f2(r.takeoff.w) + ' kg<small>' + f2(r.takeoff.lb) + ' lb' + (r.mtow ? ' · max ' + f2(r.mtow) : '') + '</small>';
    $('kTow').parentNode.className = r.weightOk === false ? 'bad' : '';
    $('kCg').parentNode.className = r.cgOk ? '' : 'bad';
    $('kCg').innerHTML = f2(r.takeoff.cg) + ' in<small>' + t.cgMin.toFixed(1) + '–' + t.cgMax + '</small>';
    $('kFuel').innerHTML = f2(r.fuelKg) + ' kg<small>' + r.fuelL + ' L × ' + WB.FUEL_DENSITY + '</small>';

    // Gauge: show limits in the middle 70% of the bar
    var span = t.cgMax - t.cgMin, lo = t.cgMin - span * 0.2143, hi = t.cgMax + span * 0.2143;
    var pos = Math.max(0, Math.min(1, (r.takeoff.cg - lo) / (hi - lo)));
    var gm = $('gMark');
    gm.style.left = (pos * 100) + '%';
    gm.className = 'gmark ' + (r.cgOk ? 'ok' : 'bad');
    gm.setAttribute('data-v', f2(r.takeoff.cg));
    $('gMin').textContent = 'FWD ' + t.cgMin;
    $('gMax').textContent = 'AFT ' + t.cgMax;
    $('limitText').textContent = t.limitText;

    var html = '', i = 0;
    var dash = '<span class="na">—</span>';
    r.rows.forEach(function (row) {
      i++;
      html += '<tr' + (row.w === null ? ' class="empty"' : '') + '><td>' + i + '</td><td>' + row.name + '</td><td>' +
        (row.w === null ? dash : f2(row.w)) + '</td><td>' + row.arm + '</td><td>' + (row.m === null ? dash : f2(row.m)) + '</td></tr>';
    });
    if (ac.taxi) {
      html += '<tr class="sub"><td>' + (++i) + '</td><td>Ramp weight</td><td>' + f2(r.ramp.w) + '</td><td>' + f2(r.ramp.cg) + '</td><td>' + f2(r.ramp.m) + '</td></tr>';
      html += '<tr><td>' + (++i) + '</td><td>Engine start &amp; taxi fuel</td><td>−' + f2(r.taxi.w) + '</td><td>' + r.taxi.arm + '</td><td>−' + f2(r.taxi.m) + '</td></tr>';
    }
    html += '<tr class="total"><td>' + (++i) + '</td><td>Take-off weight</td><td>' + f2(r.takeoff.w) + '</td><td>' + f2(r.takeoff.cg) + '</td><td>' + f2(r.takeoff.m) + '</td></tr>';
    $('rows').innerHTML = html;
    $('calcText').textContent = 'CG = total moment / total weight = ' + f2(r.takeoff.m) + ' / ' + f2(r.takeoff.w) +
      ' = ' + r.takeoff.cg.toFixed(3) + ' in';
  }

  [fuel, pic, co].forEach(function (el) {
    el.addEventListener('input', function () {
      if (el === pic) store.set('pic', el.value);
      update();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var next = el === fuel ? pic : el === pic ? co : null;
        if (next) next.focus();
        else {
          el.blur();
          if (!$('result').hidden) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
  $('form').addEventListener('submit', function (e) { e.preventDefault(); });
  $('printBtn').addEventListener('click', function () { window.print(); });
  $('resetBtn').addEventListener('click', function () {
    fuel.value = ''; co.value = '';
    update();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fuel.focus();
  });

  // Restore last aircraft / pilot weight (URL ?ac=RUM overrides)
  var q = new URLSearchParams(location.search);
  var startReg = q.get('ac') || store.get('reg');
  if (store.get('pic')) pic.value = store.get('pic');
  if (q.get('fuel')) fuel.value = q.get('fuel');
  if (q.get('pic')) pic.value = q.get('pic');
  if (q.get('co')) co.value = q.get('co');
  if (startReg && WB.find(startReg)) select(WB.find(startReg).reg, false);
  else update();
})();

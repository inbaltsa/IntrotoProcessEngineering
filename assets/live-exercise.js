/* =========================================================
   live-exercise.js — תרגילים חיים לבדיקה עצמית
   שדה קלט + כפתור "בדיקה" שמשווה לתשובה עם סבילות (tolerance).
   תומך בכמה שדות בתרגיל אחד (data-answer / data-tol לכל שדה).
   כולל בדיקה יחסית ל"קרוב מאוד" (יחידות/עיגול) ופתרון מתקפל.
   ========================================================= */
(function () {
  function toNum(s) {
    if (s == null) return NaN;
    s = s.toString().trim().replace(/,/g, '.').replace(/\s+/g, '');
    // תמיכה בכתיב מדעי כמו 1e5 / 1*10^5 / 10^-9
    s = s.replace(/\*?10\^?/i, 'e').replace(/\^/g, '');
    return parseFloat(s);
  }

  // נירמול לתשובה מדויקת (ספרות משמעותיות / עיגול / כתיב מדעי)
  function normExact(s) {
    return (s == null ? '' : s.toString()).trim().toLowerCase()
      .replace(/,/g, '.')
      .replace(/\s+/g, '')
      .replace(/×/g, '*')
      .replace(/\*?10\^?/g, 'e')   // 4.5*10^-3 / 4.5×10^-3 -> 4.5e-3
      .replace(/\^/g, '');
  }

  function checkField(inp) {
    // מצב "מדויק": התשובה חייבת להתאים בדיוק (רלוונטי לספרות משמעותיות/עיגול)
    if (inp.dataset.exact != null) {
      var raw = (inp.value || '').trim();
      if (raw === '') return { state: 'empty' };
      var got = normExact(raw);
      var accepted = (inp.dataset.answer || '').split('|').map(normExact);
      return { state: accepted.indexOf(got) >= 0 ? 'ok' : 'bad' };
    }
    var ans = parseFloat(inp.dataset.answer);
    var tol = inp.dataset.tol != null ? parseFloat(inp.dataset.tol)
                                      : Math.abs(ans) * 0.01; // 1% ברירת מחדל
    var val = toNum(inp.value);
    if (isNaN(val)) return { state: 'empty' };
    if (Math.abs(val - ans) <= tol) return { state: 'ok' };
    var rel = ans !== 0 ? Math.abs(val - ans) / Math.abs(ans) : Math.abs(val - ans);
    return { state: rel < 0.1 ? 'close' : 'bad' };
  }

  function check(box) {
    var inputs = box.querySelectorAll('.le-input');
    var fb = box.querySelector('.le-feedback');
    var states = [], anyEmpty = false, allOk = true, anyClose = false;
    inputs.forEach(function (inp) {
      var r = checkField(inp);
      inp.classList.remove('le-input-ok', 'le-input-bad');
      if (r.state === 'empty') { anyEmpty = true; allOk = false; }
      else if (r.state === 'ok') { inp.classList.add('le-input-ok'); }
      else { inp.classList.add('le-input-bad'); allOk = false; if (r.state === 'close') anyClose = true; }
    });
    if (anyEmpty && allOk === false && inputs.length === 1) {
      fb.className = 'le-feedback le-warn'; fb.textContent = 'נא להזין מספר'; return;
    }
    if (anyEmpty) { fb.className = 'le-feedback le-warn'; fb.textContent = 'נא למלא את כל השדות'; return; }
    if (allOk) {
      fb.className = 'le-feedback le-ok'; fb.textContent = '✓ נכון! כל הכבוד';
      box.classList.add('le-solved');
    } else if (anyClose) {
      fb.className = 'le-feedback le-close'; fb.textContent = '✗ קרוב מאוד — בדקו יחידות או עיגול';
    } else {
      fb.className = 'le-feedback le-bad'; fb.textContent = '✗ לא מדויק, נסו שוב';
    }
  }

  /* ---------- תרגיל "פקטור מעבר": קו שבר עם ערכים ויחידות ----------
     מקבל כל אוריינטציה תקינה (וגם ההופכי) כל עוד המונה = המכנה פיזיקלית,
     כלומר הפקטור שווה ל-1. הקשר מוגדר ב-data: unit-a, unit-b, a-per-b
     (כמות יחידות a בתוך יחידה אחת של b). */
  var UNIT_SYNONYMS = {
    'l': 'l', 'liter': 'l', 'litre': 'l', 'ליטר': 'l',
    'gal': 'gal', 'gallon': 'gal', 'גלון': 'gal',
    'm': 'm', 'meter': 'm', 'metre': 'm', 'מטר': 'm',
    'ft': 'ft', 'feet': 'ft', 'foot': 'ft', 'פיט': 'ft', 'פוט': 'ft'
  };
  function normUnit(u) {
    u = (u || '').toString().trim().toLowerCase();
    return UNIT_SYNONYMS[u] || u;
  }

  function mark(inp, ok) {
    inp.classList.remove('le-input-ok', 'le-input-bad');
    if (ok === true) inp.classList.add('le-input-ok');
    else if (ok === false) inp.classList.add('le-input-bad');
  }

  function checkFraction(box) {
    var a = normUnit(box.dataset.unitA);
    var b = normUnit(box.dataset.unitB);
    var aPerB = parseFloat(box.dataset.aPerB);      // 1 b = aPerB · a
    var reltol = parseFloat(box.dataset.reltol || '0.01');
    var nv = toNum(box.querySelector('.cf-num-v').value);
    var nu = normUnit(box.querySelector('.cf-num-u').value);
    var dv = toNum(box.querySelector('.cf-den-v').value);
    var du = normUnit(box.querySelector('.cf-den-u').value);
    var fb = box.querySelector('.le-feedback');
    var vs = box.querySelectorAll('.cf-v');

    if (isNaN(nv) || isNaN(dv) || !nu || !du) {
      fb.className = 'le-feedback le-warn';
      fb.textContent = 'מלאו ערך ויחידה במונה ובמכנה';
      return;
    }
    // היחידות חייבות להיות זוג {a,b} — אחת בכל חלק
    var got = [nu, du].sort().join('|'), want = [a, b].sort().join('|');
    if (got !== want) {
      fb.className = 'le-feedback le-bad';
      fb.textContent = '✗ היחידות צריכות להיות ' + box.dataset.unitA + ' ו-' + box.dataset.unitB + ' (אחת בכל חלק)';
      vs.forEach(function (i) { mark(i, false); });
      return;
    }
    function toA(v, u) { return u === a ? v : v * aPerB; }
    var top = toA(nv, nu), bot = toA(dv, du);
    var ok = Math.abs(top - bot) <= reltol * Math.max(Math.abs(top), Math.abs(bot));
    vs.forEach(function (i) { mark(i, ok); });
    if (ok) {
      fb.className = 'le-feedback le-ok';
      fb.textContent = '✓ נכון! זהו פקטור מעבר תקין (שווה ל-1)';
      box.classList.add('le-solved');
    } else {
      fb.className = 'le-feedback le-bad';
      fb.textContent = '✗ הפקטור אינו שווה ל-1 — המונה והמכנה חייבים לבטא אותה כמות';
    }
  }

  function wire(box) {
    var isFraction = box.classList.contains('le-fraction-ex');
    var run = isFraction ? function () { checkFraction(box); } : function () { check(box); };
    var btn = box.querySelector('.le-check');
    if (btn) btn.addEventListener('click', run);
    box.querySelectorAll('.le-input, .cf-v, .cf-u').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); run(); }
      });
    });
  }

  function init() { document.querySelectorAll('.live-exercise').forEach(wire); }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

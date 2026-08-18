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

  function checkField(inp) {
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

  function wire(box) {
    var btn = box.querySelector('.le-check');
    if (btn) btn.addEventListener('click', function () { check(box); });
    box.querySelectorAll('.le-input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); check(box); }
      });
    });
  }

  function init() { document.querySelectorAll('.live-exercise').forEach(wire); }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

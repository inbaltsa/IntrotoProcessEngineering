/* =========================================================
   report-error.js — כפתור "מצאנו שגיאה לתיקון"
   כפתור צף בכל עמוד שפותח חלונית עם הבהרה (רק להגהה!) ומפנה
   לטופס Google לדיווח, עם כתובת העמוד (וטקסט מסומן) ממולאים מראש.
   =========================================================

   >>> להגדרה — למלא כאן פעם אחת אחרי יצירת טופס Google: <<< */
var REPORT_CONFIG = {
  // קישור ה-viewform של טופס ה-Google:
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfFJsSRj5G_otjAzoAIwH9aVoMCA94HRGioKHrsBjJzalhs6Q/viewform",

  // מזהה שדה "קישור ישיר לפרק" (כתובת העמוד תמולא אוטומטית).
  // מ"קבל קישור עם מילוי מראש". אם ריק — לא ימולא.
  entryPage: "entry.1917305355",       // "קישור ישיר לפרק"

  // מזהה שדה "תת-פרק" (הכותרת הקרובה תמולא אוטומטית):
  entrySection: "entry.1642881501"     // "תת-פרק"
};

(function () {
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // הכותרת הקרובה ביותר (לפי הבחירה או ראש המסך) — עבור שדה "תת-פרק"
  function currentSection() {
    var heads = document.querySelectorAll(
      "#quarto-document-content h1, #quarto-document-content h2, #quarto-document-content h3, #quarto-document-content h4");
    if (!heads.length) heads = document.querySelectorAll("main h1, main h2, main h3");
    var refY = window.scrollY + 100;
    var sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount && sel.toString().trim()) {
      refY = sel.getRangeAt(0).getBoundingClientRect().top + window.scrollY;
    }
    var best = "";
    heads.forEach(function (h) {
      if (h.getBoundingClientRect().top + window.scrollY <= refY) best = (h.innerText || "").trim();
    });
    return best;
  }

  function buildFormUrl() {
    var url = REPORT_CONFIG.formUrl;
    var params = [];
    if (REPORT_CONFIG.entryPage) {
      params.push(REPORT_CONFIG.entryPage + "=" + encodeURIComponent(location.href));
    }
    if (REPORT_CONFIG.entrySection) {
      var sec = currentSection();
      if (sec) params.push(REPORT_CONFIG.entrySection + "=" + encodeURIComponent(sec.slice(0, 200)));
    }
    return params.length ? url + "?usp=pp_url&" + params.join("&") : url;
  }

  function build() {
    // כפתור צף
    var btn = el("button", "report-error-btn", "✎ מצאנו שגיאה לתיקון");
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "dialog");

    // חלונית
    var panel = el("div", "report-error-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "דיווח על שגיאת הגהה");
    panel.hidden = true;
    panel.innerHTML =
      '<button class="report-error-close" type="button" aria-label="סגירה">×</button>' +
      '<h3 class="report-error-title">דיווח על שגיאת הגהה</h3>' +
      '<div class="report-error-scope">הכפתור מיועד <b>לתיקוני הגהה בלבד</b>: שגיאות כתיב, ניסוח, פורמט, ' +
      'או מספר שגוי בטקסט.</div>' +
      '<div class="report-error-warn">⚠ לשאלות על <b>התוכן</b> — יש לפנות ל<b>צוות ההוראה</b> של הקורס.</div>' +
      '<a class="report-error-go" target="_blank" rel="noopener">פתיחת טופס הדיווח ←</a>' +
      '<div class="report-error-hint">כתובת העמוד הנוכחי תצורף אוטומטית לדיווח.</div>';

    var go = panel.querySelector(".report-error-go");

    function open() {
      go.href = buildFormUrl();          // נבנה בעת הפתיחה כדי לתפוס טקסט מסומן
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () { panel.hidden ? open() : close(); });
    panel.querySelector(".report-error-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  if (document.readyState !== "loading") build();
  else document.addEventListener("DOMContentLoaded", build);
})();

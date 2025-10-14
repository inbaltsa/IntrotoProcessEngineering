<script>
document.addEventListener('DOMContentLoaded', () => {
  // מיפוי שם סביבה -> callout + כותרת
  const map = {
    definition: {callout:'callout-note',      title:'הגדרה'},
    example:    {callout:'callout-example',   title:'דוגמה'},
    exercise:   {callout:'callout-important', title:'תרגיל'},
    tip:        {callout:'callout-tip',       title:'טיפ'},
    summary:    {callout:'callout-important', title:'סיכום'},
    question:   {callout:'callout-note',      title:'שאלה'},
    answer:     {callout:'callout-tip',       title:'תשובה', collapse:true},
    remark:     {callout:'callout-note',      title:'הערה'},
    theorem:    {callout:'callout-note',      title:'משפט'},
    lemma:      {callout:'callout-note',      title:'למה'},
    proposition:{callout:'callout-note',      title:'טענה'},
    corollary:  {callout:'callout-note',      title:'מסקנה'},
    proof:      {callout:'callout-note',      title:'הוכחה', collapse:true},
    hint:       {callout:'callout-tip',       title:'רמז',   collapse:true},
    solution:   {callout:'callout-note',      title:'הצג פתרון', collapse:true},
  };

  // מאתרים גם לפי custom-style וגם לפי classes
  const candidates = [
    ...document.querySelectorAll('div[custom-style], section[custom-style]'),
    ...document.querySelectorAll(Object.keys(map).map(k => `div.${k}, section.${k}`).join(','))
  ];

  candidates.forEach(el => {
    const raw = (el.getAttribute('custom-style') || '')
                  .toLowerCase().replace(/\s+/g,'');
    const cls = [...el.classList].map(c=>c.toLowerCase());
    const key = Object.keys(map).find(k => k===raw || cls.includes(k));
    if (!key) return;

    const spec = map[key];

    // הפוך ל-callout: מוסיף מחלקות תואמות של Quarto
    el.classList.add('callout', spec.callout, key);

    // כותרת אם חסרה
    if (!el.getAttribute('title') && spec.title) {
      el.setAttribute('title', spec.title);
    }

    // collapse אם צריך
    if (spec.collapse && !el.getAttribute('collapse')) {
      el.setAttribute('collapse','true');
    }
  });
});
</script>

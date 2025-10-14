-- assets/env-to-callout.lua
-- ממפה סגנונות מ-Word (custom-style) או classes ל-classes קריאים,
-- וב-HTML גם הופך אותם ל-callouts. ב-PDF זה רק מוסיף class (העיצוב יהיה דרך CSS).

local map = {
  definition = { callout = "callout-note",     title = "הגדרה",   collapse = "false" },
  example    = { callout = "callout-example",  title = "דוגמה",    collapse = "false" },
  exercise   = { callout = "callout-important",title = "תרגיל",    collapse = "false" },
  tip        = { callout = "callout-tip",      title = "טיפ",      collapse = "false" },
  summary    = { callout = "callout-important",title = "סיכום",    collapse = "false" },
  question   = { callout = "callout-note",     title = "שאלה",     collapse = "false" },
  answer     = { callout = "callout-tip",      title = "תשובה",    collapse = "true"  },
  remark     = { callout = "callout-note",     title = "הערה",     collapse = "false" },
  theorem    = { callout = "callout-note",     title = "משפט",     collapse = "false" },
  lemma      = { callout = "callout-note",     title = "למה",      collapse = "false" },
  proposition= { callout = "callout-note",     title = "טענה",     collapse = "false" },
  corollary  = { callout = "callout-note",     title = "מסקנה",    collapse = "false" },
  proof      = { callout = "callout-note",     title = "הוכחה",    collapse = "true"  },
  -- נשמור תאימות לגרסה הישנה:
  hint       = { callout = "callout-tip",      title = "רמז",      collapse = "true"  },
  solution   = { callout = "callout-note",     title = "הצג פתרון",collapse = "true"  },
}

local function norm(s)
  if not s then return nil end
  s = s:gsub("%s+", ""):lower()
  return s
end

local function detect_style(div)
  -- 1) מ-Word: custom-style="Definition" וכו'
  local cs = div.attributes["custom-style"] or div.attributes["customStyle"]
  if cs and map[norm(cs)] then return norm(cs) end
  -- 2) אם כבר הגיע כ-class
  for _, c in ipairs(div.classes) do
    local cc = norm(c)
    if map[cc] then return cc end
  end
  return nil
end

function Div(div)
  local kind = detect_style(div)
  if not kind then return nil end

  -- הוסף תמיד class בשם הסביבה כדי שה-JS/CSS שלך יזהו:
  if not div.classes:includes(kind) then
    div.classes:insert(kind)
  end

  -- ב-HTML: הפוך ל-callout עם כותרת/קולאפס נחמדים
  if not quarto.doc.isFormat("pdf") then
    local spec = map[kind]
    -- ודא שיש מחלקות callout
    div.classes = pandoc.List({"callout", spec.callout, kind})
    -- תכונות עזר
    if spec.title then
      -- שמור כותרת קיימת אם יש, אחרת שים משלנו
      if not div.attributes["title"] or div.attributes["title"] == "" then
        div.attributes["title"] = spec.title
      end
    end
    if spec.collapse then
      if not div.attributes["collapse"] then
        div.attributes["collapse"] = spec.collapse
      end
    end
    return div
  end

  -- ב-PDF אין callouts מובנים — נשאיר רק את ה-class (תעצב/י ב-CSS/LaTeX אם תרצי)
  return div
end

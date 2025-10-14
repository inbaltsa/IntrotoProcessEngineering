-- wordstyles-to-quarto.lua  (backward-compatible)
-- Detect Word paragraph styles or leading "Label:" and wrap as Quarto blocks/callouts.

-- ---------- Tiny helpers (no pandoc.text.* deps) ----------
local function trim(s)
  return (tostring(s or ""):gsub("^%s+", ""):gsub("%s+$", ""))
end
local function lower(s)
  return string.lower(tostring(s or ""))
end
local function norm(s)
  return lower(trim(s))
end
local function stringify(inlines)
  -- works on Inlines or a single Inline
  if not inlines then return "" end
  if type(inlines) ~= "table" or inlines.t then
    return pandoc.utils.stringify(inlines)
  end
  return pandoc.utils.stringify(pandoc.Inlines(inlines))
end

-- ---------- MAPPING ----------
local MAP = {
  -- math-like environments
  ["definition"] = "definition", ["הגדרה"] = "definition",
  ["theorem"] = "theorem", ["משפט"] = "theorem",
  ["lemma"] = "lemma", ["למה"] = "lemma",
  ["corollary"] = "corollary", ["מסקנה"] = "corollary",
  ["proof"] = "proof", ["הוכחה"] = "proof",
  ["example"] = "example", ["דוגמה"] = "example", ["דוגמא"] = "example",
  ["exercise"] = "exercise", ["תרגיל"] = "exercise", ["שאלה"] = "exercise",
  ["solution"] = "solution", ["פתרון"] = "solution",
  -- callouts
  ["remark"] = "callout-note", ["הערה"] = "callout-note", ["note"] = "callout-note",
  ["tip"] = "callout-tip", ["טיפ"] = "callout-tip",
  ["warning"] = "callout-warning", ["אזהרה"] = "callout-warning", ["caution"] = "callout-warning",
  ["important"] = "callout-important", ["חשוב"] = "callout-important", ["סיכום"] = "callout-important",
}

local COLON_PAT = "[:：︰﹕׃]"  -- various colon glyphs

-- ---------- STYLE READ ----------
local function class_from_style(attr)
  -- attr may be nil or table with attributes in different pandoc versions
  if not attr then return nil end
  local kv = attr.attributes or attr  -- older pandoc keeps keyvals directly
  local s = kv["custom-style"] or kv["style"] or kv["CustomStyle"]
  if not s then return nil end
  return MAP[norm(s)]
end

-- ---------- LEADING LABEL ----------
local function leading_label_from_inlines(inlines)
  if not inlines or #inlines == 0 then return nil end

  local label, consumed, title

  -- Case A: Strong(...) first
  if inlines[1].t == "Strong" then
    local seg = inlines[1].content or {}
    local txt = stringify(seg)
    local m = txt:match("^(.-)%s*" .. COLON_PAT .. "%s*$")
    if m then
      label = norm(m); consumed = 1
    else
      -- Maybe Strong "Label" then next token ":" as Str
      if #seg > 0 and inlines[2] and inlines[2].t == "Str" and inlines[2].text:match("^%s*" .. COLON_PAT .. "%s*$") then
        label = norm(stringify(seg)); consumed = 2
      end
    end
  end

  -- Case B: plain Str "Label:"
  if not label and inlines[1].t == "Str" then
    local m = inlines[1].text and inlines[1].text:match("^(.-)%s*" .. COLON_PAT .. "%s*$")
    if m then label = norm(m); consumed = 1 end
  end

  if not label then return nil end
  local class = MAP[label]
  if not class then return nil end

  -- Optional inline title after the consumed tokens
  local rest = {}
  for i = (consumed or 0) + 1, #inlines do table.insert(rest, inlines[i]) end
  -- remove leading spaces
  while #rest > 0 and rest[1].t == "Space" do table.remove(rest, 1) end
  local ttl = trim(stringify(rest))
  if ttl == "" then ttl = nil end

  return { class = class, title = ttl, drop = consumed or 0 }
end

-- ---------- WRAP ----------
local function make_div(blocks, class, title)
  local attr = pandoc.Attr("", { class }, {})
  if title then attr.attributes["title"] = title end
  return pandoc.Div(blocks, attr)
end

-- ---------- CONVERT ONE BLOCK ----------
local function convert_block(b)
  local cls, title = nil, nil

  -- 1) by Word custom style on the block itself
  if b.attr then
    cls = class_from_style(b.attr)
  end

  -- 2) if not found, try leading "Label:" on a paragraph
  if not cls and b.t == "Para" then
    local info = leading_label_from_inlines(b.content)
    if info then
      cls = info.class
      title = info.title
      -- drop consumed label tokens
      if info.drop and info.drop > 0 then
        local new_inlines = {}
        for i = info.drop + 1, #b.content do table.insert(new_inlines, b.content[i]) end
        while #new_inlines > 0 and new_inlines[1].t == "Space" do table.remove(new_inlines, 1) end
        b = pandoc.Para(new_inlines)
      end
    end
  end

  if cls then
    if b.t == "Div" then
      return make_div(b.content, cls, title)
    else
      return make_div({ b }, cls, title)
    end
  end

  return nil
end

-- ---------- FILTER ENTRIES ----------
function Para(p)
  local conv = convert_block(p)
  if conv then return conv end
  return nil
end

function Div(d)
  -- Prefer custom-style on Div
  local cls = class_from_style(d.attr)
  if cls then
    return make_div(d.content, cls, nil)
  end
  -- Or: if first child is a Para with a leading label
  if #d.content > 0 and d.content[1].t == "Para" then
    local conv_first = convert_block(d.content[1])
    if conv_first then
      -- merge rest blocks into the new div
      local inner = {}
      for _, blk in ipairs(conv_first.content) do table.insert(inner, blk) end
      for i = 2, #d.content do table.insert(inner, d.content[i]) end
      local title = conv_first.attr and conv_first.attr.attributes and conv_first.attr.attributes["title"] or nil
      return make_div(inner, conv_first.attr.classes[1], title)
    end
  end
  return nil
end

-- wordstyles-to-quarto.lua
-- Map Word styles / leading labels to Quarto environments

local M = {}

-- Normalize a string (lowercase, strip spaces)
local function norm(s)
  return pandoc.text.lower(pandoc.text.strip(s or ""))
end

-- Known style/label -> class map (Hebrew + English)
local MAP = {
  -- mathy blocks
  ["definition"] = "definition",
  ["הגדרה"] = "definition",
  ["theorem"] = "theorem",
  ["משפט"] = "theorem",
  ["lemma"] = "lemma",
  ["למה"] = "lemma",
  ["corollary"] = "corollary",
  ["מסקורר"] = "corollary",
  ["proof"] = "proof",
  ["הוכחה"] = "proof",
  ["example"] = "example",
  ["דוגמה"] = "example",
  ["דוגמא"] = "example",
  ["exercise"] = "exercise",
  ["תרגיל"] = "exercise",
  ["question"] = "exercise",
  ["שאלה"] = "exercise",
  ["solution"] = "solution",
  ["פתרון"] = "solution",
  -- callouts
  ["remark"] = "callout-note",
  ["הערה"] = "callout-note",
  ["note"] = "callout-note",
  ["tip"] = "callout-tip",
  ["טיפ"] = "callout-tip",
  ["warning"] = "callout-warning",
  ["אזהרה"] = "callout-warning",
  ["caution"] = "callout-warning",
  ["important"] = "callout-important",
  ["חשוב"] = "callout-important",
  ["summary"] = "callout-important",
  ["סיכום"] = "callout-important",
}

-- Try to read Word custom-style attribute (Pandoc keeps it as 'custom-style')
local function class_from_style(attrs)
  if not attrs then return nil end
  local s = attrs["custom-style"] or attrs["style"] or attrs["CustomStyle"]
  if not s then return nil end
  s = norm(s)
  return MAP[s]
end

-- Try to read a leading bold "Label:" inlines and use that as class + title
local function leading_label(inlines)
  if not inlines or #inlines == 0 then return nil end

  -- Accept forms:
  -- Strong( Str "תרגיל", Str ":" ... )
  -- Str "תרגיל:" ...
  -- Emph/SmallCaps won't be forced; most Word labels come as Strong.
  local label, consumed, title
  -- Case 1: Strong(...)
  if inlines[1].t == "Strong" then
    local seg = inlines[1].content
    local txt = pandoc.utils.stringify(seg)
    -- allow trailing colon variants (:, ‎:‎, "：" etc.)
    local m = txt:match("^(.-)%s*[:：︰﹕׃]$")
              or txt:match("^(.-)%s*[:：︰﹕׃]%s*$")
              or nil
    if m then
      label = norm(m)
      consumed = 1
    else
      -- Maybe Strong "תרגיל", then next token is ":"
      if #seg > 0 then
        local t = norm(pandoc.utils.stringify(seg))
        if (#inlines >= 2) and inlines[2].t == "Str"
           and inlines[2].text:match("^%s*[:：︰﹕׃]%s*$") then
          label = t
          consumed = 2
        end
      end
    end
  end

  -- Case 2: plain Str "Label:" at start
  if not label and inlines[1].t == "Str" then
    local txt = inlines[1].text
    local m = txt:match("^(.-)%s*[:：︰﹕׃]%s*$")
    if m then
      label = norm(m)
      consumed = 1
    end
  end

  if not label then return nil end

  local class = MAP[label]
  if not class then return nil end

  -- Optional title: if next token(s) start with Space, then text until EOL of that block
  -- We'll take rest of inlines after consumed, strip leading spaces, as title if nonempty.
  local rest = {}
  for i = consumed + 1, #inlines do table.insert(rest, inlines[i]) end
  -- trim leading spaces/punctuation
  while #rest > 0 and rest[1].t == "Space" do table.remove(rest, 1) end
  local ttl = pandoc.utils.stringify(rest)
  title = pandoc.text.strip(ttl or "")
  if title == "" then title = nil end

  return { class = class, title = title, drop = consumed }
end

-- Build a Quarto div with class and optional title attribute
local function wrap_as_block(blocks, class, title, attrs)
  local attr = pandoc.Attr(attrs and attrs.identifier or "", {class}, attrs and attrs.attributes or {})
  if title then
    -- Quarto supports 'title' attribute on fenced divs
    attr.attributes["title"] = title
  end
  return pandoc.Div(blocks, attr)
end

-- Process a single block (Para or Div)
local function convert_block(b)
  local cls = nil
  local title = nil

  -- 1) from Word custom-style
  cls = class_from_style(b.attr and b.attr.attributes or nil)

  -- 2) If not found, try leading label on Para content
  if not cls and b.t == "Para" then
    local info = leading_label(b.content)
    if info then
      cls = info.class
      title = info.title
      -- drop consumed label tokens
      if info.drop and info.drop > 0 then
        local new_inlines = {}
        local start = info.drop + 1
        for i = start, #b.content do table.insert(new_inlines, b.content[i]) end
        -- trim leading spaces after label
        while #new_inlines > 0 and new_inlines[1].t == "Space" do table.remove(new_inlines, 1) end
        b = pandoc.Para(new_inlines)
      end
    end
  end

  -- If found a mapping, wrap as Div with the class
  if cls then
    -- If it’s a callout (class starts with callout-), wrap the following blocks until a blank line?
    -- To keep it simple & robust, just wrap the single block or existing Div.
    if b.t == "Div" then
      -- keep inner blocks as-is
      return wrap_as_block(b.content, cls, title, b.attr)
    else
      return wrap_as_block({ b }, cls, title, b.attr)
    end
  end

  return nil
end

function M.Para(p)
  return convert_block(p)
end

function M.Div(d)
  -- If Div has a custom-style we capture the whole Div
  local by_style = class_from_style(d.attr.attributes or nil)
  if by_style then
    return wrap_as_block(d.content, by_style, nil, d.attr)
  end
  -- Otherwise try leading label if the Div starts with a Para
  if #d.content > 0 and d.content[1].t == "Para" then
    local conv = convert_block(d.content[1])
    if conv then
      -- replace first block with converted, keep the rest inside
      local rest = {}
      for i = 2, #d.content do table.insert(rest, d.content[i]) end
      local inner = conv.content
      for _, blk in ipairs(rest) do table.insert(inner, blk) end
      return wrap_as_block(inner, conv.attr.classes[1], conv.attr.attributes["title"], d.attr)
    end
  end
  return nil
end

return M

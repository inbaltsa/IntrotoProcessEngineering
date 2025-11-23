-- מסיר את המאפיין dir מכל אלמנט (בלוקים ואינליינים) בלי לגעת בשום דבר אחר

local function strip_dir(attr)
  if attr and attr.attributes then
    attr.attributes.dir = nil
  end
end

local function process(el)
  if el.attr then
    strip_dir(el.attr)
  end
  return el
end

return {
  {
    -- בלוקים
    Para = process,
    Plain = process,
    Div = process,
    Header = process,
    BlockQuote = process,
    CodeBlock = process,
    Table = process,
    BulletList = process,
    OrderedList = process,

    -- אינליינים
    Span = process,
    Code = process,
    Link = process,
    Image = process,
    Math = process,
  }
}

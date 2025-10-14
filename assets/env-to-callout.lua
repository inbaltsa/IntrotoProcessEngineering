-- env-to-callout.lua
-- Map LaTeX environments \begin{solution}...\end{solution} and \begin{hint}...\end{hint}
-- to Quarto callouts when rendering HTML. No effect in PDF.
function Div(div)
  if not quarto.doc.isFormat("pdf") then
    if div.classes:includes("solution") then
      -- Turn into a callout-note that starts collapsed
      div.classes = pandoc.List({"callout", "callout-note"})
      div.attributes["collapse"] = "true"
      div.attributes["title"] = "הצג פתרון"
      return div
    elseif div.classes:includes("hint") then
      -- Turn into a callout-tip that starts collapsed
      div.classes = pandoc.List({"callout", "callout-tip"})
      div.attributes["collapse"] = "true"
      div.attributes["title"] = "רמז"
      return div
    end
  end
end

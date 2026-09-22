const slides = presentation.getSlides();
const texts = slides.map((slide, i) => {
  const items = slide.getElements().map((el) => {
    const t = typeof el.getText === "function" ? el.getText() : null;
    if (!t) return null;
    const rt = t.getRichText();
    return rt ? rt.copy().toPlainText() : null;
  }).filter(Boolean);
  return { page: i + 1, id: slide.getId(), name: slide.getName(), textCount: items.length, texts: items };
});
return {
  slideCount: slides.length,
  title1: texts[0].texts[0],
  page1Texts: texts[0].texts,
  page3Texts: texts[2].texts.filter((s) => s.includes("利润增速") || s.includes("467,100") || s.includes("纵轴")),
  page5Texts: texts[4].texts.filter((s) => s.includes("收入增量合计") || s.includes("成本 83,200") || s.includes("收入 156,350")),
  page6Texts: texts[5].texts.filter((s) => s.includes("Q4 目标") || s.includes("锁定")),
};

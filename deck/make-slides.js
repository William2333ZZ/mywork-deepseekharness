const names = ["封面", "结论", "月度趋势", "利润率", "增量拆解", "下一步"];
const before = presentation.getSlides().length;
const created = [];
for (let i = before; i < names.length; i++) {
  const slide = presentation.appendSlide({ name: names[i] });
  created.push({ index: i, id: slide ? slide.getId() : null, name: slide ? slide.getName() : null });
}
presentation.setName("2026 Q3 销售复盘");
return {
  presentationName: presentation.getName(),
  pageSize: presentation.getPageSize(),
  countBefore: before,
  countAfter: presentation.getSlides().length,
  slides: presentation.getSlides().map((s, i) => ({ index: i, id: s.getId(), name: s.getName() })),
  created,
};

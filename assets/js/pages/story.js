// story.js —— 剧情列表（暂为占位，读取 story.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'story',
      listProp: 'story',
      title: '剧情',
      desc: '主线与各章节委托，按版本整理。',
      breadcrumb: [{ label: '剧情' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

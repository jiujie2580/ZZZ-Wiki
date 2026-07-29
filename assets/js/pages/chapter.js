// chapter.js —— 剧情章节详情（暂为占位，按 ?id 查找）
(function () {
  function init() {
    window.ZZZUI.detailPlaceholder({
      dataKey: 'story',
      listProp: 'story',
      title: '剧情',
      listLabel: '剧情',
      listPage: 'story'
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

// changelog.js —— 更新日志（暂为占位，读取 version.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'version',
      listProp: 'versions',
      title: '更新日志',
      desc: '游戏版本更新要点与新增内容。',
      breadcrumb: [{ label: '更新日志' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

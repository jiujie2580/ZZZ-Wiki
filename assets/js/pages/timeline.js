// timeline.js —— 时间线（暂为占位，读取 timeline.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'timeline',
      listProp: 'events',
      title: '时间线',
      desc: '按年代排序的重大事件。',
      breadcrumb: [{ label: '时间线' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

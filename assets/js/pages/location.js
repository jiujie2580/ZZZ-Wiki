// location.js —— 地区详情（暂为占位，按 ?id 查找）
(function () {
  function init() {
    window.ZZZUI.detailPlaceholder({
      dataKey: 'locations',
      listProp: 'locations',
      title: '地区',
      listLabel: '地区',
      listPage: 'locations'
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

// locations.js —— 地区列表（暂为占位，读取 locations.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'locations',
      listProp: 'locations',
      title: '地区',
      desc: '新艾利都、空洞与各地带。',
      breadcrumb: [{ label: '地区' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

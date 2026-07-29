// characters.js —— 角色列表（暂为占位，读取 characters.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'characters',
      listProp: 'characters',
      title: '角色',
      desc: '代理人列表，可按势力与属性筛选。',
      breadcrumb: [{ label: '角色' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

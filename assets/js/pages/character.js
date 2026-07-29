// character.js —— 角色详情（暂为占位，按 ?id 查找）
(function () {
  function init() {
    window.ZZZUI.detailPlaceholder({
      dataKey: 'characters',
      listProp: 'characters',
      title: '角色',
      listLabel: '角色',
      listPage: 'characters'
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

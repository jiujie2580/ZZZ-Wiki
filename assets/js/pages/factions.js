// factions.js —— 势力 / 组织列表（暂为占位，读取 factions.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'factions',
      listProp: 'factions',
      title: '势力 / 组织',
      desc: '角色阵营与官方组织/机构，按 category 区分。',
      breadcrumb: [{ label: '势力' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

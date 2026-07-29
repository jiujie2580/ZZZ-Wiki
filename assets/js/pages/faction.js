// faction.js —— 势力 / 组织详情（暂为占位，按 ?id 查找）
(function () {
  function init() {
    window.ZZZUI.detailPlaceholder({
      dataKey: 'factions',
      listProp: 'factions',
      title: '势力',
      listLabel: '势力',
      listPage: 'factions'
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

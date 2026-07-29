// glossary.js —— 术语表（暂为占位，读取 glossary.json）
(function () {
  function init() {
    window.ZZZUI.listPlaceholder({
      dataKey: 'glossary',
      listProp: 'terms',
      title: '术语',
      desc: '专有名词与官方概念释义。',
      breadcrumb: [{ label: '术语' }]
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();

// about.js —— 关于本站（读取 site.json 展示元信息 + 数据规范）
(function () {
  async function init() {
    window.ZZZUI.breadcrumb([{ label: '关于' }]);
    const d = await window.ZZZData.loadJSON('site');
    const s = (d && d.site) ? d.site : {};
    const c = document.getElementById('content');
    c.innerHTML =
      '<section class="page-hero"><h1>关于本站</h1></section>' +
      '<div class="card about-card">' +
        '<h2>' + window.ZZZUI.esc(s.title || '绝区零 Wiki') + '</h2>' +
        '<p>' + window.ZZZUI.esc(s.description || '') + '</p>' +
        window.ZZZUI.field('当前游戏版本', s.gameVersion) +
        window.ZZZUI.field('资料更新', s.updatedAt) +
        '<h3>数据来源与规范</h3>' +
        '<ul class="about-list">' +
          '<li>所有剧情、人物、势力、时间线、术语均严格基于官方正式剧情、官方设定与官方资料。</li>' +
          '<li>官方未说明的内容统一标注【官方暂未说明】，绝不自行编造。</li>' +
          '<li>新增游戏版本时，仅更新 data/ 下的 JSON 数据，无需改动页面与脚本。</li>' +
        '</ul>' +
        '<p class="disclaimer">本站为非官方粉丝百科，与游戏开发商无隶属关系。如有争议以官方公布为准。</p>' +
      '</div>';
  }
  document.addEventListener('DOMContentLoaded', init);
})();

// about.js —— 关于本站（v1.0.0 D2 增强：站点信息 + 数据统计 + 协议/仓库，全部数据驱动自 site.json 与 data/*.json）
// 原则：不新增 about.json；站点元信息只放 site.json；统计由各模块 JSON 并行加载后计算，零硬编码。
(function () {
  var UI = window.ZZZUI;

  // 模块统计定义：数据文件逻辑名 -> [列表字段, 中文名, 列表页逻辑名]
  var MODULES = [
    ['story',      'story',      '剧情章节', 'story'],
    ['characters', 'characters', '角色',     'characters'],
    ['factions',   'factions',   '势力',     'factions'],
    ['locations',  'locations',  '地区',     'locations'],
    ['timeline',   'events',     '时间线事件', 'timeline'],
    ['glossary',   'terms',      '术语',     'glossary'],
    ['worldview',  'entries',    '世界观条目', 'worldview']
  ];

  async function init() {
    UI.breadcrumb([{ label: '关于' }]);
    var c = document.getElementById('content');
    if (!c) return;

    // 并行加载：site.json + 各模块数据（任一失败该项计数显示 —，不阻塞页面）
    var loads = [window.ZZZData.loadJSON('site')].concat(
      MODULES.map(function (m) { return window.ZZZData.loadJSON(m[0]); })
    );
    var results = await Promise.all(loads);
    var s = (results[0] && results[0].site) ? results[0].site : {};

    var stats = MODULES.map(function (m, i) {
      var d = results[i + 1];
      var n = (d && !d.__error && Array.isArray(d[m[1]])) ? d[m[1]].length : null;
      return { label: m[2], count: n, page: m[3] };
    });
    var total = stats.reduce(function (acc, x) { return acc + (x.count || 0); }, 0);

    var repoLink = s.repository
      ? '<a class="source-link" href="' + UI.esc(s.repository) + '" target="_blank" rel="noopener noreferrer">' +
        UI.esc(s.repository) + '</a>'
      : '<span class="unknown">' + UI.UNKNOWN + '</span>';

    var html =
      '<section class="page-hero"><h1>关于本站</h1>' +
      '<p class="hero-sub">' + UI.esc(s.description || '基于官方正式剧情与设定的《绝区零》百科') + '</p></section>';

    // ---------- 站点信息 ----------
    html += UI.section('站点信息',
      UI.field('站点名称', s.title) +
      UI.field('站点版本', s.version ? 'v' + s.version : null) +
      UI.field('当前游戏版本', s.gameVersion) +
      UI.field('数据基线', s.dataVersion ? '游戏 ' + s.dataVersion + ' 版本（不含后续版本剧透）' : null) +
      UI.field('资料更新日期', s.updatedAt) +
      // license 为站点自身元信息（非官方游戏设定），null 时显示「暂未设置」而非【官方暂未说明】
      '<div class="field"><span class="field-label">开源协议</span><span class="field-value">' +
      (s.license ? UI.esc(s.license) : '<span class="unknown">暂未设置</span>') + '</span></div>' +
      '<div class="field"><span class="field-label">代码仓库</span><span class="field-value">' + repoLink + '</span></div>'
    );

    // ---------- 数据统计 ----------
    var statCards = stats.map(function (x) {
      var count = (x.count === null)
        ? '<span class="unknown">—</span>'
        : '<span class="stat-num">' + x.count + '</span>';
      return '<a class="stat-card" href="' + window.ZZZRouter.buildLink(x.page) + '">' +
        count + '<span class="stat-label">' + UI.esc(x.label) + '</span></a>';
    }).join('');
    html += UI.section('数据统计',
      '<p class="term-desc">已收录 ' + MODULES.length + ' 个内容模块、共 ' + total + ' 条数据。</p>' +
      '<div class="stat-grid">' + statCards + '</div>'
    );

    // ---------- 数据来源与规范 ----------
    html += UI.section('数据来源与规范',
      '<ul class="about-list">' +
        '<li>所有剧情、人物、势力、地区、时间线、术语、世界观内容均严格基于官方正式剧情、官方设定与官方公开资料。</li>' +
        '<li>官方未说明的内容统一标注【官方暂未说明】，绝不自行编造或采纳粉丝推测。</li>' +
        '<li>所有数据集中于 data/*.json，页面仅负责展示；新增游戏版本时只需更新 JSON 数据。</li>' +
        '<li>每次发布前执行数据健康门禁（外键完整性 / 受控词表 / 命名规范）与无头渲染自测双重校验。</li>' +
      '</ul>'
    );

    // ---------- 免责声明 ----------
    html += UI.section('免责声明',
      '<p class="disclaimer">本站为非官方粉丝百科，与《绝区零》开发商 miHoYo / HoYoverse 无隶属关系。' +
      '游戏内容与图片版权归原公司所有；本站内容如与官方公布存在出入，以官方为准。</p>'
    );

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();

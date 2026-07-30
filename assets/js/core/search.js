// search.js —— 站内搜索：索引构建 + Header 即时建议 + 搜索结果页
// 暴露：window.ZZZSearch.init / buildIndex / ensureIndex / renderResults / search
(function () {
  let index = [];
  let indexPromise = null;   // 共享构建 Promise（v1.1.2 B6 修复）：防止并发重复构建
  const hasDetail = { character: true, faction: true, location: true, chapter: true, term: true, timeline: true, worldview: true };

  const TYPE_LABEL = {
    characters: '角色', factions: '势力', locations: '地区',
    glossary: '术语', story: '剧情', timeline: '时间线', version: '版本', worldview: '世界观'
  };

  // 各数据文件 -> 列表字段名 / 页面逻辑名 / 标题字段 / 摘要字段
  const MAP = {
    characters: ['characters', 'character', ['name', 'nameEn', 'codename'], ['summary', 'specialty', 'attribute', 'rarity']],
    factions:   ['factions',   'faction',   ['name', 'nameEn'], ['summary', 'alias']],
    locations:  ['locations',  'location',  ['name', 'nameEn'], ['summary', 'aliases']],
    glossary:   ['terms',      'term',      ['name', 'nameEn'], ['summary']],
    story:      ['story',      'chapter',   ['title', 'titleEn'], ['summary', 'chapter']],
    timeline:   ['events',     'timeline',  ['title'],          ['description']],
    worldview:  ['entries',    'worldview', ['title', 'titleEn'], ['summary', 'aliases']]
  };

  async function buildIndex() {
    const entries = [];
    for (const name in MAP) {
      const d = await window.ZZZData.loadJSON(name);
      if (!d || d.__error) continue;
      const m = MAP[name];
      const list = d[m[0]] || [];
      list.forEach(function (item) {
        const title = item[m[2][0]] || item[m[2][1]] || (item.term) || '未命名';
        const text = (m[3] || []).map(function (k) { return item[k] || ''; }).join(' ');
        entries.push({
          type: name, page: m[1], id: item.id,
          title: title, text: text
        });
      });
    }
    // version.json 采用 gameVersions/siteVersions 双数组结构（v1.0.0 D1），单独建索引
    const vd = await window.ZZZData.loadJSON('version');
    if (vd && !vd.__error) {
      (vd.gameVersions || []).forEach(function (v) {
        entries.push({
          type: 'version', page: 'changelog', id: v.id,
          title: 'v' + v.version + (v.title ? '「' + v.title + '」' : ''),
          text: v.date || ''
        });
      });
      (vd.siteVersions || []).forEach(function (v) {
        entries.push({
          type: 'version', page: 'changelog', id: v.id,
          title: '站点 v' + v.version + (v.title ? ' ' + v.title : ''),
          text: (v.highlights || []).join(' ')
        });
      });
    }
    index = entries;
    return index;
  }

  // v1.1.2 B6 修复：索引惰性预热。此前 buildIndex 仅在搜索结果页触发，
  // 导致未访问过 search.html 时顶栏搜索建议永远为空。现改为共享 Promise，
  // 首次 focus 搜索框即预热，输入时若未就绪则先等待构建完成再出建议。
  function ensureIndex() {
    if (!indexPromise) indexPromise = buildIndex();
    return indexPromise;
  }

  function search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    return index.filter(function (e) {
      return (e.title + ' ' + e.text).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 20);
  }

  function hrefFor(r) {
    return hasDetail[r.page]
      ? window.ZZZRouter.buildLink(r.page, { id: r.id })
      : window.ZZZRouter.buildLink(r.page);
  }

  // 关键词高亮（v1.0.0 D3）：先转义再包裹 <mark>，大小写不敏感，不引入任何库
  function highlight(text, q) {
    const escaped = window.ZZZUI.esc(text || '');
    q = (q || '').trim();
    if (!q) return escaped;
    const escQ = window.ZZZUI.esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp('(' + escQ + ')', 'gi'), '<mark class="search-mark">$1</mark>');
  }

  function init() {
    const input = document.getElementById('search-input');
    const box = document.getElementById('search-suggest');
    if (!input || !box) return;

    // 首次聚焦即预热索引（v1.1.2 B6）：不在页面加载时构建，避免每页多拉 13 个 JSON
    input.addEventListener('focus', function () { ensureIndex(); }, { once: true });

    input.addEventListener('input', async function () {
      const q = input.value;
      if (!q.trim()) { box.innerHTML = ''; box.classList.remove('show'); return; }
      if (!index.length) await ensureIndex();
      if (input.value !== q) return;   // 构建期间输入已变化，交给后续 input 事件渲染
      const res = search(q);
      if (!res.length) {
        box.innerHTML = '<div class="suggest-empty">无匹配结果</div>';
      } else {
        box.innerHTML = res.map(function (r) {
          return '<a class="suggest-item" href="' + hrefFor(r) + '">' +
            '<span class="suggest-type">' + (TYPE_LABEL[r.type] || r.type) + '</span>' +
            '<span class="suggest-title">' + highlight(r.title, q) + '</span></a>';
        }).join('');
      }
      box.classList.add('show');
    });

    if (input.form) {
      input.form.addEventListener('submit', function (e) {
        e.preventDefault();
        const q = input.value.trim();
        if (q) location.href = window.ZZZRouter.buildLink('search', { q: q });
      });
    }

    document.addEventListener('click', function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove('show');
    });

    // Ctrl+K / Cmd+K 聚焦全局搜索框（v1.0.0 D3）；Esc 收起建议
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        input.focus();
        input.select();
      } else if (e.key === 'Escape') {
        box.classList.remove('show');
      }
    });
    input.setAttribute('placeholder', (input.getAttribute('placeholder') || '搜索') + '（Ctrl+K）');
  }

  async function renderResults() {
    if (!index.length) await ensureIndex();
    const q = window.ZZZRouter.getParam('q') || '';
    const c = document.getElementById('content');
    if (!c) return;
    window.ZZZUI.breadcrumb([{ label: '搜索' }]);

    const res = search(q);
    let html = '<section class="page-hero"><h1>搜索</h1><p class="hero-sub">关键词：' +
      window.ZZZUI.esc(q) + '</p></section>';

    // 空结果引导（v1.0.0 D3）：给出建议 + 各模块入口，数据驱动自 config.pages（不硬编码 URL）
    function emptyGuide(msg) {
      const mods = [
        ['characters', '角色'], ['factions', '势力'], ['locations', '地区'], ['glossary', '术语'],
        ['story', '剧情'], ['timeline', '时间线'], ['worldview', '世界观'], ['changelog', '更新日志']
      ];
      const links = mods.map(function (m) {
        return '<a class="rel-chip" href="' + window.ZZZRouter.buildLink(m[0]) + '">' + m[1] + '</a>';
      }).join('');
      return window.ZZZUI.emptyState(msg) +
        '<div class="search-empty-guide">' +
        '<p class="term-desc">建议：尝试更短的关键词（如「空洞」「以太」）、角色代号或版本名；也可以直接浏览各模块：</p>' +
        '<div class="rel-chips">' + links + '</div></div>';
    }

    if (!q) {
      html += emptyGuide('请输入搜索关键词');
    } else if (!res.length) {
      html += emptyGuide('未找到与“' + window.ZZZUI.esc(q) + '”相关的内容');
    } else {
      const grouped = {};
      res.forEach(function (r) {
        (grouped[r.type] = grouped[r.type] || []).push(r);
      });
      html += '<div class="search-results">';
      Object.keys(grouped).forEach(function (t) {
        html += '<h2 class="result-group">' + (TYPE_LABEL[t] || t) + '</h2><div class="result-list">';
        grouped[t].forEach(function (r) {
          // 高亮命中关键词（先截断原文再转义+高亮，避免截断 HTML 标签）
          html += '<a class="result-item" href="' + hrefFor(r) + '">' +
            '<span class="result-title">' + highlight(r.title, q) + '</span>' +
            '<span class="result-text">' + highlight((r.text || '').slice(0, 80), q) + '</span></a>';
        });
        html += '</div>';
      });
      html += '</div>';
    }
    c.innerHTML = html;
  }

  window.ZZZSearch = {
    init: init,
    buildIndex: buildIndex,
    ensureIndex: ensureIndex,
    renderResults: renderResults,
    search: search
  };
})();

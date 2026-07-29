// search.js —— 站内搜索：索引构建 + Header 即时建议 + 搜索结果页
// 暴露：window.ZZZSearch.init / buildIndex / renderResults / search
(function () {
  let index = [];
  const hasDetail = { character: true, faction: true, location: true, chapter: true, term: true };

  const TYPE_LABEL = {
    characters: '角色', factions: '势力', locations: '地区',
    glossary: '术语', story: '剧情', timeline: '时间线', version: '版本'
  };

  // 各数据文件 -> 列表字段名 / 页面逻辑名 / 标题字段 / 摘要字段
  const MAP = {
    characters: ['characters', 'character', ['name', 'nameEn', 'codename'], ['summary', 'specialty', 'attribute', 'rarity']],
    factions:   ['factions',   'faction',   ['name', 'nameEn'], ['summary', 'alias']],
    locations:  ['locations',  'location',  ['name', 'nameEn'], ['summary']],
    glossary:   ['terms',      'term',      ['name', 'nameEn'], ['summary']],
    story:      ['story',      'chapter',   ['title', 'titleEn'], ['summary', 'chapter']],
    timeline:   ['events',     'timeline',  ['title'],          ['description']],
    version:    ['versions',   'changelog', ['version', 'name'],['highlights']]
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
    index = entries;
    return index;
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

  function init() {
    const input = document.getElementById('search-input');
    const box = document.getElementById('search-suggest');
    if (!input || !box) return;

    input.addEventListener('input', function () {
      const q = input.value;
      if (!q.trim()) { box.innerHTML = ''; box.classList.remove('show'); return; }
      const res = search(q);
      if (!res.length) {
        box.innerHTML = '<div class="suggest-empty">无匹配结果</div>';
      } else {
        box.innerHTML = res.map(function (r) {
          return '<a class="suggest-item" href="' + hrefFor(r) + '">' +
            '<span class="suggest-type">' + (TYPE_LABEL[r.type] || r.type) + '</span>' +
            '<span class="suggest-title">' + window.ZZZUI.esc(r.title) + '</span></a>';
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
  }

  async function renderResults() {
    if (!index.length) await buildIndex();
    const q = window.ZZZRouter.getParam('q') || '';
    const c = document.getElementById('content');
    if (!c) return;
    window.ZZZUI.breadcrumb([{ label: '搜索' }]);

    const res = search(q);
    let html = '<section class="page-hero"><h1>搜索</h1><p class="hero-sub">关键词：' +
      window.ZZZUI.esc(q) + '</p></section>';

    if (!q) {
      html += window.ZZZUI.emptyState('请输入搜索关键词');
    } else if (!res.length) {
      html += window.ZZZUI.emptyState('未找到与“' + window.ZZZUI.esc(q) + '”相关的内容');
    } else {
      const grouped = {};
      res.forEach(function (r) {
        (grouped[r.type] = grouped[r.type] || []).push(r);
      });
      html += '<div class="search-results">';
      Object.keys(grouped).forEach(function (t) {
        html += '<h2 class="result-group">' + (TYPE_LABEL[t] || t) + '</h2><div class="result-list">';
        grouped[t].forEach(function (r) {
          html += '<a class="result-item" href="' + hrefFor(r) + '">' +
            '<span class="result-title">' + window.ZZZUI.esc(r.title) + '</span>' +
            '<span class="result-text">' + window.ZZZUI.esc(r.text).slice(0, 80) + '</span></a>';
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
    renderResults: renderResults,
    search: search
  };
})();

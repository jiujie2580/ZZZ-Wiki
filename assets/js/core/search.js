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

  // 各数据文件 -> 索引配置（v1.1.3 评分搜索重构）
  //   list   : data/*.json 中的列表字段名
  //   page   : 详情页路由逻辑名（buildLink 用）
  //   title  : 用于结果展示的标题候选键（取首个非空）
  //   fields : 评分字段表 —— 字段名 -> 命中得分（D3：name=100 / alias=80 / nickname=60 / text=40）
  //            数组型字段（aliases / nicknames）每个元素各计一次同分 token
  //   nicknameFields : 命中即视为「社区称呼」（仅展示标记，不进入正文）—— 当前仅 characters.nicknames
  const MAP = {
    characters: {
      list: 'characters', page: 'character', title: ['name', 'nameEn'],
      fields: { name: 100, nameEn: 80, codename: 80, aliases: 80, nicknames: 60, summary: 40, specialty: 40, attribute: 40, rarity: 40 },
      nicknameFields: ['nicknames']
    },
    factions: {
      list: 'factions', page: 'faction', title: ['name', 'nameEn'],
      fields: { name: 100, nameEn: 80, alias: 80, aliases: 80, summary: 40 }
    },
    locations: {
      list: 'locations', page: 'location', title: ['name', 'nameEn'],
      fields: { name: 100, nameEn: 80, aliases: 80, summary: 40 }
    },
    glossary: {
      list: 'terms', page: 'term', title: ['name', 'nameEn'],
      fields: { name: 100, nameEn: 80, summary: 40 }
    },
    story: {
      list: 'story', page: 'chapter', title: ['title', 'titleEn'],
      fields: { title: 100, titleEn: 80, summary: 40, chapter: 40 }
    },
    timeline: {
      list: 'events', page: 'timeline', title: ['title'],
      fields: { title: 100, description: 40 }
    },
    worldview: {
      list: 'entries', page: 'worldview', title: ['title', 'titleEn'],
      fields: { title: 100, titleEn: 80, aliases: 80, summary: 40 }
    }
  };

  // 将一个条目的字段展开为「评分 token 列表」；空值 / 空串 / 空数组元素跳过
  function buildTokens(item, fields) {
    const tokens = [];
    Object.keys(fields).forEach(function (key) {
      const score = fields[key];
      const val = item[key];
      if (val == null) return;
      if (Array.isArray(val)) {
        val.forEach(function (s) {
          if (s != null && String(s).trim()) tokens.push({ value: String(s), score: score, key: key });
        });
      } else if (String(val).trim()) {
        tokens.push({ value: String(val), score: score, key: key });
      }
    });
    return tokens;
  }

  async function buildIndex() {
    const entries = [];
    for (const name in MAP) {
      const d = await window.ZZZData.loadJSON(name);
      if (!d || d.__error) continue;
      const m = MAP[name];
      const list = d[m.list] || [];
      list.forEach(function (item) {
        const title = (m.title || []).map(function (k) { return item[k]; })
          .find(function (v) { return v; }) || item.term || '未命名';
        // 评分 token：所有字段（含别名 / 社区称呼）参与匹配
        const tokens = buildTokens(item, m.fields);
        // 摘要片段：仅取 body 级字段（score<=40），保持原 snippet 行为
        const text = tokens.filter(function (t) { return t.score <= 40; })
          .map(function (t) { return t.value; }).join(' ');
        entries.push({
          type: name, page: m.page, id: item.id,
          title: title, text: text, tokens: tokens
        });
      });
    }
    // version.json 采用 gameVersions/siteVersions 双数组结构（v1.0.0 D1），单独建索引
    const vd = await window.ZZZData.loadJSON('version');
    if (vd && !vd.__error) {
      (vd.gameVersions || []).forEach(function (v) {
        const title = 'v' + v.version + (v.title ? '「' + v.title + '」' : '');
        entries.push({
          type: 'version', page: 'changelog', id: v.id,
          title: title, text: v.date || '',
          tokens: [{ value: title, score: 40, key: 'title' }, { value: v.date || '', score: 40, key: 'date' }]
        });
      });
      (vd.siteVersions || []).forEach(function (v) {
        const title = '站点 v' + v.version + (v.title ? ' ' + v.title : '');
        const hl = (v.highlights || []).join(' ');
        entries.push({
          type: 'version', page: 'changelog', id: v.id,
          title: title, text: hl,
          tokens: [{ value: title, score: 40, key: 'title' }, { value: hl, score: 40, key: 'highlights' }]
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

  // v1.1.3 评分搜索：对每个条目取「命中字段中的最高分」作为该条目的相关性得分，
  // 按得分降序、标题升序排序；命中 nickname 字段时标记 nickname=true（用于「社区称呼」标记）。
  // 评分模型（D3，可扩展）：name=100 / alias(含 nameEn/codename/aliases)=80 / nickname=60 / text=40
  function search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const results = [];
    index.forEach(function (e) {
      let best = 0, bestKey = null, matched = false;
      (e.tokens || []).forEach(function (t) {
        if (t.value.toLowerCase().indexOf(q) !== -1) {
          matched = true;
          if (t.score > best) { best = t.score; bestKey = t.key; }
        }
      });
      if (!matched) return;
      const cfg = MAP[e.type] || {};
      const isNickname = (cfg.nicknameFields || []).indexOf(bestKey) !== -1;
      results.push({
        type: e.type, page: e.page, id: e.id,
        title: e.title, text: e.text,
        score: best, nickname: isNickname
      });
    });
    results.sort(function (a, b) {
      return b.score - a.score ||
        (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
    });
    return results.slice(0, 20);
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
            '<span class="suggest-title">' + highlight(r.title, q) + '</span>' +
            (r.nickname ? '<span class="badge badge-warn">社区称呼</span>' : '') +
            '</a>';
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
            '<span class="result-title">' + highlight(r.title, q) +
            (r.nickname ? ' <span class="badge badge-warn">社区称呼</span>' : '') +
            '</span>' +
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

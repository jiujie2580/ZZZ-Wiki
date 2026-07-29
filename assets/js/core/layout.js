// layout.js —— 统一 Layout：注入 Header / Sidebar / Footer
// 所有页面共用此布局，HTML 中只留挂载点，不在每页重复写 Header/Footer。
// 暴露：window.ZZZLayout.render（在 DOMContentLoaded 时自动执行）
(function () {
  const ICON = window.ZZZ.iconBase;

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="' + ICON + '#' + name + '"></use></svg>';
  }

  async function render() {
    const site = await window.ZZZData.loadJSON('site');
    const s = (site && site.site) ? site.site : {};
    const nav = (site && site.nav) ? site.nav : [];
    const curPath = location.pathname.split('/').pop() || 'index.html';

    // ---------- Header ----------
    const header = document.getElementById('app-header');
    if (header) {
      header.className = 'app-header';
      header.innerHTML =
        '<div class="header-inner">' +
          '<button class="menu-toggle" id="menu-toggle" aria-label="打开菜单">' + icon('menu') + '</button>' +
          '<a class="brand" href="index.html">' + icon('logo') + '<span>' + (s.title || '绝区零 Wiki') + '</span></a>' +
          '<div class="header-search">' +
            '<form id="global-search" autocomplete="off" role="search">' +
              '<span class="search-icon">' + icon('search') + '</span>' +
              '<input type="search" id="search-input" placeholder="搜索角色 / 剧情 / 术语…" aria-label="搜索">' +
              '<div class="search-suggest" id="search-suggest"></div>' +
            '</form>' +
          '</div>' +
          '<div class="header-version">' + (s.gameVersion ? 'Ver ' + s.gameVersion : '') + '</div>' +
        '</div>';
    }

    // ---------- Sidebar ----------
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.className = 'app-sidebar';
      let navHtml = '<div class="sidebar-inner"><nav class="side-nav">';
      nav.forEach(function (item) {
        const active = item.href === curPath ? ' active' : '';
        navHtml += '<a class="side-link' + active + '" href="' + item.href + '">' +
          icon(item.icon) + '<span>' + (item.label || item.href) + '</span></a>';
      });
      navHtml += '</nav></div>';
      sidebar.innerHTML = navHtml;
    }

    // ---------- 移动端遮罩 ----------
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    // ---------- Footer ----------
    const footer = document.getElementById('app-footer');
    if (footer) {
      footer.className = 'app-footer';
      footer.innerHTML =
        '<div class="footer-inner">' +
          '<div class="footer-brand">' + (s.title || '绝区零 Wiki') + ' · ' + (s.subtitle || '') + '</div>' +
          '<div class="footer-meta">基于官方正式剧情与设定整理 · 资料更新于 ' + (s.updatedAt || '—') + '</div>' +
          '<div class="footer-note">本站为非官方粉丝百科，所有内容以官方公布为准。缺失信息统一标注【官方暂未说明】。</div>' +
        '</div>';
    }

    // ---------- 交互绑定 ----------
    const toggle = document.getElementById('menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-open');
      });
    }
    overlay.addEventListener('click', function () {
      document.body.classList.remove('sidebar-open');
    });

    // 初始化站内搜索（搜索框在 Header）
    if (window.ZZZSearch && window.ZZZSearch.init) window.ZZZSearch.init();
  }

  window.ZZZLayout = { render: render };
  document.addEventListener('DOMContentLoaded', render);
})();

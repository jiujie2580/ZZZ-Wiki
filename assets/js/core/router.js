// router.js —— URL 查询参数解析 & 链接构造助手
// 暴露：window.ZZZRouter.getParam / buildLink / currentPageKey
(function () {
  function getParam(key) {
    return new URLSearchParams(location.search).get(key);
  }

  // page: 逻辑名（见 config.pages）；params: {id, faction, ...}
  function buildLink(page, params) {
    const base = window.ZZZ.pages[page] || (page + '.html');
    const qs = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(function (k) {
        if (params[k] != null && params[k] !== '') qs.set(k, params[k]);
      });
    }
    const s = qs.toString();
    return s ? base + '?' + s : base;
  }

  function currentPageKey() {
    const path = location.pathname.split('/').pop() || 'index.html';
    for (const k in window.ZZZ.pages) {
      if (window.ZZZ.pages[k] === path) return k;
    }
    return 'home';
  }

  window.ZZZRouter = {
    getParam: getParam,
    buildLink: buildLink,
    currentPageKey: currentPageKey
  };
})();

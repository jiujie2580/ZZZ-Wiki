// data-loader.js —— JSON 加载 + 内存缓存 + 错误兜底
// 暴露：window.ZZZData.loadJSON(name)
(function () {
  const cache = new Map();

  // name 既可以是 dataFiles 里的逻辑名，也可以直接是文件名（不含扩展名）
  async function loadJSON(name) {
    if (cache.has(name)) return cache.get(name);
    const fileName = (window.ZZZ.dataFiles[name] || name) + '.json';
    const url = window.ZZZ.dataBase + fileName;
    const p = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error('[data-loader] 加载失败:', url, err);
        return { __error: true, message: err.message, url: url };
      });
    cache.set(name, p);
    return p;
  }

  window.ZZZData = { loadJSON: loadJSON };
})();

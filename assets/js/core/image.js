// image.js —— 图片系统核心（v1.1.0）
// 暴露：window.ZZZImage
// 设计原则（见 Design Review D1-D7）：
//   - 数据驱动：图片路径来自各实体 JSON，本文件不持有任何内容
//   - 缺失即降级：无图 / 加载失败 → 玻璃拟态占位，绝不破图
//   - 性能：loading=lazy + 可选 srcset + 灯箱打开才加载原图（D6，已取消 LQIP）
//   - 关闭模式：?no-images=true 或 localStorage zzz_disable_images=true（D7）
//   - 安全：所有输出经 ZZZUI.esc() 转义，避免 XSS
(function () {
  var UNKNOWN = '【官方暂未说明】';

  function esc(s) {
    var f = window.ZZZUI && window.ZZZUI.esc;
    if (f) return f(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- 关闭模式（D7） ----------
  function setStored(v) {
    try { window.localStorage.setItem('zzz_disable_images', v ? 'true' : 'false'); } catch (e) {}
  }
  function isDisabled() {
    try {
      var params = new URLSearchParams(window.location.search);
      var p = params.get('no-images');
      if (p === 'true') { setStored(true); return true; }
      if (p === 'false') { setStored(false); return false; }
    } catch (e) {}
    try { return window.localStorage.getItem('zzz_disable_images') === 'true'; } catch (e) { return false; }
  }

  // 缓存破坏：图片 URL 追加 ?v=<gameVersion>（与 JSON 缓存策略一致）；外链与已带参数者跳过
  function cacheBust(src, enable) {
    if (enable === false) return src;
    if (!src || /^https?:\/\//i.test(src) || src.indexOf('?') !== -1) return src;
    var v = (window.ZZZ && window.ZZZ.gameVersion) || '';
    return v ? src + '?v=' + encodeURIComponent(v) : src;
  }

  // ---------- 懒加载图片（D6） ----------
  // opts: { src, alt, srcset, sizes, cls, lazy, bare, cacheBust, kind }
  //   bare=true  → 只返回 <img>，由调用方放入自己的容器（如 .avatar）
  //   关闭模式或无 src → 返回空串（调用方据此决定是否渲染占位容器）
  function lazyImg(opts) {
    opts = opts || {};
    if (isDisabled() || !opts.src) return '';
    var cls = 'zzz-img' + (opts.cls ? ' ' + opts.cls : '');
    var attrs = (opts.lazy !== false ? ' loading="lazy"' : '') + ' decoding="async"';
    if (opts.srcset) attrs += ' srcset="' + esc(opts.srcset) + '"';
    if (opts.sizes) attrs += ' sizes="' + esc(opts.sizes) + '"';
    var img = '<img class="' + cls + '" src="' + esc(cacheBust(opts.src, opts.cacheBust)) +
      '" alt="' + esc(opts.alt || '') + '"' + attrs +
      ' onerror="ZZZImage.imgFallback(this)">';
    if (opts.bare) return img;
    return '<span class="zzz-img-wrap">' + img +
      '<span class="zzz-img-fallback">图片缺失</span></span>';
  }

  // 加载失败兜底：隐藏破图，显示玻璃拟态占位
  function imgFallback(img) {
    try {
      var wrap = img.parentNode;
      if (wrap && wrap.classList && wrap.classList.contains('zzz-img-wrap')) {
        wrap.classList.add('zzz-img--fail');
        return;
      }
      if (img.parentNode) {
        var ph = document.createElement('span');
        ph.className = 'zzz-img zzz-img--fail';
        ph.textContent = '图片缺失';
        img.parentNode.replaceChild(ph, img);
      }
    } catch (e) {}
  }

  // ---------- 画廊（grid + 灯箱触发） ----------
  function gallery(items) {
    if (isDisabled()) {
      return '<p class="img-disabled-note">图片已关闭（在网址后加 <code>?no-images=false</code> 可重新开启）。</p>';
    }
    if (!items || !items.length) {
      return '<p class="rel-empty"><span class="unknown">' + UNKNOWN + '</span></p>';
    }
    var kindMap = {}, srcMap = {};
    (window.ZZZ && window.ZZZ.imageKinds || []).forEach(function (k) { kindMap[k.id] = k.label; });
    (window.ZZZ && window.ZZZ.imageSourceTypes || []).forEach(function (k) { srcMap[k.id] = k.label; });

    var html = items.map(function (it) {
      var src = it.src || '';
      if (!src) return '';
      var full = it.full || src;
      var alt = it.caption || it.alt || '';
      var kindBadge = (it.kind && kindMap[it.kind])
        ? '<span class="badge badge-cyan">' + esc(kindMap[it.kind]) + '</span>' : '';
      var srcBadge = '';
      if (it.source) {
        var lbl = srcMap[it.source.type] || '来源';
        srcBadge = it.source.url
          ? '<a class="source-link" href="' + esc(it.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(lbl) + ' ↗</a>'
          : '<span class="badge badge-default">' + esc(lbl) + '</span>';
      }
      return '<button type="button" class="gallery-item" data-full="' + esc(cacheBust(full, true)) +
        '" data-alt="' + esc(alt) + '" data-caption="' + esc(it.caption || '') + '">' +
        '<span class="zzz-img-wrap">' +
          '<img class="zzz-img" src="' + esc(cacheBust(src, true)) + '" loading="lazy" decoding="async" alt="' + esc(alt) +
          '" onerror="ZZZImage.imgFallback(this)">' +
          '<span class="zzz-img-fallback">图片缺失</span>' +
        '</span>' +
        '<span class="gallery-meta">' +
          '<span class="gallery-badges">' + kindBadge + srcBadge + '</span>' +
          (it.caption ? '<span class="gallery-caption">' + esc(it.caption) + '</span>' : '') +
        '</span>' +
      '</button>';
    }).filter(Boolean).join('');

    return '<div class="gallery-grid">' + html + '</div>';
  }

  // ---------- 灯箱（单例模态，原图按需加载） ----------
  function ensureLightbox() {
    if (document.getElementById('zzz-lightbox')) return;
    var el = document.createElement('div');
    el.id = 'zzz-lightbox';
    el.className = 'lightbox';
    el.hidden = true;
    el.innerHTML =
      '<div class="lightbox-backdrop" data-lightbox-close></div>' +
      '<div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="图片查看">' +
        '<button type="button" class="lightbox-close" data-lightbox-close aria-label="关闭">×</button>' +
        '<div class="lightbox-stage"><img class="lightbox-img" alt=""></div>' +
        '<div class="lightbox-caption"></div>' +
      '</div>';
    document.body.appendChild(el);
  }

  function openLightbox(src, alt, caption) {
    ensureLightbox();
    var lb = document.getElementById('zzz-lightbox');
    var img = lb.querySelector('.lightbox-img');
    img.alt = alt || '';
    img.src = src; // 仅在此刻加载原图（D6）
    lb.querySelector('.lightbox-caption').textContent = caption || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('zzz-lightbox');
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    var img = lb.querySelector('.lightbox-img');
    if (img) img.removeAttribute('src');
    document.body.style.overflow = '';
  }

  // 事件委托：画廊点击打开，遮罩/关闭按钮/Esc 关闭（脚本加载即绑定，画廊后注入亦可捕获）
  document.addEventListener('click', function (e) {
    var item = e.target.closest ? e.target.closest('.gallery-item') : null;
    if (item) {
      openLightbox(item.getAttribute('data-full'), item.getAttribute('data-alt') || '', item.getAttribute('data-caption') || '');
      return;
    }
    if (e.target.closest('[data-lightbox-close]')) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  window.ZZZImage = {
    isDisabled: isDisabled,
    setDisabled: function (v) { setStored(v); },
    lazyImg: lazyImg,
    gallery: gallery,
    imgFallback: imgFallback,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    ensureLightbox: ensureLightbox
  };
})();

// self-test.js —— Story 模块无头自测（jsdom）
// 通过注入本地 fetch polyfill + 按 HTML 顺序注入脚本 + 手动触发 DOMContentLoaded，
// 验证列表页渲染/筛选/排序、详情页渲染/关联/上一章下一章/剧透折叠无运行时错误。
// 运行：node test/self-test.js（需 jsdom：npm i jsdom）
const { JSDOM, VirtualConsole } = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets', 'js');

const CORE_SCRIPTS = [
  'config.js',
  'core/data-loader.js',
  'core/router.js',
  'core/components.js',
  'core/layout.js',
  'core/search.js'
];

function readScript(rel) {
  return fs.readFileSync(path.join(JS_DIR, rel), 'utf-8');
}

// 本地 fetch polyfill：将 data/xxx.json 从磁盘读出
function makeFetch() {
  return async function fetch(url) {
    const p = path.join(ROOT, url);
    const text = fs.readFileSync(p, 'utf-8');
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(text),
      text: async () => text
    };
  };
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  PASS ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}

async function loadPage(pageFile, query) {
  const html = fs.readFileSync(path.join(ROOT, pageFile), 'utf-8');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', function (e) { errors.push('jsdomError: ' + (e && e.message)); });
  const dom = new JSDOM(html, {
    url: 'https://localhost/' + pageFile + (query || ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const { window } = dom;
  window.fetch = makeFetch();
  window.addEventListener('error', function (e) { errors.push('window.error: ' + (e.error && e.error.message || e.message)); });

  const pageScript = pageFile.replace('.html', '.js');
  const all = CORE_SCRIPTS.concat(['pages/' + pageScript]);
  for (const s of all) {
    try { window.eval(readScript(s)); }
    catch (e) { errors.push('eval ' + s + ': ' + e.message); }
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(function (r) { setTimeout(r, 200); }); // 等待异步 init 完成
  return { window: window, document: window.document, errors: errors };
}

(async function main() {
  console.log('=== Story 列表页自测 ===');
  const s = await loadPage('story.html');
  assert(s.errors.length === 0, '列表页无运行时错误 ' + JSON.stringify(s.errors));
  const cards = s.document.querySelectorAll('#story-list .story-card');
  assert(cards.length === 43, '渲染 43 张卡片，实际 ' + cards.length);
  assert(/共\s*43\s*条剧情/.test(s.document.getElementById('story-count').textContent),
    '计数文案正确：' + s.document.getElementById('story-count').textContent);
  assert(s.document.querySelectorAll('#story-types .tag').length === 5, '类型 chips = 全部 + 4 类');
  assert(s.document.querySelectorAll('#story-versions .tag').length === 19, '版本 chips = 全部 + 18 版本');
  // 首张卡应为序章（剧情顺序默认）
  assert(/序章/.test(cards[0].textContent), '默认顺序首卡为序章');

  // 筛选：点击「主线」应剩 20
  const mainBtn = s.document.querySelector('#story-types .tag[data-type="main"]');
  mainBtn.click();
  assert(s.document.querySelectorAll('#story-list .story-card').length === 20, '筛选主线后 20 张');
  const specialBtn = s.document.querySelector('#story-types .tag[data-type="special"]');
  specialBtn.click();
  assert(s.document.querySelectorAll('#story-list .story-card').length === 3, '筛选特别篇后 3 张');
  const agentBtn = s.document.querySelector('#story-types .tag[data-type="agent"]');
  agentBtn.click();
  assert(s.document.querySelectorAll('#story-list .story-card').length === 17, '筛选代理人剧情后 17 张');
  const eventBtn = s.document.querySelector('#story-types .tag[data-type="event"]');
  eventBtn.click();
  assert(s.document.querySelectorAll('#story-list .story-card').length === 3, '筛选活动剧情后 3 张');
  // 版本筛选：全部 重置
  s.document.querySelector('#story-types .tag[data-type="all"]').click();
  // 搜索
  const q = s.document.getElementById('story-q');
  q.value = '云霞同归处';
  q.dispatchEvent(new s.window.Event('input'));
  assert(s.document.querySelectorAll('#story-list .story-card').length === 1, '搜索「云霞同归处」命中 1 条');

  console.log('=== 详情页自测（主线首章）===');
  const c1 = await loadPage('chapter.html', '?id=s1-prologue');
  assert(c1.errors.length === 0, '详情页无运行时错误 ' + JSON.stringify(c1.errors));
  assert(/序章\s*生意×诡异×道义/.test(c1.document.querySelector('#content h1').textContent), '标题正确');
  assert(c1.document.querySelectorAll('#content .detail-section').length >= 7, '分节数 >= 7，实际 ' +
    c1.document.querySelectorAll('#content .detail-section').length);
  assert(c1.document.querySelector('#chapter-nav .chapter-nav-link.next'), '首章有「下一章」');
  assert(!c1.document.querySelector('#chapter-nav .chapter-nav-link.prev'), '首章无「上一章」');
  assert(c1.document.querySelectorAll('#content .rel-chip').length >= 5, '关联 chip >= 5（4 角色 + 1 势力），实际 ' +
    c1.document.querySelectorAll('#content .rel-chip').length);

  console.log('=== 详情页自测（主线中段章节：第一季尾音·下，order=10）===');
  const c2 = await loadPage('chapter.html', '?id=s1-finale-2');
  assert(c2.errors.length === 0, '中段章节无错误 ' + JSON.stringify(c2.errors));
  assert(c2.document.querySelector('#chapter-nav .chapter-nav-link.prev'), '中段章节有「上一章」');
  assert(c2.document.querySelector('#chapter-nav .chapter-nav-link.next'), '中段章节有「下一章」（按 type+order 计算）');

  console.log('=== 详情页自测（剧透折叠：3.0 第一章）===');
  const c3 = await loadPage('chapter.html', '?id=s3-ch1');
  assert(c3.errors.length === 0, '3.0 章节无错误 ' + JSON.stringify(c3.errors));
  const toggle = c3.document.getElementById('spoiler-toggle');
  const content = c3.document.getElementById('spoiler-content');
  assert(toggle && content, '存在剧透折叠按钮与内容块');
  assert(content.hasAttribute('hidden'), '初始隐藏剧透内容');
  toggle.click();
  assert(!content.hasAttribute('hidden'), '点击后展开剧透内容');
  assert(c3.document.querySelector('#content a.source-link') &&
    /zzz\.mihoyo\.com\/main/.test(c3.document.querySelector('#content').innerHTML), '来源外链正确');
  assert(!c3.document.querySelector('#chapter-nav .chapter-nav-link.next'), '3.0 为当前主线最后一章，无「下一章」');
  assert(c3.document.querySelector('#chapter-nav .chapter-nav-link.prev'), '3.0 章节有「上一章」');

  console.log('=== 详情页自测（特别篇 / 代理人剧情 导航隔离）===');
  const c4 = await loadPage('chapter.html', '?id=special-undercover-blues');
  assert(c4.errors.length === 0, '特别篇无错误 ' + JSON.stringify(c4.errors));
  assert(c4.document.querySelector('#chapter-nav .chapter-nav-link.next'), '特别篇第一篇有下一章');
  assert(!c4.document.querySelector('#chapter-nav .chapter-nav-link.prev'), '特别篇第一篇无上一章');
  const c5 = await loadPage('chapter.html', '?id=agent-nekomata');
  assert(c5.errors.length === 0, '代理人剧情无错误 ' + JSON.stringify(c5.errors));
  assert(c5.document.querySelector('#chapter-nav .chapter-nav-link.prev') &&
    c5.document.querySelector('#chapter-nav .chapter-nav-link.next'), '代理人剧情存在上一章/下一章');

  console.log('=== 详情页自测（未知 id 降级）===');
  const c6 = await loadPage('chapter.html', '?id=does-not-exist');
  assert(c6.errors.length === 0, '未知 id 无错误 ' + JSON.stringify(c6.errors));
  assert(/未找到指定条目/.test(c6.document.querySelector('#content').textContent), '未知 id 显示提示');

  console.log('=== Timeline 列表页自测 ===');
  const t = await loadPage('timeline.html');
  assert(t.errors.length === 0, '列表页无运行时错误 ' + JSON.stringify(t.errors));
  const tItems = t.document.querySelectorAll('#timeline-track .timeline-item');
  assert(tItems.length === 16, '渲染 16 个事件，实际 ' + tItems.length);
  assert(/共\s*16\s*个事件/.test(t.document.getElementById('timeline-count').textContent),
    '计数文案正确：' + t.document.getElementById('timeline-count').textContent);
  assert(t.document.querySelectorAll('#timeline-eras .tag').length === 5, '纪元 chips = 全部 + 4 纪元');
  assert(t.document.querySelectorAll('#timeline-cats .tag').length === 8, '分类 chips = 全部 + 7 分类');
  assert(/旧文明时代/.test(tItems[0].textContent), '默认时间顺序首事件为旧文明时代');
  // 纪元筛选：空洞灾害时期 -> 2
  t.document.querySelector('#timeline-eras .tag[data-era="hollow-disaster"]').click();
  assert(t.document.querySelectorAll('#timeline-track .timeline-item').length === 2, '筛选空洞灾害时期后 2 个');
  t.document.querySelector('#timeline-eras .tag[data-era="all"]').click();
  // 分类筛选：组织事件 -> 6
  t.document.querySelector('#timeline-cats .tag[data-cat="organization"]').click();
  assert(t.document.querySelectorAll('#timeline-track .timeline-item').length === 6, '筛选组织事件后 6 个');
  t.document.querySelector('#timeline-cats .tag[data-cat="all"]').click();
  // 展开含关联的事件（序章 · 猫的失物招领）
  const tToggle = t.document.querySelector('#timeline-track .timeline-item[data-id="prologue-cat"] .timeline-toggle');
  tToggle.click();
  assert(t.document.querySelector('#timeline-track .timeline-item.expanded'), '点击后出现 expanded');
  assert(!t.document.querySelector('#timeline-track .timeline-item.expanded .timeline-detail').hasAttribute('hidden'), '展开后 detail 可见');
  assert(t.document.querySelectorAll('#timeline-track .timeline-item.expanded .rel-chip').length >= 1, '展开后关联 chip 渲染');

  console.log('=== Timeline 详情页自测（?id=prologue-cat）===');
  const td = await loadPage('timeline.html', '?id=prologue-cat');
  assert(td.errors.length === 0, '详情页无错误 ' + JSON.stringify(td.errors));
  assert(/序章/.test(td.document.querySelector('#content h1').textContent), '详情标题正确');
  assert(td.document.querySelector('#content .timeline-item.highlight'), '目标事件高亮');
  assert(td.document.querySelector('#content .chapter-nav-link'), '存在上/下事件导航');
  assert(td.document.querySelectorAll('#content .rel-chip').length >= 1, '关联 chip >= 1（狡兔屋/剧情）');

  console.log('=== Timeline 详情页自测（未知 id 降级）===');
  const td2 = await loadPage('timeline.html', '?id=does-not-exist');
  assert(td2.errors.length === 0, '未知 id 无错误 ' + JSON.stringify(td2.errors));
  assert(/未找到指定事件/.test(td2.document.querySelector('#content').textContent), '未知 id 提示');

  console.log('\n=== 结果：PASS=' + pass + '  FAIL=' + fail + ' ===');
  process.exit(fail === 0 ? 0 : 1);
})().catch(function (e) {
  console.error('自测崩溃：', e);
  process.exit(1);
});

// self-test.js —— Story / Timeline / Locations / Worldview 模块无头自测（jsdom）
// 通过注入本地 fetch polyfill + 按 HTML 顺序注入脚本 + 手动触发 DOMContentLoaded，
// 验证列表页渲染/筛选/排序、详情页渲染/关联/父-子导航/未知 id 降级无运行时错误。
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

  console.log('=== Locations 列表页自测 ===');
  const ls = await loadPage('locations.html');
  assert(ls.errors.length === 0, '列表页无运行时错误 ' + JSON.stringify(ls.errors));
  const locCards = ls.document.querySelectorAll('#location-grid .location-card');
  assert(locCards.length === 7, '渲染 7 张卡片，实际 ' + locCards.length);
  assert(/共\s*7\s*个地区/.test(ls.document.getElementById('location-count').textContent),
    '计数文案正确：' + ls.document.getElementById('location-count').textContent);
  assert(ls.document.querySelectorAll('#location-cats .tag').length === 7, '类型 chips = 全部 + 6 类');
  // 搜索（用唯一词，避免摘要中复用名称造成多命中）
  const lq = ls.document.getElementById('location-q');
  lq.value = '斯科特哨站';
  lq.dispatchEvent(new ls.window.Event('input'));
  assert(ls.document.querySelectorAll('#location-grid .location-card').length === 1, '搜索「斯科特哨站」命中 1 条');
  lq.value = '';
  lq.dispatchEvent(new ls.window.Event('input'));
  // 类型筛选：building -> 2
  ls.document.querySelector('#location-cats .tag[data-cat="building"]').click();
  assert(ls.document.querySelectorAll('#location-grid .location-card').length === 2, '筛选 building 后 2 张');
  ls.document.querySelector('#location-cats .tag[data-cat="all"]').click();
  // 排序：按类型 -> 首卡应为 city（新艾利都）
  ls.document.querySelector('#location-sort .tag[data-sort="category"]').click();
  assert(/新艾利都/.test(ls.document.querySelector('#location-grid .location-card .location-card-name').textContent),
    '按类型排序后首卡为城市「新艾利都」');
  ls.document.querySelector('#location-sort .tag[data-sort="name"]').click();
  // 视图切换：层级
  ls.document.querySelector('#location-view .tag[data-view="tree"]').click();
  assert(ls.document.querySelectorAll('#location-grid .location-tree-node').length === 7, '层级视图渲染 7 个节点');
  ls.document.querySelector('#location-view .tag[data-view="grid"]').click();
  assert(ls.document.querySelectorAll('#location-grid .location-card').length === 7, '切回卡片视图恢复 7 张');

  console.log('=== Location 详情页自测（?id=random-play，父-子+反向关联）===');
  const dl = await loadPage('location.html', '?id=random-play');
  assert(dl.errors.length === 0, '详情页无运行时错误 ' + JSON.stringify(dl.errors));
  assert(/录像店/.test(dl.document.querySelector('#content h1').textContent), '标题正确');
  assert(dl.document.querySelectorAll('#content .detail-section').length >= 8, '分节数 >= 8，实际 ' +
    dl.document.querySelectorAll('#content .detail-section').length);
  // 父地区（D6）：六分街
  const parentChip = Array.prototype.find.call(dl.document.querySelectorAll('#content .rel-chip'),
    function (c) { return c.textContent.trim() === '六分街'; });
  assert(parentChip, '父地区「六分街」渲染为可点击 chip');
  // 子地区（D6）：random-play 无子地区 -> UNKNOWN
  const childSec = dl.document.querySelectorAll('#content .detail-section')[2];
  assert(childSec && /子地区/.test(childSec.querySelector('h2').textContent), '存在「子地区」分节');
  assert(childSec.querySelector('.rel-empty'), '子地区为空 -> 【官方暂未说明】');
  // 关联剧情（sec 3）：1 / 关联事件（sec 4）：3 / 关联势力（sec 5）：2 / 关联术语（sec 6）：空
  const secStory = dl.document.querySelectorAll('#content .detail-section')[3];
  const secTime = dl.document.querySelectorAll('#content .detail-section')[4];
  const secFac = dl.document.querySelectorAll('#content .detail-section')[5];
  const secTerm = dl.document.querySelectorAll('#content .detail-section')[6];
  assert(secStory.querySelectorAll('.rel-chip').length === 1, '关联剧情 1 个 chip，实际 ' + secStory.querySelectorAll('.rel-chip').length);
  assert(secTime.querySelectorAll('.rel-chip').length === 3, '关联事件 3 个 chip，实际 ' + secTime.querySelectorAll('.rel-chip').length);
  assert(secFac.querySelectorAll('.rel-chip').length === 2, '关联势力 2 个 chip，实际 ' + secFac.querySelectorAll('.rel-chip').length);
  assert(secTerm.querySelector('.rel-empty'), '关联术语为空 -> 【官方暂未说明】');
  // 来源
  assert(dl.document.querySelector('#content .source-text'), '渲染引用来源区块');

  console.log('=== Location 详情页自测（?id=new-eridu，根节点父-子）===');
  const dn = await loadPage('location.html', '?id=new-eridu');
  assert(dn.errors.length === 0, '详情页无运行时错误 ' + JSON.stringify(dn.errors));
  assert(/新艾利都/.test(dn.document.querySelector('#content h1').textContent), '标题正确');
  // 父地区：根节点 -> UNKNOWN
  const parentField = Array.prototype.find.call(dn.document.querySelectorAll('#content .field'),
    function (f) { return /所属上级/.test(f.querySelector('.field-label').textContent); });
  assert(parentField && parentField.querySelector('.unknown'), '根节点父地区 -> 【官方暂未说明】');
  // 子地区：4 个
  const childSecN = Array.prototype.find.call(dn.document.querySelectorAll('#content .detail-section'),
    function (s) { return /子地区/.test(s.querySelector('h2').textContent); });
  assert(childSecN && childSecN.querySelectorAll('.rel-chip').length === 4, '子地区 4 个 chip，实际 ' +
    (childSecN ? childSecN.querySelectorAll('.rel-chip').length : 'NA'));
  // 关联事件 2 / 关联势力 4 / 关联术语 2
  const secsN = dn.document.querySelectorAll('#content .detail-section');
  assert(secsN[4].querySelectorAll('.rel-chip').length === 2, '关联事件 2 个 chip，实际 ' + secsN[4].querySelectorAll('.rel-chip').length);
  assert(secsN[5].querySelectorAll('.rel-chip').length === 4, '关联势力 4 个 chip，实际 ' + secsN[5].querySelectorAll('.rel-chip').length);
  assert(secsN[6].querySelectorAll('.rel-chip').length === 2, '关联术语 2 个 chip，实际 ' + secsN[6].querySelectorAll('.rel-chip').length);

  console.log('=== Location 详情页自测（未知 id 降级）===');
  const dx = await loadPage('location.html', '?id=does-not-exist');
  assert(dx.errors.length === 0, '未知 id 无错误 ' + JSON.stringify(dx.errors));
  assert(/未找到指定地区/.test(dx.document.querySelector('#content').textContent), '未知 id 显示提示');

  console.log('=== Worldview 列表页自测 ===');
  const wv = await loadPage('worldview.html');
  assert(wv.errors.length === 0, '列表页无运行时错误 ' + JSON.stringify(wv.errors));
  const wvCards = wv.document.querySelectorAll('#worldview-grid .worldview-card');
  assert(wvCards.length === 8, '渲染 8 张卡片，实际 ' + wvCards.length);
  assert(/共\s*8\s*个条目/.test(wv.document.getElementById('worldview-count').textContent),
    '计数文案正确：' + wv.document.getElementById('worldview-count').textContent);
  assert(wv.document.querySelectorAll('#worldview-cats .tag').length === 7, '分类 chips = 全部 + 6 类');
  assert(wv.document.querySelectorAll('#worldview-sort .tag').length === 3, '排序 chips = 分类/名称/更新');
  assert(/旧文明与旧都/.test(wvCards[0].textContent), '默认分类顺序首卡为「旧文明与旧都」');
  // 分类筛选：society -> 2
  wv.document.querySelector('#worldview-cats .tag[data-cat="society"]').click();
  assert(wv.document.querySelectorAll('#worldview-grid .worldview-card').length === 2, '筛选 society 后 2 张');
  // 分类筛选：technology -> 2
  wv.document.querySelector('#worldview-cats .tag[data-cat="technology"]').click();
  assert(wv.document.querySelectorAll('#worldview-grid .worldview-card').length === 2, '筛选 technology 后 2 张');
  wv.document.querySelector('#worldview-cats .tag[data-cat="all"]').click();
  // 搜索（唯一词）
  const wq = wv.document.getElementById('worldview-q');
  wq.value = '绳匠';
  wq.dispatchEvent(new wv.window.Event('input'));
  assert(wv.document.querySelectorAll('#worldview-grid .worldview-card').length === 1, '搜索「绳匠」命中 1 条');
  wq.value = '';
  wq.dispatchEvent(new wv.window.Event('input'));
  // 排序：名称 -> 首卡不再是分类顺序首卡
  wv.document.querySelector('#worldview-sort .tag[data-sort="name"]').click();
  const nameFirst = wv.document.querySelector('#worldview-grid .worldview-card .worldview-card-title').textContent;
  assert(nameFirst !== '旧文明与旧都', '名称排序后首卡改变（实际「' + nameFirst + '」）');
  wv.document.querySelector('#worldview-sort .tag[data-sort="category"]').click();

  console.log('=== Worldview 详情页自测（?id=proxy-and-agents，含 5 路关联）===');
  const wd = await loadPage('worldview.html', '?id=proxy-and-agents');
  assert(wd.errors.length === 0, '详情页无运行时错误 ' + JSON.stringify(wd.errors));
  assert(/绳匠与代理人体系/.test(wd.document.querySelector('#content h1').textContent), '标题正确');
  const wSecs = wd.document.querySelectorAll('#content .detail-section');
  assert(wSecs.length >= 8, '分节数 >= 8（基本信息/设定详情/5关联/来源），实际 ' + wSecs.length);
  assert(wd.document.getElementById('worldview-spoiler-toggle') === null, '非剧透条目（spoiler=false）无剧透折叠按钮');
  // 各关联分节 chip 数（渲染顺序：关联时间线/势力/地区/术语/剧情）
  assert(wSecs[2].querySelectorAll('.rel-chip').length === 2, '关联时间线 2 chip，实际 ' + wSecs[2].querySelectorAll('.rel-chip').length);
  assert(wSecs[3].querySelectorAll('.rel-chip').length === 3, '关联势力 3 chip，实际 ' + wSecs[3].querySelectorAll('.rel-chip').length);
  assert(wSecs[4].querySelectorAll('.rel-chip').length === 2, '关联地区 2 chip，实际 ' + wSecs[4].querySelectorAll('.rel-chip').length);
  assert(wSecs[5].querySelectorAll('.rel-chip').length === 2, '关联术语 2 chip，实际 ' + wSecs[5].querySelectorAll('.rel-chip').length);
  assert(wSecs[6].querySelectorAll('.rel-chip').length === 2, '关联剧情 2 chip，实际 ' + wSecs[6].querySelectorAll('.rel-chip').length);
  assert(wd.document.querySelector('#content .chapter-nav-link.prev') &&
    !wd.document.querySelector('#content .chapter-nav-link.next'), 'society 为末类，proxy-and-agents 有上一（空洞治理与探索体系）但无下一');
  assert(wd.document.querySelector('#content .source-text'), '渲染引用来源区块');

  console.log('=== Worldview 详情页自测（中间条目 ?id=combat-equipment-tech，上下均有）===');
  const wc = await loadPage('worldview.html', '?id=combat-equipment-tech');
  assert(wc.errors.length === 0, '中间条目无错误 ' + JSON.stringify(wc.errors));
  assert(/战斗装备技术/.test(wc.document.querySelector('#content h1').textContent), '标题正确');
  assert(wc.document.querySelector('#content .chapter-nav-link.prev') &&
    wc.document.querySelector('#content .chapter-nav-link.next'), '存在上一/下一条目导航（technology 位于中间类）');
  // 关联术语 3 chip（w-engine / drive-disc / ether）；其余 4 路为空 -> UNKNOWN
  const wSecsC = wc.document.querySelectorAll('#content .detail-section');
  assert(wSecsC[5].querySelectorAll('.rel-chip').length === 3, '关联术语 3 chip，实际 ' + wSecsC[5].querySelectorAll('.rel-chip').length);
  assert(wSecsC[3].querySelector('.rel-empty'), '关联势力为空 -> 【官方暂未说明】');
  assert(wSecsC[6].querySelector('.rel-empty'), '关联剧情为空 -> 【官方暂未说明】');

  console.log('=== Worldview 详情页自测（分类顺序首条 ?id=old-civilization-and-eridu，无 prev）===');
  const wf = await loadPage('worldview.html', '?id=old-civilization-and-eridu');
  assert(wf.errors.length === 0, '首条详情无错误 ' + JSON.stringify(wf.errors));
  assert(wf.document.querySelector('#content .chapter-nav-link.next'), '首条有「下一个条目」');
  assert(!wf.document.querySelector('#content .chapter-nav-link.prev'), '首条无「上一个条目」');

  console.log('=== Worldview 详情页自测（未知 id 降级）===');
  const wx = await loadPage('worldview.html', '?id=does-not-exist');
  assert(wx.errors.length === 0, '未知 id 无错误 ' + JSON.stringify(wx.errors));
  assert(/未找到指定世界观条目/.test(wx.document.querySelector('#content').textContent), '未知 id 显示提示');

  console.log('\n=== 结果：PASS=' + pass + '  FAIL=' + fail + ' ===');
  process.exit(fail === 0 ? 0 : 1);
})().catch(function (e) {
  console.error('自测崩溃：', e);
  process.exit(1);
});

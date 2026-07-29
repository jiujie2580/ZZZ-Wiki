// 全局配置：所有页面共用一份 window.ZZZ
// 路径使用相对路径，方便部署到 GitHub Pages / Netlify / Vercel 等静态平台
window.ZZZ = {
  siteTitle: '绝区零 Wiki',
  // 资源与数据基路径（相对根目录）
  assetBase: 'assets/',
  dataBase: 'data/',
  iconBase: 'assets/icons/sprite.svg',
  // 当前游戏版本（更新新版本时改这里 + 对应 JSON）
  gameVersion: '3.0',

  // 势力分类受控词表（单一数据源）：data/factions.json 的 category 存此 id，label 用于展示
  // 筛选/排序/渲染共用同一份，新增分类只需改这里，不散落页面逻辑。
  factionCategories: [
    { id: 'faction',     label: '阵营' },
    { id: 'organization', label: '组织' },
    { id: 'institution', label: '机构' },
    { id: 'network',     label: '网络' }
  ],

  // 角色属性受控词表（单一数据源）：data/characters.json 的 attribute 存此 id，label 用于展示/筛选
  // 含 3.0 新增「风」与 2.0 新增「玄墨 / 凛刃」；发布新属性只需改这里。
  characterAttributes: [
    { id: 'physical',   label: '物理' },
    { id: 'fire',       label: '火' },
    { id: 'ice',        label: '冰' },
    { id: 'electric',   label: '电' },
    { id: 'ether',      label: '以太' },
    { id: 'wind',       label: '风' },
    { id: 'auric-ink',  label: '玄墨' },
    { id: 'honed-edge', label: '凛刃' }
  ],

  // 角色稀有度受控词表（单一数据源）
  characterRarities: [
    { id: 'S', label: 'S 级' },
    { id: 'A', label: 'A 级' }
  ],

  // 剧情类型受控词表（单一数据源）：data/story.json 的 type 存此 id，label 用于展示/筛选
  // 新增类型只需改这里，页面逻辑不得硬编码类型字符串。
  storyTypes: [
    { id: 'main',    label: '主线' },
    { id: 'special', label: '特别篇' },
    { id: 'agent',   label: '代理人剧情' },
    { id: 'event',   label: '活动剧情' }
  ],

  // 时间线纪元受控词表（单一数据源）：data/timeline.json 的 era 存此 id
  // 筛选/展示/排序共用同一份，新增纪元只需改这里，不散落页面逻辑。
  timelineEras: [
    { id: 'old-civilization', label: '旧文明时代' },
    { id: 'hollow-disaster',  label: '空洞灾害时期' },
    { id: 'new-eridu',        label: '新艾利都时期' },
    { id: 'present',          label: '当前时间线' }
  ],

  // 时间线分类受控词表（单一数据源）：data/timeline.json 的 category 存此 id
  // 取消 importance（属编辑判断），改用更客观的分类词表（D3 决策）
  timelineCategories: [
    { id: 'disaster',     label: '灾害' },
    { id: 'history',      label: '历史事件' },
    { id: 'organization', label: '组织事件' },
    { id: 'character',    label: '人物事件' },
    { id: 'war',          label: '战争' },
    { id: 'tech',         label: '科技' },
    { id: 'exploration',  label: '探索' }
  ],

  // 数据文件清单：逻辑名 -> data 目录下的文件名（不含 .json）
  dataFiles: {
    site: 'site',
    version: 'version',
    story: 'story',
    characters: 'characters',
    factions: 'factions',
    locations: 'locations',
    glossary: 'glossary',
    timeline: 'timeline',
    enemies: 'enemies',
    bangboo: 'bangboo',
    wEngines: 'w-engines',
    driveDiscs: 'drive-discs'
  },

  // 页面路由：逻辑名 -> html 文件名（统一在此登记，导航/链接只引用逻辑名）
  pages: {
    home: 'index.html',
    worldview: 'worldview.html',
    story: 'story.html',
    chapter: 'chapter.html',
    characters: 'characters.html',
    character: 'character.html',
    factions: 'factions.html',
    faction: 'faction.html',
    locations: 'locations.html',
    location: 'location.html',
    timeline: 'timeline.html',
    glossary: 'glossary.html',
    term: 'term.html',
    changelog: 'changelog.html',
    search: 'search.html',
    about: 'about.html'
  }
};

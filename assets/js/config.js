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

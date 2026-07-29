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

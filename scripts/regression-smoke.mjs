/**
 * 跨阶段交互回归（headless Chrome + CDP，零第三方依赖）。
 *
 * 与 `verify-dist` / `smoke:preview` 的分工：那两个只验静态产物，本脚本验**运行时集成** ——
 * P3 动态路由 → P4 四布局 → P5/P11 主题 → P6 页签 → P7 i18n → P9 设置抽屉/水印/面包屑 → P3.5 菜单配置页。
 *
 * 前置（本地）：`pnpm dev:server`（3001）+ `pnpm dev:web`（5173）
 * 用法：`pnpm smoke:regression`
 * 浏览器解析顺序：`CHROME_PATH` → 常见安装路径（Windows：Chrome/Edge；macOS：Chrome/Edge；Linux：google-chrome/chromium）
 * 找不到浏览器时**跳过并退出 0**（该脚本是本地/独立回归工具，不阻塞 CI 门禁）。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

const APP = process.env.APP_ORIGIN ?? 'http://localhost:5173'
const API = process.env.API_ORIGIN ?? 'http://localhost:3001'
const CDP_PORT = Number(process.env.CDP_PORT ?? 9222)

const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` :: ${extra}` : ''}`)
}

async function waitFor(fn, { timeout = 30_000, interval = 200, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout
  for (;;) {
    try {
      const value = await fn()
      if (value) return value
    } catch {
      // 未就绪，继续轮询
    }
    if (Date.now() > deadline) throw new Error(`超时等待：${label}`)
    await sleep(interval)
  }
}

/** 跨平台解析浏览器可执行文件；找不到返回 null（调用方跳过） */
function resolveBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter((item) => typeof item === 'string' && item.length > 0)
  return candidates.find((item) => existsSync(item)) ?? null
}

const browserPath = resolveBrowser()
if (!browserPath) {
  console.log('跳过：未找到浏览器（可用 CHROME_PATH 指定可执行文件路径）')
  process.exit(0)
}

// 前置检查：dev server 与后端必须已启动，否则给明确提示而不是超时报错
for (const [name, url] of [
  ['前端', APP],
  ['后端', `${API}/api/menus`],
]) {
  try {
    await fetch(url)
  } catch {
    console.error(
      `${name} 未就绪：${url}\n请先启动：pnpm dev:server / pnpm dev:web（或 pnpm dev 并行）`,
    )
    process.exit(1)
  }
}

const userDataDir = mkdtempSync(join(tmpdir(), 'fsd-regression-'))
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${CDP_PORT}`,
    // headless 默认视口 800x600，会落进 <960 的小屏抽屉分支 → 显式给桌面尺寸
    '--window-size=1440,900',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const target = await waitFor(
  async () => {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    return list.find((item) => item.type === 'page')
  },
  { label: 'chrome devtools 就绪' },
)

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let seq = 0
const waiters = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  const waiter = waiters.get(msg.id)
  if (waiter) {
    waiters.delete(msg.id)
    waiter(msg)
  }
}
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq
    waiters.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  const details = res.result?.exceptionDetails
  if (details) throw new Error(details.exception?.description ?? details.text ?? 'eval error')
  return res.result?.result?.value
}

const clickByText = (selector, text) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((node) => (node.textContent ?? '').includes(${JSON.stringify(text)}))
    if (!el) return false
    el.click()
    return true
  })()`)

/** 点下拉项（el-dropdown 面板 teleport 到 body）；label 用正则匹配，中英双语可用 */
const clickDropdownItem = (labelPattern) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll('.el-dropdown-menu__item')]
      .find((node) => ${labelPattern}.test(node.textContent ?? ''))
    if (!el) return false
    el.click()
    return true
  })()`)

const readStorage = (key) =>
  evaluate(`(() => {
    const raw = localStorage.getItem(${JSON.stringify(key)})
    try { return JSON.parse(raw)?.value ?? null } catch { return null }
  })()`)

try {
  await send('Page.enable')

  // ---------- P3/P4：登录 + 侧边栏 ----------
  await send('Page.navigate', { url: `${APP}/login` })
  await waitFor(() => evaluate(`!!document.querySelector('.login__submit')`), { label: '登录页' })
  await evaluate(`document.querySelector('.login__submit').click()`)
  await waitFor(() => evaluate(`location.pathname === '/dashboard'`), { label: '登录后进首页' })
  await waitFor(() => evaluate(`!!document.querySelector('.sidebar-layout .el-menu')`), {
    label: '侧边栏布局',
  })
  check('P3/P4 登录后进入 /dashboard 且侧边栏渲染', true)

  // ---------- P4 + 3 级种子菜单：逐级展开直达 3 级页 ----------
  await clickByText('.sidebar-layout .el-sub-menu__title', '系统管理')
  await waitFor(() => clickByText('.sidebar-layout .el-sub-menu__title', '用户管理'), {
    label: '展开用户管理',
  })
  await waitFor(() => clickByText('.sidebar-layout .el-menu-item', '用户分组'), {
    label: '点击 3 级菜单',
  })
  await waitFor(() => evaluate(`location.pathname === '/system/user/group'`), { label: '3 级路由' })
  check('P4 三级菜单可展开并直达 /system/user/group', true)

  // ---------- P9：面包屑 ----------
  const crumbs = await evaluate(`document.querySelector('.app-breadcrumb')?.textContent ?? ''`)
  check(
    'P9 面包屑含三级路径',
    crumbs.includes('系统管理') && crumbs.includes('用户分组'),
    crumbs.replace(/\s+/g, ' ').trim(),
  )

  // ---------- P6：页签 ----------
  const tabCount = await evaluate(`document.querySelectorAll('.app-tabs__item').length`)
  const activeTab = await evaluate(
    `document.querySelector('.app-tabs__item--active .app-tabs__title')?.textContent ?? ''`,
  )
  check(
    'P6 页签记录访问页且当前页高亮',
    tabCount >= 2 && activeTab.includes('用户分组'),
    `count=${tabCount}, active=${activeTab}`,
  )

  // ---------- P5/P11：主题切深色 ----------
  await evaluate(
    `(() => {
      const trigger = [...document.querySelectorAll('.app-header .fsd-dropdown__trigger')]
        .find((el) => !el.querySelector('.lang-switch__tag') && !el.querySelector('.app-header__user'))
      trigger?.click()
      return !!trigger
    })()`,
  )
  await waitFor(() => clickDropdownItem('/深色|Dark/'), { label: '切换深色' })
  const darkApplied = await waitFor(
    () => evaluate(`document.documentElement.classList.contains('dark')`),
    {
      timeout: 5000,
      label: 'html.dark',
    },
  )
  const themeSaved = await readStorage('fsd:theme')
  check(
    'P5/P11 切深色即时生效并持久化',
    darkApplied && themeSaved?.mode === 'dark',
    `fsd:theme=${JSON.stringify(themeSaved)}`,
  )

  // ---------- P9：设置抽屉切布局 + 抽屉保持打开（历史踩坑回归点） ----------
  const opened = await evaluate(
    `(() => {
      const btn = [...document.querySelectorAll('.app-header button')]
        .find((el) => /设置|settings/i.test(el.getAttribute('title') ?? ''))
      btn?.click()
      return !!btn
    })()`,
  )
  await waitFor(() => evaluate(`!!document.querySelector('.layout-settings__panel')`), {
    label: '设置抽屉',
  })
  check('P9 设置抽屉可打开', opened)
  await evaluate(`document.querySelectorAll('.layout-settings__modes button')[1].click()`)
  const switched = await waitFor(() => evaluate(`!!document.querySelector('.top-layout')`), {
    label: '切到顶部栏布局',
  })
  const drawerKept = await evaluate(`!!document.querySelector('.layout-settings__panel')`)
  const layoutSaved = await readStorage('fsd:layout')
  check(
    'P4/P9 切布局生效且设置抽屉保持打开',
    switched && drawerKept,
    `fsd:layout.mode=${layoutSaved?.mode}`,
  )

  // ---------- P9：水印开关 ----------
  await evaluate(
    `document.querySelectorAll('.layout-settings__row')[2].querySelector('.el-switch').click()`,
  )
  const watermarkOn = await waitFor(() => evaluate(`!!document.querySelector('.app-watermark')`), {
    timeout: 5000,
    label: '水印',
  })
  check('P9 水印开关生效', watermarkOn)

  // ---------- P4/P5/P9：刷新后偏好保持 ----------
  await send('Page.navigate', { url: `${APP}/system/user/group` })
  await waitFor(() => evaluate(`!!document.querySelector('.top-layout')`), {
    label: '刷新后保持顶部栏',
  })
  const afterReload = await evaluate(
    `({
      dark: document.documentElement.classList.contains('dark'),
      watermark: !!document.querySelector('.app-watermark')
    })`,
  )
  check(
    'P4/P5/P9 刷新后布局/主题/水印保持',
    afterReload.dark && afterReload.watermark,
    JSON.stringify(afterReload),
  )

  // ---------- P7：切英文（壳层文案随 i18n 变化） ----------
  await evaluate(`document.querySelector('.lang-switch__tag')?.click()`)
  await waitFor(() => clickDropdownItem('/English|英文/'), { label: '切换英文' })
  const englishHeader = await waitFor(
    () =>
      evaluate(
        `[...document.querySelectorAll('.app-header button')].some((el) => /layout settings/i.test(el.getAttribute('title') ?? ''))`,
      ),
    { timeout: 5000, label: '英文 header 文案' },
  )
  check('P7 切英文后壳层文案生效', englishHeader)

  // ---------- P3.5：菜单配置页回归 ----------
  await send('Page.navigate', { url: `${APP}/system/menu` })
  await waitFor(() => evaluate(`!!document.querySelector('.menu-workbench')`), {
    label: '菜单配置页',
  })
  const menuRows = await waitFor(
    () => evaluate(`document.querySelectorAll('.menu-tree-table tbody [data-level]').length`),
    { label: '菜单树数据' },
  )
  const level3 = await evaluate(
    `[...document.querySelectorAll('.menu-tree-table tbody [data-level]')].some((el) => Number(el.dataset.level) === 3)`,
  )
  check(
    'P3.5 菜单配置页可用（左树 ≥ 6 行且含 3 级）',
    menuRows >= 6 && level3,
    `rows=${menuRows}, level3=${level3}`,
  )
} catch (error) {
  try {
    const state = await evaluate(`({
      path: location.pathname,
      width: window.innerWidth,
      layout: [...document.querySelectorAll('[class$="-layout"]')].map((el) => el.className).join('|'),
      tabs: document.querySelectorAll('.app-tabs__item').length,
      settingPanel: !!document.querySelector('.layout-settings__panel'),
      head: (document.body.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 200)
    })`)
    console.log('现场：', JSON.stringify(state))
  } catch {
    console.log('现场 dump 失败')
  }
  check(`执行中断：${error.message}`, false)
} finally {
  const failed = results.filter((item) => !item.ok)
  console.log(`\nRESULT ${results.length - failed.length}/${results.length}`)
  ws.close()
  browser.kill()
  await sleep(300)
  if (failed.length) process.exitCode = 1
}

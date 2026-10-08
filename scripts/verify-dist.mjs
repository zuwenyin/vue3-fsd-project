/**
 * 构建产物校验（P13）：CI 在 `pnpm build` 之后运行，防止「产物缺失 / EP 按需样式丢失」类回归。
 *
 * 本地用法：pnpm build && node scripts/verify-dist.mjs
 * 失败时退出码为 1（CI 据此失败）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const results = []

function record(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` | ${extra}` : ''}`)
}

const read = (path) => readFileSync(path, 'utf8')
const sizeKb = (path) => statSync(path).size / 1024

/** 断言文件存在且不小于 minKb（防止空产物） */
function expectFile(name, path, minKb = 0.5) {
  if (!existsSync(path)) {
    record(name, false, `缺失: ${path}`)
    return false
  }
  const kb = sizeKb(path)
  record(name, kb >= minKb, `${kb.toFixed(1)}KB`)
  return true
}

// ---- @repo/utils ----
const utilsDist = join(root, 'packages/utils/dist')
expectFile('utils 产物 index.mjs', join(utilsDist, 'index.mjs'), 1)
expectFile('utils 产物 index.cjs', join(utilsDist, 'index.cjs'), 1)
expectFile('utils 类型 index.d.ts', join(utilsDist, 'index.d.ts'), 0.1)

// ---- @repo/ui ----
const uiDist = join(root, 'packages/ui/dist')
expectFile('ui 产物 index.mjs', join(uiDist, 'index.mjs'), 5)
expectFile('ui 类型 index.d.ts', join(uiDist, 'index.d.ts'), 0.5)
// ui 自己的 scoped 样式很少（组件基本是 EP 包装），因此只断言「存在且真含组件样式」，
// 不设体积阈值（阈值会随组件增减失真，P13 实测：131B 的产物被 1KB 阈值误判为缺失）
const uiCssPath = join(uiDist, 'style.css')
if (existsSync(uiCssPath)) {
  const uiCss = read(uiCssPath)
  record(
    'ui 样式 style.css 含组件样式',
    uiCss.includes('.fsd-'),
    `${sizeKb(uiCssPath).toFixed(1)}KB`,
  )
} else {
  record('ui 样式 style.css 存在', false, `缺失: ${uiCssPath}`)
}

// exports 声明的产物必须真实存在（P13 实测踩坑：Vite 默认输出 ui.css，exports 却指向 style.css）
const uiPkg = JSON.parse(read(join(root, 'packages/ui/package.json')))
for (const [subpath, target] of Object.entries(uiPkg.exports ?? {})) {
  const rel = typeof target === 'string' ? target : (target?.import ?? target?.default)
  if (typeof rel !== 'string') continue
  record(`ui exports ${subpath} 指向的产物存在`, existsSync(join(root, 'packages/ui', rel)), rel)
}
if (existsSync(join(uiDist, 'index.mjs'))) {
  const code = read(join(uiDist, 'index.mjs'))
  // P3 踩坑回归点：EP 按需样式导入必须保留在产物中（否则组件裸奔）
  record(
    'ui 产物保留 EP 按需样式导入',
    code.includes('element-plus/es/components/') && code.includes('/style/css'),
  )
  record('ui 产物外置 element-plus（未内联）', /from ["']element-plus["']/.test(code))
}

// ---- apps/web ----
const webDist = join(root, 'apps/web/dist')
const htmlPath = join(webDist, 'index.html')
const hasHtml = expectFile('web 入口 index.html', htmlPath, 0.2)

if (hasHtml) {
  const html = read(htmlPath)
  record('index.html 含挂载点 #app', html.includes('id="app"'))

  const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
  record('index.html 引用产物资源', refs.length > 0, `refs=${refs.length}`)
  for (const ref of refs) {
    record(`资源存在 ${ref}`, existsSync(join(webDist, ref.replace(/^\//, ''))))
  }
}

const assetsDir = join(webDist, 'assets')
if (existsSync(assetsDir)) {
  const files = readdirSync(assetsDir)
  const jsFiles = files.filter((file) => file.endsWith('.js'))
  const cssFiles = files.filter((file) => file.endsWith('.css'))
  record('assets 含 JS 产物', jsFiles.length > 0, `count=${jsFiles.length}`)
  record('assets 含 CSS 产物', cssFiles.length > 0, `count=${cssFiles.length}`)

  const totalKb = files.reduce((sum, file) => sum + sizeKb(join(assetsDir, file)), 0)
  console.log(
    `  体积报告：assets ${files.length} 个文件 / ${totalKb.toFixed(1)}KB（js ${jsFiles.length} / css ${cssFiles.length}）`,
  )

  const cssText = cssFiles.map((file) => read(join(assetsDir, file))).join('\n')
  // P3 回归点（EP 按需样式）与 P11 回归点（设计令牌）是否进入产物
  record('产物 CSS 含 .el-icon（EP 按需样式）', cssText.includes('.el-icon'))
  record('产物 CSS 含 --fsd-color-primary（设计令牌）', cssText.includes('--fsd-color-primary'))
} else {
  record('web assets 目录存在', false, assetsDir)
}

const failed = results.filter((item) => !item.ok)
console.log(`\nRESULT ${results.length - failed.length}/${results.length}`)
if (failed.length) process.exitCode = 1

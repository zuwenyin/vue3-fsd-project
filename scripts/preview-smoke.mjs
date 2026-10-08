/**
 * 静态产物冒烟（P13）：用 `vite preview` 起本地静态服务，断言关键路径与资源可访问（含 SPA 回退）。
 *
 * 前置：先 `pnpm build`（`apps/web/dist` 存在）。
 * 本地用法：node scripts/preview-smoke.mjs（端口可用 PREVIEW_PORT 覆盖，默认 4173）
 * 失败时退出码为 1（CI 据此失败）。
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'

const root = process.cwd()
const port = Number(process.env.PREVIEW_PORT ?? 4173)
const origin = `http://127.0.0.1:${port}`
const results = []

function record(name, ok, extra = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` | ${extra}` : ''}`)
}

// 直接调 vite 的 bin（不经 pnpm 包装：跨平台无 shell、kill 能干净结束）
const viteBin = join(root, 'apps/web/node_modules/vite/bin/vite.js')
if (!existsSync(viteBin)) {
  console.error(`未找到 vite：${viteBin}（请先 pnpm install）`)
  process.exit(1)
}

// `--host 127.0.0.1`：vite preview 默认绑 localhost（Windows 上即 IPv6 ::1），
// 而下面用 127.0.0.1 探测 → 不显式指定会一直 ECONNREFUSED（P13 实测踩坑）。
const child = spawn(
  process.execPath,
  [viteBin, 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
  { cwd: join(root, 'apps/web'), stdio: ['ignore', 'pipe', 'pipe'] },
)

/** 子进程输出留档：就绪失败时打印，避免 CI 里「只看到 FAIL 看不到原因」 */
let childOutput = ''
child.stdout?.on('data', (chunk) => {
  childOutput += String(chunk)
})
child.stderr?.on('data', (chunk) => {
  childOutput += String(chunk)
})

async function waitReady(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${origin}/login`)
      if (res.ok) return true
    } catch {
      // 服务未就绪，继续轮询
    }
    await sleep(500)
  }
  return false
}

try {
  const ready = await waitReady()
  record('vite preview 就绪', ready, origin)
  if (!ready) {
    console.error('--- vite preview 输出 ---')
    console.error(childOutput.trim() || '(无输出)')
  }

  if (ready) {
    const login = await fetch(`${origin}/login`)
    const html = await login.text()
    record('/login 200', login.status === 200, `status=${login.status}`)
    record('/login 返回挂载点 #app', html.includes('id="app"'))

    // SPA 回退：未命中的前端路由也应返回 index.html
    const fallback = await fetch(`${origin}/dashboard`)
    record('SPA 回退 /dashboard 200', fallback.status === 200, `status=${fallback.status}`)

    const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
    record('解析到产物资源', refs.length > 0, `refs=${refs.length}`)
    for (const ref of refs) {
      const res = await fetch(`${origin}${ref}`)
      record(`资源可访问 ${ref}`, res.ok, `status=${res.status}`)
    }
  }
} finally {
  child.kill()
}

const failed = results.filter((item) => !item.ok)
console.log(`\nRESULT ${results.length - failed.length}/${results.length}`)
if (failed.length) process.exitCode = 1

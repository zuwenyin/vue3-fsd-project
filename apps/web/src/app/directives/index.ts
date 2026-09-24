import type { Directive } from 'vue'
import { permission } from './permission'

/** app 层指令表（可自由引用 entities；shared 只能接收它，见 docs/13 §3.7 修订说明） */
export const appDirectives: Record<string, Directive> = { permission }

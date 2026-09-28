import { authHandlers } from './auth'
import { menuHandlers } from './menu'
import { routeHandlers } from './routes'

/** 全部 handlers（browser worker 与测试 server 共用，docs/06 §9） */
export const handlers = [...authHandlers, ...routeHandlers, ...menuHandlers]

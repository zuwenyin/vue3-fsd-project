import cors from 'cors'
import express, { type Express } from 'express'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error.js'
import { apiRouter } from './routes/index.js'

/**
 * 中间件顺序：cors → express.json → morgan → /api 路由 → 404 → error
 * 导出 app 实例本身，供 supertest 直接 request(app)（不起端口）
 */
export function createApp(): Express {
  const app = express()

  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json())
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'))

  app.use('/api', apiRouter)

  // Express 5 需用 app.use 兜底 404（app.delete('*') 在 v5 已不支持）
  app.use(notFound)
  app.use(errorHandler)

  return app
}

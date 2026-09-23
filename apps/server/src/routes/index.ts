import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { authRouter } from './auth.routes.js'
import { menuRouter } from './menu.routes.js'
import { userRouter } from './user.routes.js'

export const apiRouter: Router = Router()

// 登录接口不鉴权
apiRouter.use('/auth', authRouter)

// 其余接口全量鉴权
apiRouter.use(authMiddleware)

apiRouter.use('/user', userRouter)
apiRouter.use('/menus', menuRouter)

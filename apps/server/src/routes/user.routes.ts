import { Router } from 'express'
import * as userDao from '../dao/user.dao.js'
import { buildRouteTree } from '../services/route.service.js'
import { ApiError, ErrorCode } from '../shared/errors.js'
import { ok } from '../shared/result.js'

export const userRouter: Router = Router()

userRouter.get('/info', (req, res) => {
  const current = req.user
  if (!current) throw new ApiError(ErrorCode.UNAUTHORIZED, '未登录')
  const record = userDao.findById(current.id)
  const user = record ?? {
    id: current.id,
    username: current.username,
    nickname: current.username,
    roles: current.roles,
    permissions: current.permissions,
  }
  res.json(ok(user))
})

userRouter.get('/routes', (_req, res) => {
  res.json(ok(buildRouteTree()))
})

import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import * as userDao from '../dao/user.dao.js'
import { ApiError, ErrorCode } from '../shared/errors.js'
import type { UserRecord } from '../shared/types.js'

export interface TokenUser {
  id: number
  username: string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  token: string
  user: UserRecord
}

export function login(username: string, password: string): LoginResult {
  // 演示用：明文比对，生产禁止
  const found = userDao.findByUsername(username)
  if (!found || found.password !== password) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, '用户名或密码错误')
  }
  const payload: TokenUser = {
    id: found.id,
    username: found.username,
    roles: found.roles,
    permissions: found.permissions,
  }
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions)
  const { password: _password, ...user } = found
  return { token, user }
}

export function verifyToken(token: string): TokenUser {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (typeof decoded !== 'object' || decoded === null) {
      throw new Error('非法 token')
    }
    const payload = decoded as Partial<TokenUser>
    if (typeof payload.id !== 'number' || typeof payload.username !== 'string') {
      throw new Error('非法 token 载荷')
    }
    return {
      id: payload.id,
      username: payload.username,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    }
  } catch {
    throw new ApiError(ErrorCode.UNAUTHORIZED, 'token 无效或已过期')
  }
}

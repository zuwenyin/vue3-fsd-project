import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { login } from '../services/auth.service.js'
import { ok } from '../shared/result.js'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const authRouter: Router = Router()

authRouter.post('/login', validate(loginSchema), (req, res) => {
  const { username, password } = req.body as { username: string; password: string }
  const { token } = login(username, password)
  res.json(ok({ token }))
})

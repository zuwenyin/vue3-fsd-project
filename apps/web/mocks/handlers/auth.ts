import { http, HttpResponse } from 'msw'
import { MOCK_TOKEN } from '../data'

/** POST /api/auth/login（docs/06 §9 覆盖清单） */
export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string }
    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({ code: 0, data: { token: MOCK_TOKEN }, message: 'ok' })
    }
    return HttpResponse.json(
      { code: 401, data: null, message: '用户名或密码错误' },
      { status: 401 },
    )
  }),
]

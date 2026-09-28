import { http, HttpResponse } from 'msw'
import { MOCK_TOKEN, MOCK_USERS, toRouteTree } from '../data'

function tokenOf(request: Request): string {
  return (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
}

/** GET /api/user/info · GET /api/user/routes（docs/06 §9 覆盖清单） */
export const routeHandlers = [
  http.get('/api/user/info', ({ request }) => {
    const user = MOCK_USERS[tokenOf(request)]
    if (!user) {
      return HttpResponse.json({ code: 401, data: null, message: '未登录' }, { status: 401 })
    }
    return HttpResponse.json({ code: 0, data: user, message: 'ok' })
  }),

  http.get('/api/user/routes', ({ request }) => {
    if (!MOCK_USERS[tokenOf(request)] && tokenOf(request) !== MOCK_TOKEN) {
      return HttpResponse.json({ code: 401, data: null, message: '未登录' }, { status: 401 })
    }
    return HttpResponse.json({ code: 0, data: toRouteTree(), message: 'ok' })
  }),
]

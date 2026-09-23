import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import * as menuService from '../services/menu.service.js'
import { ok } from '../shared/result.js'
import type { MenuInsertInput } from '../dao/menu.dao.js'

const layoutEnum = z.enum(['sidebar', 'top', 'mix', 'dual'])

const menuSchema = z.object({
  parentId: z.number().int().nullable().default(null),
  name: z.string().min(1),
  path: z.string().min(1),
  redirect: z.string().nullable().optional(),
  component: z.string().nullable().optional(),
  title: z.string().min(1),
  titleKey: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  orderNo: z.number().optional(),
  keepAlive: z.boolean().optional(),
  hideInMenu: z.boolean().optional(),
  hideChildrenInMenu: z.boolean().optional(),
  activePath: z.string().nullable().optional(),
  external: z.boolean().optional(),
  affix: z.boolean().optional(),
  layout: layoutEnum.nullable().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
  publishStatus: z.enum(['draft', 'published']).optional(),
})

const moveSchema = z.object({
  targetParentId: z.number().int().nullable(),
  beforeId: z.number().int().nullable().optional(),
})

export const menuRouter: Router = Router()

menuRouter.get('/', (_req, res) => {
  res.json(ok(menuService.listFlat()))
})

menuRouter.get('/tree', (_req, res) => {
  res.json(ok(menuService.listTree()))
})

menuRouter.post('/', validate(menuSchema), (req, res) => {
  res.json(ok(menuService.create(req.body as MenuInsertInput)))
})

menuRouter.put('/:id', validate(menuSchema.partial()), (req, res) => {
  const id = Number(req.params['id'])
  res.json(ok(menuService.update(id, req.body as Record<string, never>)))
})

menuRouter.delete('/:id', (req, res) => {
  const id = Number(req.params['id'])
  const cascade = req.query['cascade'] === 'true'
  res.json(ok(menuService.remove(id, cascade)))
})

menuRouter.post('/:id/move', validate(moveSchema), (req, res) => {
  const id = Number(req.params['id'])
  const body = req.body as { targetParentId: number | null; beforeId?: number | null }
  res.json(
    ok(
      menuService.move({
        id,
        targetParentId: body.targetParentId,
        beforeId: body.beforeId ?? null,
      }),
    ),
  )
})

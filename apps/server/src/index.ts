import { env } from './config/env.js'
import { createApp } from './app.js'
import { getDb } from './db/index.js'

// 读 env → migrate（含建目录与种子）→ listen
getDb()

const app = createApp()
app.listen(env.PORT, () => {
  console.log(`listening on ${env.PORT}`)
})

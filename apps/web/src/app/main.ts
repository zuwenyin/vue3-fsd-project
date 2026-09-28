import './styles/index.scss'
import { initTheme } from '@/features/theme-switch'
import { bootstrap } from './index'

// 首屏防闪烁（docs/04 §5）：mount 之前读 fsd:theme 并写入 html.dark / --el-color-*
initTheme()
void bootstrap().then((app) => app.mount('#app'))

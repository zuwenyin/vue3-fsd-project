import './styles/index.scss'
import { bootstrap } from './index'
import { initTheme } from './providers/theme'

initTheme() // 占位：P5 实现
void bootstrap().then((app) => app.mount('#app'))

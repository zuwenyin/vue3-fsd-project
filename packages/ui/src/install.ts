import type { App, Plugin } from 'vue'
import { FsdButton } from './components/FsdButton'
import { FsdColorPicker } from './components/FsdColorPicker'
import { FsdDialog } from './components/FsdDialog'
import { FsdForm, FsdFormItem } from './components/FsdForm'
import { FsdIcon } from './components/FsdIcon'
import { FsdMenu, FsdMenuItem, FsdSubMenu } from './components/FsdMenu'
import { FsdSelect } from './components/FsdSelect'
import { FsdSwitch } from './components/FsdSwitch'
import { FsdTable } from './components/FsdTable'
import { FsdTag } from './components/FsdTag'
import { FsdTreeSelect } from './components/FsdTreeSelect'

export const components = {
  FsdButton,
  FsdColorPicker,
  FsdDialog,
  FsdForm,
  FsdFormItem,
  FsdIcon,
  FsdMenu,
  FsdMenuItem,
  FsdSubMenu,
  FsdSelect,
  FsdSwitch,
  FsdTable,
  FsdTag,
  FsdTreeSelect,
}

export const RepoUI: Plugin = {
  install(app: App): void {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component)
    }
  },
}

export default RepoUI

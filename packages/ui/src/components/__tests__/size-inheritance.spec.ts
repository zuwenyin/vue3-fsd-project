import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  ElButton,
  ElColorPicker,
  ElForm,
  ElInput,
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTag,
  ElTreeSelect,
} from 'element-plus'
import FsdButton from '../FsdButton/FsdButton.vue'
import FsdColorPicker from '../FsdColorPicker/FsdColorPicker.vue'
import FsdForm from '../FsdForm/FsdForm.vue'
import FsdInput from '../FsdInput/FsdInput.vue'
import FsdSelect from '../FsdSelect/FsdSelect.vue'
import FsdSwitch from '../FsdSwitch/FsdSwitch.vue'
import FsdTable from '../FsdTable/FsdTable.vue'
import FsdTag from '../FsdTag/FsdTag.vue'
import FsdTreeSelect from '../FsdTreeSelect/FsdTreeSelect.vue'

/**
 * 尺寸继承规则（P12）：
 * - **未显式传 `size`** → 必须把 `undefined` 透传给 EP，由 EP 的 `useSize` 继承 `ElConfigProvider.size`
 *   （即 web 侧「紧凑度」档位能整体缩放组件）；
 * - **显式传 `size`** → 精确透传，不受全局档位影响。
 *
 * ⚠️ 不要给这些组件的 `size` 写回默认值 `'default'`（会让紧凑度档位对它们失效）；
 *    如需固定尺寸，请在调用点显式传 `size`。
 */
describe('size 继承（P12：紧凑度联动 ElConfigProvider.size）', () => {
  it('FsdButton：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(mount(FsdButton).findComponent(ElButton).props('size')).toBeUndefined()
    expect(
      mount(FsdButton, { props: { size: 'small' } })
        .findComponent(ElButton)
        .props('size'),
    ).toBe('small')
  })

  it('FsdTag：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(mount(FsdTag).findComponent(ElTag).props('size')).toBeUndefined()
    expect(
      mount(FsdTag, { props: { size: 'small' } })
        .findComponent(ElTag)
        .props('size'),
    ).toBe('small')
  })

  it('FsdColorPicker：不传 → undefined（继承）；传 → 精确透传', () => {
    const base = { modelValue: '#2f6fed' }
    expect(
      mount(FsdColorPicker, { props: base }).findComponent(ElColorPicker).props('size'),
    ).toBeUndefined()
    expect(
      mount(FsdColorPicker, { props: { ...base, size: 'large' } })
        .findComponent(ElColorPicker)
        .props('size'),
    ).toBe('large')
  })

  it('FsdInput：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(mount(FsdInput).findComponent(ElInput).props('size')).toBeUndefined()
    expect(
      mount(FsdInput, { props: { size: 'small' } })
        .findComponent(ElInput)
        .props('size'),
    ).toBe('small')
  })

  it('FsdSelect：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(mount(FsdSelect).findComponent(ElSelect).props('size')).toBeUndefined()
    expect(
      mount(FsdSelect, { props: { size: 'small' } })
        .findComponent(ElSelect)
        .props('size'),
    ).toBe('small')
  })

  it('FsdTreeSelect：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(
      mount(FsdTreeSelect, { props: { data: [] } })
        .findComponent(ElTreeSelect)
        .props('size'),
    ).toBeUndefined()
    expect(
      mount(FsdTreeSelect, { props: { data: [], size: 'small' } })
        .findComponent(ElTreeSelect)
        .props('size'),
    ).toBe('small')
  })

  it('FsdSwitch：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(
      mount(FsdSwitch, { props: { modelValue: false } })
        .findComponent(ElSwitch)
        .props('size'),
    ).toBeUndefined()
    expect(
      mount(FsdSwitch, { props: { modelValue: false, size: 'small' } })
        .findComponent(ElSwitch)
        .props('size'),
    ).toBe('small')
  })

  it('FsdForm：不传 → undefined（继承）；传 → 精确透传', () => {
    expect(
      mount(FsdForm, { props: { model: {} } })
        .findComponent(ElForm)
        .props('size'),
    ).toBeUndefined()
    expect(
      mount(FsdForm, { props: { model: {}, size: 'small' } })
        .findComponent(ElForm)
        .props('size'),
    ).toBe('small')
  })

  it('FsdTable：size 同时透传给 ElTable 与 ElPagination', () => {
    const wrapper = mount(FsdTable, {
      props: {
        data: [],
        size: 'small',
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    // ElTable 是泛型组件，`props(key)` 的参数类型被推断为 never → 按 name 定位取 props 对象
    expect(wrapper.findComponent({ name: 'ElTable' }).props()).toMatchObject({ size: 'small' })
    expect(wrapper.findComponent(ElPagination).props('size')).toBe('small')
  })
})

import { describe, it, expect } from 'vitest'
import { weightedCross, predict, targets, parentCandidates, PRESETS, type Observation } from '../../src/product/model'
import { norm, seriesOf } from '../../src/genetics'
const black: Observation = { series: 'black', dilute: false, tabby: false, white: 0, long: false, sex: '?' }
describe('后代概率与不确定观察', () => {
  it('保留配子次数而不是对去重结果平分', () => {
    expect(weightedCross('Dd', 'Dd')).toEqual({ DD: 0.25, Dd: 0.5, dd: 0.25 })
  })
  it('双方隐性纯合的外观概率可确定', () => {
    const result = predict({ ...black, dilute: true, long: true }, { ...black, dilute: true, long: true })
    expect(result).toHaveLength(1)
    expect(result[0].probability).toBe(1)
    expect(result[0].hair).toBe('长毛')
    expect(result[0].variants).toHaveLength(1)
  })
  it('不平均未知携带情况：两只浓色猫的稀释色为条件性0或25%', () => {
    const r = predict(black, black),
      d = r.find((x) => x.spec.dilute)!
    expect(d.probability).toBeNull()
    expect(d.min).toBe(0)
    expect(d.max).toBe(0.25)
    expect(d.condition).toContain('携带稀释变体')
    expect(r.every((x) => x.probability === null)).toBe(true)
  })
  it('明确母方橘色、公方黑色时，浓淡已知，女儿玳瑁和儿子橘色各半', () => {
    const r = predict({ ...black, series: 'orange', sex: 'F', dilute: true }, { ...black, sex: 'M', dilute: true })
    expect(r.map((x) => x.spec.series).sort()).toEqual(['orange', 'tortie'])
    expect(r.map((x) => x.probability)).toEqual([0.5, 0.5])
  })
  it('公橘母黑不会误算成母橘公黑，同性别不能配对', () => {
    const r = predict({ ...black, series: 'orange', sex: 'M', dilute: true }, { ...black, sex: 'F', dilute: true })
    expect([...new Set(r.map((x) => x.spec.series))].sort()).toEqual(['black', 'tortie'])
    expect(r.filter((x) => x.spec.series === 'black').every((x) => x.probability === null)).toBe(true)
    expect(predict({ ...black, sex: 'F' }, { ...black, sex: 'F' })).toEqual([])
  })
  it('未知性别保留两种亲本角色，不赋先验', () => {
    const r = predict({ ...black, series: 'orange', dilute: true }, { ...black, dilute: true })
    expect(r.find((x) => x.spec.series === 'tortie')?.probability).toBe(0.5)
    expect(r.filter((x) => x.spec.series !== 'tortie').every((x) => x.probability === null)).toBe(true)
    expect(r[0].spec.series).toBe('tortie')
  })
  it('同名三花保留有无虎斑、长短毛与白斑示例，不给白斑面积加权', () => {
    const r = predict({ ...black, tabby: true, white: 2, sex: 'F' }, { ...black, series: 'orange', sex: 'M' })
    const calico = r.find((x) => x.spec.series === 'tortie' && x.spec.white > 0 && !x.spec.dilute)!
    expect(new Set(calico.variants.map((x) => x.tabby)).size).toBe(2)
    expect(new Set(calico.variants.map((x) => x.long)).size).toBe(2)
    expect(new Set(calico.variants.map((x) => x.white))).toEqual(new Set([1, 2, 3, 4]))
    expect(calico.hair).toBe('长短毛都有可能')
  })
  it('性别与底色的不确定不会制造公玳瑁', () => {
    const ts = targets({ ...black, series: null, sex: 'M' })
    expect(ts).toHaveLength(2)
    expect(ts.every((t) => t.sexes.length === 1 && t.sexes[0] === 'M')).toBe(true)
  })
  it('放宽输入只扩大可能集合，父母候选也单调', () => {
    const relaxed = { ...black, dilute: null, tabby: null, white: null, long: null }
    const r = predict(relaxed, black)
    for (const x of predict(black, black)) expect(r.some((y) => y.id === x.id)).toBe(true)
    const ps = parentCandidates(relaxed, 'mother')
    for (const p of parentCandidates(black, 'mother')) expect(ps).toContain(p)
  })
  it('所有预设交换输入顺序不改变概率，并保持已知降序', () => {
    for (const a of PRESETS)
      for (const b of PRESETS) {
        const r = predict(a.look, b.look),
          reverse = predict(b.look, a.look)
        expect(r.map((x) => [x.id, x.min, x.max])).toEqual(reverse.map((x) => [x.id, x.min, x.max]))
        const known = r.filter((x) => x.probability !== null).map((x) => x.probability!)
        expect(known).toEqual([...known].sort((a, b) => b - a))
        for (const x of r) {
          expect(x.min).toBeGreaterThanOrEqual(0)
          expect(x.max).toBeLessThanOrEqual(1)
        }
      }
  })
  it('可确定的三个后代类别按50%、25%、25%排序', () => {
    const r = predict({ ...black, series: 'tortie', dilute: true, sex: 'F' }, { ...black, dilute: true, sex: 'M' })
    expect(r.map((x) => x.probability)).toEqual([0.5, 0.25, 0.25])
    expect(r[0].spec.series).toBe('black')
  })
  it('独立四格穷举验证跨位点条件范围，不用概率实现本身作预期', () => {
    const a = { ...black, sex: 'M' as const },
      b = { ...black, sex: 'F' as const, white: 2 }
    const all: Map<string, number>[] = []
    for (const fd of ['DD', 'Dd'])
      for (const md of ['DD', 'Dd'])
        for (const ms of ['SS', 'Ss']) {
          const out = new Map<string, number>()
          for (let i = 0; i < 2; i++)
            for (let j = 0; j < 2; j++)
              for (let k = 0; k < 2; k++)
                for (let l = 0; l < 2; l++) {
                  const dilute = norm(fd[i], md[j]) === 'dd',
                    white = norm('ss'[k], ms[l]) !== 'ss' ? 2 : 0
                  const key = `black-${dilute}-false-${white}`
                  out.set(key, (out.get(key) ?? 0) + 1 / 16)
                }
          all.push(out)
        }
    for (const x of predict(a, b)) {
      const probs = all.map((m) => m.get(x.id) ?? 0)
      expect(x.min).toBe(Math.min(...probs))
      expect(x.max).toBe(Math.max(...probs))
    }
  })
  it('完全未知观察的联合性别/底色保留可行相关性', () => {
    const o = { series: null, dilute: null, tabby: null, white: null, long: null, sex: '?' } as Observation
    const r = predict(o, o)
    expect(r.length).toBe(16)
    expect(r.every((x) => x.probability === null)).toBe(true)
    expect(
      targets(o)
        .flatMap((t) => Object.keys(t.o.M))
        .every((g) => seriesOf(g) !== 'tortie'),
    ).toBe(true)
  })
})

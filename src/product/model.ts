import {
  A_GENOS,
  buildTarget,
  canonAsParent,
  canonPairAllowed,
  norm,
  solveParents,
  type CoatSpec,
  type Series,
  type Target,
  type CanonEntry,
} from '../genetics'

export interface Observation {
  series: Series | null
  dilute: boolean | null
  tabby: boolean | null
  white: number | null
  long: boolean | null
  sex: 'M' | 'F' | '?'
}
export interface Cat {
  name: string
  seed: number
  look: Observation
}
export const INITIAL: Cat = {
  name: '',
  seed: 7,
  look: { series: 'black', dilute: false, tabby: true, white: 0, long: false, sex: '?' },
}
export const WHITE_NAMES = ['没有白色', '一点白色', '约一半白色', '大部分白色', '几乎全白']
export function normalize(o: Observation): Observation {
  return {
    ...o,
    ...(o.series === 'orange' ? { tabby: true } : {}),
    ...(o.series === 'tortie' ? { sex: 'F' as const } : {}),
  }
}
export function displaySpec(o: Observation): CoatSpec {
  return {
    series: o.series ?? 'black',
    dilute: o.dilute ?? false,
    tabby: o.series === 'orange' || (o.tabby ?? false),
    white: o.white ?? 0,
    long: o.long ?? false,
  }
}
export function unknownLabels(o: Observation): string[] {
  return (['series', 'dilute', 'tabby', 'white', 'long'] as const)
    .filter((k) => o[k] === null)
    .map((k) => ({ series: '底色', dilute: '颜色深浅', tabby: '纹路', white: '白斑', long: '毛长' })[k])
}
export function appearanceName(s: CoatSpec): string {
  const base =
    s.series === 'orange'
      ? s.dilute
        ? '奶油'
        : '橘'
      : s.series === 'tortie'
        ? s.dilute
          ? '淡玳瑁'
          : '玳瑁'
        : s.tabby
          ? s.dilute
            ? '蓝狸花'
            : '狸花'
          : s.dilute
            ? '蓝'
            : '黑'
  if (s.series === 'tortie' && s.white > 0) return s.dilute ? '淡三花' : '三花'
  return `${base}${s.white > 0 ? '白' : ''}${base === '橘' || base === '黑' || base === '蓝' ? '猫' : ''}`
}
export function catLabel(cat: Cat): string {
  return cat.name || (unknownLabels(cat.look).length ? '这只猫' : appearanceName(displaySpec(cat.look)))
}
export function targets(o: Observation): Target[] {
  return (o.series ? [o.series] : (['black', 'orange', 'tortie'] as Series[]))
    .filter((s) => !(s === 'tortie' && o.sex === 'M'))
    .map((series) => {
      const t = buildTarget({
        series,
        dilute: o.dilute ?? false,
        tabby: o.tabby ?? false,
        white: o.white ?? 0,
        long: o.long ?? false,
        sex: o.sex,
      })
      for (const [field, locus] of [
        ['dilute', 'd'],
        ['tabby', 'a'],
        ['white', 's'],
        ['long', 'l'],
      ] as const) {
        if (o[field] === null) t[locus] = Object.fromEntries(A_GENOS[locus].map((g) => [g, 1]))
      }
      return t
    })
}
export const PRESETS: { id: string; label: string; look: Observation }[] = []
for (const series of ['black', 'orange', 'tortie'] as Series[])
  for (const dilute of [false, true])
    for (const tabby of series === 'black' ? [false, true] : [series === 'orange'])
      for (const white of [0, 2]) {
        const look: Observation = { series, dilute, tabby, white, long: false, sex: series === 'tortie' ? 'F' : '?' }
        PRESETS.push({ id: `${series}-${dilute}-${tabby}-${white}`, label: appearanceName(displaySpec(look)), look })
      }
export const PARENTS: (CanonEntry & { id: string; spec: CoatSpec })[] = []
for (const series of ['black', 'orange', 'tortie'] as Series[])
  for (const dilute of [false, true])
    for (const tabby of series === 'orange' ? [true] : [false, true])
      for (const white of [0, 2])
        for (const long of [false, true]) {
          const spec = { series, dilute, tabby, white, long }
          PARENTS.push({
            id: JSON.stringify(spec),
            name: `${long ? '长毛' : ''}${appearanceName(spec)}${series === 'tortie' && tabby ? '（带虎斑）' : ''}`,
            series,
            d: dilute ? ['dd'] : ['DD', 'Dd'],
            a: series === 'orange' ? null : tabby ? ['AA', 'Aa'] : ['aa'],
            l: long ? ['ll'] : ['LL', 'Ll'],
            white,
            spec,
          })
        }
export function parentCandidates(o: Observation, role: 'mother' | 'father', other?: CanonEntry): typeof PARENTS {
  const solutions = targets(o).map(solveParents)
  return PARENTS.filter((c) =>
    solutions.some(
      (r) =>
        canonAsParent(c, role, r) &&
        (!other || (role === 'mother' ? canonPairAllowed(other, c, r) : canonPairAllowed(c, other, r))),
    ),
  )
}
export function parentNotes(o: Observation): string[] {
  const notes: string[] = []
  if (o.dilute === true) notes.push('它的毛色较浅，父母双方都需要传下一份稀释变体。父母本身不一定都呈现浅色。')
  if (o.dilute === false) notes.push('它的毛色没有稀释，因此排除父母双方都呈现稀释色的组合。')
  if (o.long === true) notes.push('它是长毛猫，父母双方都需要携带长毛变体；短毛猫也可能携带。')
  if (o.long === false) notes.push('它是短毛猫，因此排除父母双方都是长毛的组合。')
  if (o.white !== null && o.white > 0)
    notes.push('按当前白斑模型，父母至少一方带白。不能根据白斑面积推算父母带了几份变体。')
  if (o.series === 'orange') {
    notes.push(
      o.sex === 'F'
        ? '它是橘色系母猫，爸爸需要是橘色系，妈妈需要是橘色系或黑橘双色。'
        : '妈妈需要能传下橘色信息，因此保留橘色系和黑橘双色。爸爸的限制还取决于小猫性别。',
    )
  }
  if (o.series === 'black' && o.sex === 'F')
    notes.push('它是黑色系母猫，爸爸需要能传下非橘色信息，因此排除橘色系爸爸。')
  if (!notes.length) notes.push('目前的信息还不能缩小这些条件；补充颜色深浅、毛长等特征后，可以排除更多组合。')
  return notes
}
/** Retain all four equally likely gamete pairings, including duplicates. */
export function weightedCross(a: string, b: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const x of a)
    for (const y of b) {
      const g = norm(x, y)
      out[g] = (out[g] ?? 0) + 1 / (a.length * b.length)
    }
  return out
}
type Locus = 'd' | 'a' | 's' | 'l'
interface Bound {
  min: number
  max: number
  low: string
  high: string
}
function locusBound(f: Target, m: Target, loc: Locus, predicate: (g: string) => boolean): Bound {
  let min = Infinity,
    max = -Infinity,
    low = '',
    high = ''
  for (const a of Object.keys(f[loc]))
    for (const b of Object.keys(m[loc])) {
      const p = Object.entries(weightedCross(a, b)).reduce((n, [g, w]) => n + (predicate(g) ? w : 0), 0)
      if (p < min) {
        min = p
        low = `${a} × ${b}`
      }
      if (p > max) {
        max = p
        high = `${a} × ${b}`
      }
    }
  return { min, max, low, high }
}
interface Pair {
  f: Target
  m: Target
  fo: string
  mo: string
  selfRole: 'father' | 'mother'
}
function pairs(a: Observation, b: Observation): Pair[] {
  const out: Pair[] = []
  for (const x of targets(a))
    for (const y of targets(b))
      for (const selfRole of ['father', 'mother'] as const) {
        const f = selfRole === 'father' ? x : y,
          m = selfRole === 'father' ? y : x
        if (!f.sexes.includes('M') || !m.sexes.includes('F')) continue
        for (const fo of Object.keys(f.o.M)) for (const mo of Object.keys(m.o.F)) out.push({ f, m, fo, mo, selfRole })
      }
  return out
}
function seriesProbability(pair: Pair, series: Series) {
  let p = 0
  for (const egg of pair.mo) {
    if ((egg === 'O' ? 'orange' : 'black') === series) p += 0.25
    const daughter = norm(pair.fo, egg)
    if ((daughter === 'OO' ? 'orange' : daughter === 'Oo' ? 'tortie' : 'black') === series) p += 0.25
  }
  return p
}
export interface Outcome {
  id: string
  label: string
  spec: CoatSpec
  variants: CoatSpec[]
  probability: number | null
  min: number
  max: number
  condition: string
  hair: string
}
const genotypeWords: Record<string, string> = {
  DD: '不携带稀释变体',
  Dd: '携带稀释变体',
  dd: '表现为稀释色',
  AA: '虎斑（不携带无纹变体）',
  Aa: '虎斑（携带无纹变体）',
  aa: '无虎斑',
  SS: '有白斑（两份白斑变体）',
  Ss: '有白斑（一份白斑变体）',
  ss: '无白斑',
  O: '橘色公猫',
  o: '非橘色公猫',
  OO: '橘色母猫',
  Oo: '玳瑁母猫',
  oo: '非橘色母猫',
}
function explainPair(value: string) {
  return value
    .split(' × ')
    .map((v, i) => `${i === 0 ? '爸爸' : '妈妈'}${genotypeWords[v] ?? v}`)
    .join('，')
}
export function percent(p: number) {
  return `${Number((p * 100).toFixed(2))}%`
}
export function predict(a: Observation, b: Observation): Outcome[] {
  const ps = pairs(a, b)
  if (!ps.length) return []
  const outcomes: Outcome[] = []
  for (const series of ['black', 'orange', 'tortie'] as Series[])
    for (const dilute of [false, true])
      for (const tabby of series === 'black' ? [false, true] : [series === 'orange'])
        for (const white of [0, 2]) {
          let min = Infinity,
            max = 0,
            condition = '',
            shortPossible = false,
            longPossible = false
          const variantMap = new Map<string, CoatSpec>()
          for (const pair of ps) {
            const op = seriesProbability(pair, series)
            const d = locusBound(pair.f, pair.m, 'd', (g) => (g === 'dd') === dilute)
            const ag = locusBound(pair.f, pair.m, 'a', (g) => series !== 'black' || (g !== 'aa') === tabby)
            const s = locusBound(pair.f, pair.m, 's', (g) => (g !== 'ss') === white > 0)
            const lo = op * d.min * ag.min * s.min,
              hi = op * d.max * ag.max * s.max
            min = Math.min(min, lo)
            if (hi > max) {
              max = hi
              condition = `假设这只猫是${pair.selfRole === 'father' ? '爸爸' : '妈妈'}，另一只是${pair.selfRole === 'father' ? '妈妈' : '爸爸'}；${genotypeWords[pair.fo]}与${genotypeWords[pair.mo]}配对；${[d.high, ...(series === 'black' ? [ag.high] : []), s.high].map(explainPair).join('；')}。在这些条件下，该花色的概率为 ${percent(hi)}。这只是一个符合输入的情景，不代表已知双方携带情况。`
            }
            if (!hi) continue
            const l = locusBound(pair.f, pair.m, 'l', (g) => g === 'll')
            shortPossible ||= l.min < 1
            longPossible ||= l.max > 0
            for (const long of [false, true]) {
              if (long ? l.max === 0 : l.min === 1) continue
              for (const actualTabby of series === 'tortie' ? [false, true] : [tabby]) {
                if (
                  series === 'tortie' &&
                  locusBound(pair.f, pair.m, 'a', (g) => (g !== 'aa') === actualTabby).max === 0
                )
                  continue
                // White coverage is an illustrative observation, never a genotype-dose prediction.
                for (const w of white ? [1, 2, 3, 4] : [0]) {
                  const v = { series, dilute, tabby: actualTabby, white: w, long }
                  variantMap.set(JSON.stringify(v), v)
                }
              }
            }
          }
          if (!max) continue
          const spec = { series, dilute, tabby, white, long: longPossible && !shortPossible }
          const id = `${series}-${dilute}-${tabby}-${white}`
          outcomes.push({
            id,
            label: appearanceName(spec),
            spec,
            variants: [...variantMap.values()],
            probability: Math.abs(min - max) < 1e-10 ? max : null,
            min,
            max,
            condition,
            hair: longPossible ? (shortPossible ? '长短毛都有可能' : '长毛') : '短毛',
          })
        }
  return outcomes.sort((a, b) =>
    a.probability === null
      ? b.probability === null
        ? 0
        : 1
      : b.probability === null
        ? -1
        : b.probability - a.probability,
  )
}

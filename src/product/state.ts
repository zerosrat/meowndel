import { normalize, INITIAL, type Cat, type Observation } from './model'
export type View = 'choose' | 'profile' | 'parents' | 'kids'
export interface Saved {
  v: 1
  cat: Cat
  mate: Cat
  view: View
}
export const STORAGE_KEY = 'meowndel.cat.v1'
export const fresh = (): Saved => ({
  v: 1,
  cat: structuredClone(INITIAL),
  mate: { name: '', seed: 13, look: { ...INITIAL.look, tabby: false } },
  view: 'choose',
})
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export function validateCat(value: unknown): Cat | null {
  if (
    !object(value) ||
    typeof value.name !== 'string' ||
    value.name.length > 24 ||
    typeof value.seed !== 'number' ||
    !Number.isInteger(value.seed) ||
    value.seed < 0 ||
    value.seed > 9999 ||
    !object(value.look)
  )
    return null
  const o = value.look
  if (
    ![null, 'black', 'orange', 'tortie'].includes(o.series as never) ||
    ![null, true, false].includes(o.dilute as never) ||
    ![null, true, false].includes(o.tabby as never) ||
    ![null, true, false].includes(o.long as never) ||
    ![null, 0, 1, 2, 3, 4].includes(o.white as never) ||
    !['M', 'F', '?'].includes(o.sex as never)
  )
    return null
  if (o.series === 'tortie' && o.sex === 'M') return null
  return {
    name: value.name.replace(/[\u0000-\u001f\u007f]/g, '').trim(),
    seed: value.seed,
    look: normalize({
      series: o.series,
      dilute: o.dilute,
      tabby: o.tabby,
      white: o.white,
      long: o.long,
      sex: o.sex,
    } as Observation),
  }
}
export function parseSaved(text: string): Saved | null {
  if (text.length > 6000) return null
  try {
    const x: unknown = JSON.parse(text)
    if (!object(x) || x.v !== 1) return null
    const cat = validateCat(x.cat),
      mate = validateCat(x.mate)
    if (!cat || !mate || !['choose', 'profile', 'parents', 'kids'].includes(x.view as string)) return null
    return { v: 1, cat, mate, view: x.view as View }
  } catch {
    return null
  }
}
export function decodeShare(hash: string): Saved | null {
  try {
    return hash.startsWith('#cat=') ? parseSaved(decodeURIComponent(hash.slice(5))) : null
  } catch {
    return null
  }
}
export function shareURL(s: Saved, base: string): string {
  const url = new URL(base)
  url.search = ''
  url.hash = `cat=${encodeURIComponent(JSON.stringify({ ...s, view: s.view === 'kids' ? 'kids' : 'profile' }))}`
  return url.href
}

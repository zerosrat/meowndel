import { describe, it, expect } from 'vitest'
import { fresh, parseSaved, decodeShare, shareURL } from '../../src/product/state'
describe('分享与浏览器记录契约', () => {
  it('中文昵称和未知信息可往返，保留毛长和配对页', () => {
    const s = fresh()
    s.cat.name = '小橘 & #猫'
    s.cat.look.white = null
    s.mate.look.long = true
    s.view = 'kids'
    const url = shareURL(s, 'https://example.test/?preview=cat')
    expect(new URL(url).search).toBe('')
    expect(decodeShare(new URL(url).hash)).toEqual(s)
  })
  it('非法链接或存储不进入引擎', () => {
    for (const text of ['null', '{}', '<script>', 'a'.repeat(6001)]) expect(parseSaved(text)).toBeNull()
    expect(decodeShare('#cat=%XX')).toBeNull()
    const s = fresh()
    ;(s.cat.look.white as number) = 99
    expect(parseSaved(JSON.stringify(s))).toBeNull()
  })
  it('删除未声明字段，拒绝不合理性别和数值', () => {
    const s = fresh()
    s.cat.look.series = 'tortie'
    s.cat.look.sex = 'M'
    expect(parseSaved(JSON.stringify(s))).toBeNull()
    s.cat.look.sex = 'F'
    s.cat.seed = -1
    expect(parseSaved(JSON.stringify(s))).toBeNull()
  })
})

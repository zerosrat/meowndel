import { domesticPortrait } from '../illustration/browser'
import { catLabel, appearanceName, displaySpec, unknownLabels, percent, type Outcome } from './model'
import type { Saved } from './state'

async function picture(url: string) {
  const img = new Image()
  await new Promise<void>((ok, no) => {
    img.onload = () => ok()
    img.onerror = () => no(new Error('图片未能加载，请稍后重试。'))
    img.src = url
  })
  return img
}
export async function cardImage(s: Saved, results: Outcome[]): Promise<Blob> {
  const kids = s.view === 'kids',
    width = 1080
  const groups = [
    { title: '概率已确定 · 从高到低', items: results.filter((r) => r.probability !== null) },
    { title: '概率暂不能确定 · 按花色排列', items: results.filter((r) => r.probability === null) },
  ].filter((g) => g.items.length)
  const gridHeight = groups.reduce((n, g) => n + 40 + Math.ceil(g.items.length / 3) * 320, 0)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = kids ? 680 + gridHeight : 1090
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器暂时无法保存图片。')
  const ctx = context
  ctx.fillStyle = '#f7f3eb'
  ctx.fillRect(0, 0, width, canvas.height)
  ctx.fillStyle = '#6b7259'
  ctx.font = '24px sans-serif'
  ctx.fillText('喵德尔 · 猫咪花色手册', 60, 68)
  ctx.fillStyle = '#302d28'
  ctx.font = 'bold 42px sans-serif'
  ctx.fillText(kids ? '它们的小猫，可能是什么花色？' : `${catLabel(s.cat).slice(0, 18)}的花色档案`, 60, 132)
  async function catImage(cat: Saved['cat'], x: number, y: number, size: number) {
    ctx.drawImage(await picture(await domesticPortrait(displaySpec(cat.look), cat.seed)), x, y, size, size)
  }
  if (kids) {
    await catImage(s.cat, 190, 162, 260)
    await catImage(s.mate, 620, 162, 260)
    ctx.font = '36px sans-serif'
    ctx.fillText('＋', 515, 300)
    ctx.font = '24px sans-serif'
    ctx.fillText(catLabel(s.cat).slice(0, 14), 190, 453)
    ctx.fillText(catLabel(s.mate).slice(0, 14), 620, 453)
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#655f54'
    for (const [cat, x] of [
      [s.cat, 190],
      [s.mate, 620],
    ] as const) {
      ctx.fillText(
        `${appearanceName(displaySpec(cat.look))} · ${cat.look.sex === '?' ? '性别不确定' : cat.look.sex === 'M' ? '公猫' : '母猫'}${unknownLabels(cat.look).length ? ' · 外观有未确定项' : ''}`,
        x,
        481,
        390,
      )
    }
    ctx.font = '22px sans-serif'
    ctx.fillText('数字为当前模型下每只小猫的概率；“有可能”不表示概率较低。', 60, 505)
    let top = 540
    for (const group of groups) {
      ctx.fillStyle = '#655f54'
      ctx.font = '23px sans-serif'
      ctx.fillText(group.title, 60, top + 24)
      for (let i = 0; i < group.items.length; i++) {
        const r = group.items[i],
          x = 60 + (i % 3) * 330,
          y = top + 40 + Math.floor(i / 3) * 320
        ctx.fillStyle = '#fffdf8'
        ctx.fillRect(x, y, 300, 300)
        ctx.drawImage(await picture(await domesticPortrait(r.spec, 7)), x + 62, y + 8, 176, 176)
        ctx.fillStyle = '#302d28'
        ctx.font = 'bold 25px sans-serif'
        ctx.fillText(r.label, x + 16, y + 212)
        ctx.font = '20px sans-serif'
        ctx.fillText(r.probability === null ? '有可能 · 概率暂不能确定' : percent(r.probability), x + 16, y + 246, 270)
        ctx.fillStyle = '#655f54'
        ctx.font = '18px sans-serif'
        ctx.fillText(r.hair, x + 16, y + 278)
      }
      top += 40 + Math.ceil(group.items.length / 3) * 320
    }
    if (!results.length) {
      ctx.fillStyle = '#302d28'
      ctx.font = '26px sans-serif'
      ctx.fillText('当前性别设置无法组成公母配对。', 60, 575)
    }
  } else {
    await catImage(s.cat, 250, 190, 580)
    ctx.fillStyle = '#302d28'
    ctx.font = '26px sans-serif'
    ctx.fillText(unknownLabels(s.cat.look).length ? '外观有待确认' : appearanceName(displaySpec(s.cat.look)), 60, 795)
    ctx.fillText(
      `${s.cat.look.long === null ? '毛长不确定' : s.cat.look.long ? '长毛' : '短毛'} · ${s.cat.look.sex === '?' ? '性别不确定' : s.cat.look.sex === 'M' ? '公猫' : '母猫'}`,
      60,
      840,
    )
    const unknown = unknownLabels(s.cat.look)
    if (unknown.length) ctx.fillText(`尚不确定：${unknown.join('、')}`, 60, 889, 950)
  }
  ctx.fillStyle = '#655f54'
  ctx.font = '21px sans-serif'
  ctx.fillText('花色与白斑位置为示意，不是对单只猫外观的精确预测。', 60, canvas.height - 82)
  ctx.fillText(
    kids ? '概率按简化遗传模型、公母各半计算；不保证一窝按此比例出现。' : '探索可能的父母和后代 · 无需登录',
    60,
    canvas.height - 42,
  )
  return new Promise((ok, no) =>
    canvas.toBlob((b) => (b ? ok(b) : no(new Error('图片保存失败，请重试。'))), 'image/png'),
  )
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

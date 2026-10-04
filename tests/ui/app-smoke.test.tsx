// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within, cleanup, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { cardImage, download } from '../../src/product/sharing'
vi.mock('../../src/product/sharing', () => ({ cardImage: vi.fn(), download: vi.fn() }))
import { fresh, STORAGE_KEY, shareURL, parseSaved } from '../../src/product/state'
vi.mock('../../src/illustration/browser', () => ({
  domesticPortrait: vi.fn(() => Promise.resolve('data:image/png;base64,test')),
}))
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  history.replaceState(null, '', '/')
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe('2D 完整探索流程（替代旧三面板布局断言，旧引擎基线不变）', () => {
  it('选猫进入档案，再到父母和可编辑配偶', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: '你的猫长什么样？' })).toBeTruthy()
    await user.click(within(screen.getByLabelText('常见花色')).getByRole('button', { name: /^三花/ }))
    await user.click(screen.getByRole('button', { name: '查看猫咪档案 →' }))
    expect(screen.getByText('母猫')).toBeTruthy()
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: '看看爸妈' }))
    expect(screen.getByText(/不能确定真实父母/)).toBeTruthy()
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: '看看后代' }))
    expect(screen.getByRole('heading', { name: '选择另一只猫' })).toBeTruthy()
    expect(screen.getByRole('region', { name: '概率暂不能确定' })).toBeTruthy()
  })
  it('分享查看、编辑不覆盖自己的记录，主动保存才替换', async () => {
    const own = fresh()
    own.cat.name = '原来的猫'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(own))
    const s = fresh()
    s.cat.name = '朋友的猫'
    s.view = 'profile'
    history.replaceState(null, '', new URL(shareURL(s, location.href)).hash)
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: '朋友的猫的花色档案' })).toBeTruthy()
    expect(parseSaved(localStorage.getItem(STORAGE_KEY)!)?.cat.name).toBe('原来的猫')
    await user.click(screen.getByRole('button', { name: '修改这只猫' }))
    await user.type(screen.getByLabelText(/猫咪昵称/), '二')
    expect(parseSaved(localStorage.getItem(STORAGE_KEY)!)?.cat.name).toBe('原来的猫')
    await user.click(screen.getByRole('button', { name: '保存为我的猫' }))
    expect(parseSaved(localStorage.getItem(STORAGE_KEY)!)?.cat.name).toBe('朋友的猫二')
  })
  it('刷新保留自己的猫，不确定观察明确说明而不编概率', async () => {
    const s = fresh()
    s.cat.name = '团子'
    s.cat.look.white = null
    s.view = 'profile'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    render(<App />)
    expect(screen.getByRole('heading', { name: '团子的花色档案' })).toBeTruthy()
    expect(screen.getByText(/白斑还不确定/)).toBeTruthy()
  })
  it('分享查看时重新选猫不覆盖原记录', async () => {
    const own = fresh()
    own.cat.name = '自己的猫'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(own))
    const other = fresh()
    other.cat.name = '分享的猫'
    other.view = 'profile'
    history.replaceState(null, '', new URL(shareURL(other, location.href)).hash)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '重新选一只猫' }))
    expect(parseSaved(localStorage.getItem(STORAGE_KEY)!)?.cat.name).toBe('自己的猫')
    expect(screen.getByRole('button', { name: '保存为我的猫' })).toBeTruthy()
  })
  it('图片生成期间修改设置，不下载或展示旧快照', async () => {
    const s = fresh()
    s.view = 'profile'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    let finish!: (b: Blob) => void
    vi.mocked(cardImage).mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          finish = resolve
        }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '保存图片' }))
    await user.click(screen.getByRole('button', { name: '修改这只猫' }))
    await act(async () => {
      finish(new Blob(['test']))
    })
    expect(download).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toContain('设置已更新')
  })
})

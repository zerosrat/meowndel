import { useEffect, useMemo, useRef, useState } from 'react'
import CatPortrait from './ui/CatPortrait'
import Editor from './product/Editor'
import {
  appearanceName,
  catLabel,
  displaySpec,
  parentCandidates,
  parentNotes,
  PARENTS,
  percent,
  predict,
  unknownLabels,
  WHITE_NAMES,
  type Cat,
  type Outcome,
} from './product/model'
import { decodeShare, fresh, parseSaved, shareURL, STORAGE_KEY, type Saved, type View } from './product/state'
import { cardImage, download } from './product/sharing'
import './product/product.css'

function boot(): { state: Saved; shared: boolean; notice: string } {
  const shared = decodeShare(location.hash)
  if (shared) return { state: shared, shared: true, notice: '' }
  let local: Saved | null = null,
    notice = ''
  try {
    local = parseSaved(localStorage.getItem(STORAGE_KEY) ?? '')
  } catch {
    notice = '当前浏览器无法保存记录，仍可正常探索。'
  }
  if (location.hash.startsWith('#cat=')) notice = '这个分享链接不完整，已回到自己的猫。'
  return { state: local ?? fresh(), shared: false, notice }
}
function ResultCard({ r }: { r: Outcome }) {
  const [variant, setVariant] = useState<number | null>(null)
  const spec = variant === null ? r.spec : (r.variants[variant] ?? r.spec)
  return (
    <article className="outcome">
      <span className={`probability ${r.probability === null ? 'uncertain' : ''}`}>
        {r.probability === null ? '有可能' : percent(r.probability)}
      </span>
      <CatPortrait spec={spec} seed={7} size={144} />
      <h3>{r.label}</h3>
      <p className="hint">
        {r.hair}
        {r.spec.white > 0 ? ' · 白斑多少不确定' : ''}
      </p>
      <details>
        <summary>查看可能的样子与原因</summary>
        <p>
          {r.probability === null
            ? '仅凭两只猫的外观，还不能确定这一花色的概率。'
            : `在所有符合当前设置的遗传情况中，这一花色的概率都是 ${percent(r.probability)}。`}
        </p>
        {r.probability === null && (
          <details>
            <summary>举一个符合条件的例子</summary>
            <p>{r.condition}</p>
          </details>
        )}
        <p className="hint">图中的白斑位置只是示意。下面保留了可能的毛长和纹路，不为它们指定相同概率。</p>
        <label>
          查看外观变体
          <select
            value={variant ?? ''}
            onChange={(e) => setVariant(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">代表图</option>
            {r.variants.map((v, i) => (
              <option key={i} value={i}>
                {v.long ? '长毛' : '短毛'} · {v.tabby ? '有虎斑' : '无虎斑'} · {WHITE_NAMES[v.white]}
              </option>
            ))}
          </select>
        </label>
      </details>
    </article>
  )
}
function Parents({ cat }: { cat: Cat }) {
  const [picked, setPicked] = useState<{ role: 'mother' | 'father'; id: string } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const other = PARENTS.find((c) => c.id === picked?.id)
  return (
    <section className="paper">
      <p className="intro">这些外观与{catLabel(cat)}的特征相符。选一种妈妈或爸爸，看看另一方还可能是什么样。</p>
      <p className="notice">花色只能帮助排除部分组合，不能确定真实父母，也不能判断哪种父母更常见。</p>
      {picked && (
        <button className="text-button" onClick={() => setPicked(null)}>
          清除已选的{picked.role === 'mother' ? '妈妈' : '爸爸'}：{other?.name}
        </button>
      )}
      {(['mother', 'father'] as const).map((role) => {
        const all = parentCandidates(cat.look, role),
          allowed = parentCandidates(cat.look, role, picked?.role !== role ? other : undefined)
        const visible = expanded ? allowed : allowed.slice(0, 12)
        const excluded = PARENTS.filter((c) => !allowed.includes(c))
        return (
          <div className="parent-section" key={role}>
            <h2>
              {role === 'mother' ? '妈妈' : '爸爸'}可能的花色 <span className="count">{allowed.length} 种示例</span>
            </h2>
            <div className="parent-grid">
              {visible.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={picked?.role === role && picked.id === c.id}
                  onClick={() => setPicked((p) => (p?.role === role && p.id === c.id ? null : { role, id: c.id }))}
                >
                  <CatPortrait spec={c.spec} seed={7} size={88} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            {allowed.length > 12 && !expanded && (
              <button className="text-button" onClick={() => setExpanded(true)}>
                展开全部花色和长毛示例
              </button>
            )}
            <details className="explanation">
              <summary>为什么这些花色可以？还有哪些不符合？</summary>
              <p>
                我们分别检查底色、颜色深浅、纹路、是否带白和毛长。只要存在一种遗传情况能产生你描述的猫，就保留这项；不会把这些候选平均分配概率。
              </p>
              <ul className="reason-list">
                {parentNotes(cat.look).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p>白斑示例仅区分有白、无白。相同花色的白色面积可以不同。</p>
              {picked?.role !== role && other && <p>已选另一方为{other.name}，当前只展示与它能组成组合的候选。</p>}
              <p>
                未保留：
                {excluded.map((c) => `${c.name}${all.includes(c) ? '（与已选另一方不符）' : ''}`).join('、') ||
                  '当前输入尚不能排除其他示例。'}
              </p>
              <p>这里按常见的性染色体遗传方式计算，不包含罕见公玳瑁等情况。</p>
            </details>
          </div>
        )
      })}
    </section>
  )
}
export default function App() {
  const [initial] = useState(boot)
  const [state, setState] = useState<Saved>(initial.state)
  const [shared, setShared] = useState(initial.shared)
  const [message, setMessage] = useState(initial.notice)
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  const { cat, mate, view } = state
  const currentState = useRef(state)
  currentState.current = state
  const results = useMemo(() => predict(cat.look, mate.look), [cat.look, mate.look])
  const known = results.filter((r) => r.probability !== null),
    uncertain = results.filter((r) => r.probability === null)
  useEffect(() => {
    if (!shared) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        setMessage('当前浏览器无法保存记录，仍可使用分享链接保留设置。')
      }
    }
  }, [state, shared])
  useEffect(() => {
    if (mounted.current) {
      heading.current?.focus()
      window.scrollTo?.({ top: 0, behavior: 'instant' })
    }
    mounted.current = true
  }, [view])
  useEffect(() => {
    setLink('')
    setImageURL('')
  }, [state])
  useEffect(() => {
    const change = () => {
      if (!location.hash.startsWith('#cat=')) return
      const next = decodeShare(location.hash)
      if (next) {
        setShared(true)
        setState(next)
        setMessage('正在查看分享的猫，你原来的记录没有被替换。')
      } else setMessage('这个分享链接不完整。')
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  function navigate(next: View) {
    setState((s) => ({ ...s, view: next }))
    setMessage('')
  }
  function updateCat(next: Cat) {
    setState((s) => ({ ...s, cat: next }))
  }
  function own() {
    setShared(false)
    history.replaceState(null, '', location.pathname + location.search)
    setMessage('已保存为自己的猫。')
  }
  function restoreOwn() {
    let saved: Saved | null = null
    try {
      saved = parseSaved(localStorage.getItem(STORAGE_KEY) ?? '')
    } catch {
      /* Keep a usable fresh draft. */
    }
    setState(saved ?? fresh())
    setShared(false)
    history.replaceState(null, '', location.pathname + location.search)
    setMessage('已回到自己的猫。')
  }
  async function copy() {
    if (location.protocol === 'file:') {
      setMessage('本地文件无法生成别人能打开的网址；可以先保存图片。网站发布后可分享链接。')
      return
    }
    const url = shareURL(state, location.href)
    setLink(url)
    try {
      await Promise.race([
        navigator.clipboard.writeText(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 1500)),
      ])
      setMessage('链接已复制，打开后会恢复这次的设置。')
    } catch {
      setMessage('可以长按或选中下面的链接复制。')
    }
  }
  async function saveImage() {
    const captured = state
    setBusy(true)
    setMessage('正在准备图片…')
    try {
      const blob = await cardImage(state, results)
      if (currentState.current !== captured) {
        setMessage('设置已更新，请重新保存图片。')
        return
      }
      download(blob, view === 'kids' ? '喵德尔-可能的后代.png' : '喵德尔-猫咪档案.png')
      setMessage('图片已生成，请查看浏览器下载；手机也可以打开下方图片后长按保存。')
      const url = URL.createObjectURL(blob)
      setImageURL(url)
    } catch {
      setMessage('图片暂时没能生成，请稍后重试。你也可以先复制链接。')
    } finally {
      setBusy(false)
    }
  }
  const [imageURL, setImageURL] = useState('')
  useEffect(
    () => () => {
      if (imageURL) URL.revokeObjectURL(imageURL)
    },
    [imageURL],
  )
  function shareActions() {
    return (
      <div className="share-actions">
        <button onClick={saveImage} disabled={busy}>
          {busy ? '正在生成…' : '保存图片'}
        </button>
        <button onClick={copy}>复制分享链接</button>
      </div>
    )
  }
  const title =
    view === 'choose'
      ? '你的猫长什么样？'
      : view === 'profile'
        ? `${cat.name || '这只猫'}的花色档案`
        : view === 'parents'
          ? '它的爸妈可能是什么样？'
          : '它们的小猫，可能是什么花色？'
  return (
    <div className="product">
      <a
        className="skip"
        href="#content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('content')?.focus()
          document.getElementById('content')?.scrollIntoView()
        }}
      >
        跳到主要内容
      </a>
      <header className="masthead">
        <button className="wordmark" onClick={() => navigate('profile')}>
          喵德尔<span>猫咪花色手册</span>
        </button>
        <span className="edition">田园猫篇</span>
      </header>
      {shared && (
        <aside className="shared-banner">
          <p>正在查看分享的猫，你自己的记录仍然保留。</p>
          <button onClick={own}>保存为我的猫</button>
          <button onClick={restoreOwn}>回到我的猫</button>
        </aside>
      )}
      <main id="content" tabIndex={-1}>
        {view !== 'choose' && (
          <nav aria-label="探索内容">
            {(
              [
                ['profile', '我的猫'],
                ['parents', '看看爸妈'],
                ['kids', '看看后代'],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button key={v} aria-current={view === v ? 'page' : undefined} onClick={() => navigate(v)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="page-heading">
          <div>
            <p className="eyeline">认识它，从花色开始</p>
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
          </div>
          {view !== 'choose' && (
            <button className="quiet" onClick={() => navigate('choose')}>
              修改这只猫
            </button>
          )}
        </div>
        {view === 'choose' && (
          <div className="choose-layout">
            <section className="paper">
              <p className="intro">先选一只颜色相近的，再调整白斑、毛长和性别。不清楚的地方可以选“不确定”。</p>
              <Editor cat={cat} onChange={updateCat} />
              <button className="primary wide" onClick={() => navigate('profile')}>
                查看猫咪档案 →
              </button>
            </section>
            <aside className="live-cat">
              <CatPortrait spec={displaySpec(cat.look)} seed={cat.seed} size={310} />
              <h2>{unknownLabels(cat.look).length ? '外观示意' : appearanceName(displaySpec(cat.look))}</h2>
              <p>白斑和纹路的位置不必完全相同。</p>
            </aside>
          </div>
        )}
        {view === 'profile' && (
          <>
            <section className="profile-card">
              <div className="portrait-stage">
                <CatPortrait spec={displaySpec(cat.look)} seed={cat.seed} size={310} />
                <span>外观示意</span>
              </div>
              <div className="profile-copy">
                <p className="eyeline">中华田园猫 · 花色记录</p>
                <h2>{unknownLabels(cat.look).length ? '还有一些特征待确认' : appearanceName(displaySpec(cat.look))}</h2>
                <div className="tags">
                  <span>{cat.look.long === null ? '毛长不确定' : cat.look.long ? '长毛' : '短毛'}</span>
                  <span>{cat.look.sex === '?' ? '性别不确定' : cat.look.sex === 'M' ? '公猫' : '母猫'}</span>
                  <span>{cat.look.white === null ? '白斑不确定' : WHITE_NAMES[cat.look.white]}</span>
                </div>
                <p>
                  {unknownLabels(cat.look).length
                    ? `${unknownLabels(cat.look).join('、')}还不确定，接下来的结果会保留这些可能性。`
                    : '已经记下它的外观。长得像的猫，也可能生出不同花色的小猫。先看看它的爸妈，或选另一只猫试试。'}
                </p>
                {shareActions()}
                <details>
                  <summary>这张图能说明什么？</summary>
                  <p>
                    图像用于辨认大致花色，不复原实际斑块位置。蓝色不代表英短，长毛也不代表布偶；当前统一使用田园猫体型。
                  </p>
                </details>
              </div>
            </section>
            <div className="explore-grid">
              <button onClick={() => navigate('parents')}>
                <span className="chapter">01 / 上一代</span>
                <h2>看看爸妈</h2>
                <p>哪些花色可能组成它的父母？</p>
                <span className="arrow">→</span>
              </button>
              <button onClick={() => navigate('kids')}>
                <span className="chapter">02 / 下一代</span>
                <h2>看看后代</h2>
                <p>选另一只猫，看看可能的小猫花色。</p>
                <span className="arrow">→</span>
              </button>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setState(fresh())
              }}
            >
              重新选一只猫
            </button>
          </>
        )}
        {view === 'parents' && <Parents key={JSON.stringify(cat.look)} cat={cat} />}
        {view === 'kids' && (
          <div className="kids-layout">
            <aside className="paper mate-editor">
              <div className="pair-line">
                <CatPortrait spec={displaySpec(cat.look)} seed={cat.seed} size={72} />
                <span>
                  {catLabel(cat)}
                  <small>{cat.look.sex === '?' ? '性别不确定' : cat.look.sex === 'M' ? '公猫' : '母猫'}</small>
                </span>
                <b>＋</b>
                <CatPortrait spec={displaySpec(mate.look)} seed={mate.seed} size={72} />
              </div>
              <h2>选择另一只猫</h2>
              <p className="hint">可以调整花色和性别，与自己的猫一样。</p>
              <button
                className="mobile-result-jump"
                onClick={() => {
                  document.getElementById('offspring-heading')?.focus()
                  document.getElementById('offspring-heading')?.scrollIntoView({ block: 'start' })
                }}
              >
                查看后代结果 · {results.length} 类花色 ↓
              </button>
              <Editor compact cat={mate} onChange={(next) => setState((s) => ({ ...s, mate: next }))} />
            </aside>
            <section className="results">
              <div className="result-heading">
                <h2 id="offspring-heading" tabIndex={-1}>
                  可能的后代 <span className="count">{results.length} 类花色</span>
                </h2>
                <p>同一种花色也可能有不同毛长和纹路，点开卡片查看。</p>
              </div>
              {!results.length ? (
                <div className="paper">
                  <h3>需要一只公猫和一只母猫</h3>
                  <p>当前性别设置不能组成配对，请检查双方的性别。不知道时可以选择“不确定”。</p>
                </div>
              ) : (
                <>
                  <p className="notice">
                    百分比针对每只小猫，不代表一窝一定按这个比例出生。“有可能”不表示概率比其他花色低。
                  </p>
                  {known.length > 0 && (
                    <section aria-label="概率已确定">
                      <h3 className="group-title">
                        概率已确定 <span>从高到低</span>
                      </h3>
                      <div className="outcome-grid">
                        {known.map((r) => (
                          <ResultCard key={`${JSON.stringify([cat.look, mate.look])}-${r.id}`} r={r} />
                        ))}
                      </div>
                    </section>
                  )}
                  {uncertain.length > 0 && (
                    <section aria-label="概率暂不能确定">
                      <h3 className="group-title">
                        概率暂不能确定 <span>按花色排列</span>
                      </h3>
                      <p className="hint">外观相同的父母也可能携带不同变体，因此不能平均分配概率。</p>
                      <div className="outcome-grid">
                        {uncertain.map((r) => (
                          <ResultCard key={`${JSON.stringify([cat.look, mate.look])}-${r.id}`} r={r} />
                        ))}
                      </div>
                    </section>
                  )}
                  {shareActions()}
                </>
              )}
              <details className="explanation">
                <summary>这些结果是怎样计算的？</summary>
                <p>
                  分别检查所有符合双方外观的遗传情况。只有每种情况下得到相同概率，才显示百分比；不会假设未知的携带情况各占一半。
                </p>
                <p>
                  合并公母后代时，采用性别各半、当前五个位点独立的简化模型。数字只针对花色类别，不预测具体纹路、白斑面积或位置，也不代替亲子鉴定。
                </p>
                <p>同名结果保留多种毛长、纹路示例。概率已经合并这些变体，不能再次把每种变体当成相同概率。</p>
              </details>
            </section>
          </div>
        )}
        {message && (
          <p className="feedback" role="status">
            {message}
          </p>
        )}
        {link && (
          <label className="share-link">
            分享链接
            <input readOnly value={link} onFocus={(e) => e.target.select()} />
            <span className="hint">链接包含昵称和猫的设置；本机地址只能在能访问该地址的设备上打开。</span>
          </label>
        )}
        {imageURL && (
          <details className="image-preview">
            <summary>查看生成的图片（手机可长按保存）</summary>
            <img src={imageURL} alt="本次生成的猫咪分享卡" />
          </details>
        )}
      </main>
      <footer>
        <strong>关于这本花色手册</strong>
        <p>
          当前支持田园猫常见底色、浓淡、虎斑、带白与长短毛组合。全白、重点色、银色、金色和巧克力色暂不支持。结果用于了解遗传的可能性，不确定真实亲缘关系。
        </p>
        <span>你的猫咪设置保存在当前浏览器中，无需登录。</span>
      </footer>
    </div>
  )
}

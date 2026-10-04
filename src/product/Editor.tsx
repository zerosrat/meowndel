import { useId } from 'react'
import CatPortrait from '../ui/CatPortrait'
import { PRESETS, displaySpec, normalize, WHITE_NAMES, unknownLabels, type Cat, type Observation } from './model'

function Choices<T extends string | number | boolean | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="choices">
      <legend>{label}</legend>
      <div>
        {options.map(([v, text]) => (
          <button type="button" key={String(v)} aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
export default function Editor({
  cat,
  onChange,
  compact = false,
}: {
  cat: Cat
  onChange: (c: Cat) => void
  compact?: boolean
}) {
  const id = useId()
  function set<K extends keyof Observation>(k: K, v: Observation[K]) {
    onChange({ ...cat, look: normalize({ ...cat.look, [k]: v }) })
  }
  return (
    <div className="cat-editor">
      <div className="preset-grid" aria-label="常见花色">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={['series', 'dilute', 'tabby', 'white'].every(
              (k) => cat.look[k as keyof Observation] === p.look[k as keyof Observation],
            )}
            onClick={() => onChange({ ...cat, look: normalize({ ...p.look, long: cat.look.long, sex: cat.look.sex }) })}
          >
            <CatPortrait spec={displaySpec(p.look)} seed={7} size={compact ? 58 : 76} />
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      <details className="fine-tune" open={undefined}>
        <summary>调整细节 · 毛长、白斑和性别</summary>
        <Choices
          label="身上的底色"
          value={cat.look.series}
          options={[
            ['black', '黑色系'],
            ['orange', '橘色系'],
            ['tortie', '黑橘都有'],
            [null, '不确定'],
          ]}
          onChange={(v) => set('series', v)}
        />
        <p className="hint">黑色系也包括灰蓝色；橘色变浅后是奶油色。</p>
        <Choices
          label="颜色深浅"
          value={cat.look.dilute}
          options={[
            [false, '较深'],
            [true, '较浅'],
            [null, '不确定'],
          ]}
          onChange={(v) => set('dilute', v)}
        />
        {cat.look.series !== 'orange' && (
          <Choices
            label={cat.look.series === 'tortie' ? '黑色部分有纹路吗？' : '有没有虎斑纹？'}
            value={cat.look.tabby}
            options={[
              [true, '有纹路'],
              [false, '没有纹路'],
              [null, '不确定'],
            ]}
            onChange={(v) => set('tabby', v)}
          />
        )}
        <fieldset className="choices">
          <legend>白色大约有多少？</legend>
          <div className="white-options">
            {[0, 1, 2, 3, 4].map((w) => (
              <button type="button" key={w} aria-pressed={cat.look.white === w} onClick={() => set('white', w)}>
                <CatPortrait spec={{ ...displaySpec(cat.look), white: w }} seed={cat.seed} size={44} />
                <span>{WHITE_NAMES[w]}</span>
              </button>
            ))}
            <button type="button" aria-pressed={cat.look.white === null} onClick={() => set('white', null)}>
              不确定
            </button>
          </div>
        </fieldset>
        <p className="hint">选最接近的一档就好。白斑的位置仅供参考；全白猫暂不支持。</p>
        <Choices
          label="毛长"
          value={cat.look.long}
          options={[
            [false, '短毛'],
            [true, '长毛'],
            [null, '不确定'],
          ]}
          onChange={(v) => set('long', v)}
        />
        {cat.look.series === 'tortie' ? (
          <p className="hint">黑橘双色按常见的母猫情况计算。罕见的公玳瑁不在当前模型内。</p>
        ) : (
          <Choices
            label="性别"
            value={cat.look.sex}
            options={[
              ['M', '公猫'],
              ['F', '母猫'],
              ['?', '不确定'],
            ]}
            onChange={(v) => set('sex', v)}
          />
        )}
      </details>
      <label className="name-field" htmlFor={id}>
        猫咪昵称 <span>选填</span>
        <input
          id={id}
          value={cat.name}
          maxLength={24}
          placeholder="例如：团子"
          onChange={(e) => onChange({ ...cat, name: e.target.value })}
        />
      </label>
      {unknownLabels(cat.look).length > 0 && (
        <p className="notice">{unknownLabels(cat.look).join('、')}暂不确定，计算会保留多种可能。猫图仅作示意。</p>
      )}
    </div>
  )
}

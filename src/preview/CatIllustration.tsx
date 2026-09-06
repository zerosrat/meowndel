import { useId } from "react";
import type { CoatSpec } from "../genetics/phenotype";
import { coatName } from "../genetics/naming";

export type CoatFeature = "series" | "dilute" | "tabby" | "white" | "long";

// Independent of the legacy renderer and its call-order-dependent SVG ids.
// The seed controls markings only; useId isolates paint servers per instance.
function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const SHORT_BODY = "M85 113 C65 132 57 177 59 210 Q56 232 77 236 L160 236 Q182 232 176 210 C176 171 163 131 147 114Z";
const LONG_BODY = "M84 109 Q68 119 62 138 Q58 143 54 140 Q52 149 58 157 Q51 157 49 154 Q47 165 56 175 Q49 178 47 174 Q45 187 53 195 Q45 203 50 211 Q52 218 57 218 Q52 233 75 237 L163 237 Q187 237 181 218 Q190 215 187 204 Q181 207 178 199 Q186 186 183 175 Q179 180 175 175 Q181 163 176 153 Q171 159 168 151 Q171 143 165 133 Q156 116 147 109Z";
const HEAD = "M74 52 Q91 36 119 39 Q148 35 166 53 Q184 70 178 92 Q173 119 145 128 Q119 140 92 126 Q64 118 61 93 Q55 69 74 52Z";
const TAIL = "M160 216 C187 231 211 213 202 187 C198 174 183 165 187 154 C190 144 204 147 210 160 C236 204 217 242 173 243 L151 236Z";
const LONG_TAIL = "M158 213 C185 226 204 211 196 190 Q191 178 186 175 Q177 170 181 160 Q179 148 190 143 Q205 141 213 157 Q226 181 225 200 Q232 218 217 231 Q202 249 172 244 L151 237Z";

export default function CatIllustration({ spec, seed = 17, focus = null }: {
  spec: CoatSpec; seed?: number; focus?: CoatFeature | null;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `portrait-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const orange = spec.series === "orange";
  const tortie = spec.series === "tortie";
  const striped = orange || spec.tabby;
  const ground = orange ? (spec.dilute ? "#EBD5AD" : "#D99551")
    : spec.tabby ? (spec.dilute ? "#9FA9AC" : "#A29373")
    : (spec.dilute ? "#929EA9" : "#45434A");
  const light = orange ? (spec.dilute ? "#FAEACB" : "#F4C788")
    : spec.tabby ? (spec.dilute ? "#D1D6D3" : "#C9BDA0")
    : (spec.dilute ? "#C3CCD2" : "#757078");
  const stripe = orange ? (spec.dilute ? "#C7A16D" : "#AA622B")
    : (spec.dilute ? "#657580" : "#534839");
  const patchRng = random(seed);
  const patches = Array.from({ length: 9 }, (_, i) => {
    const x = 59 + patchRng() * 123;
    const y = 40 + patchRng() * 182;
    const r = 13 + patchRng() * 18;
    return <path key={i} d={`M${x-r} ${y} Q${x-r*1.3} ${y-r} ${x} ${y-r*.8} Q${x+r*1.5} ${y-r*.4} ${x+r} ${y+r*.5} Q${x} ${y+r*1.5} ${x-r} ${y}Z`} />;
  });
  // Separate RNG stream: switching orange/black/tortie cannot reposition white.
  const whiteRng = random(seed + 91);
  const bend = 8 + whiteRng() * 12;
  const whiteWave = (y: number) => `M30 ${y+8} Q70 ${y-bend} 105 ${y+8} T160 ${y-4} T235 ${y+5} V260 H30Z`;
  const silhouette = (long: boolean) => <>
    <path d={long ? LONG_TAIL : TAIL} />
    <path d={long ? LONG_BODY : SHORT_BODY} />
    <path d="M65 71 Q55 48 61 20 Q80 25 96 48Z" />
    <path d="M144 48 Q160 25 177 20 Q184 49 172 72Z" />
    <path d={HEAD} />
    <ellipse cx="88" cy="226" rx="22" ry="14" />
    <ellipse cx="148" cy="226" rx="22" ry="14" />
  </>;
  const label = `${spec.long ? "长毛" : "短毛"}${coatName(spec.series, spec.dilute, striped, spec.white)}`;

  return <svg className="cat-illustration" data-focus={focus ?? undefined} viewBox="0 0 260 270" role="img" aria-label={label}>
    <defs>
      <radialGradient id={id("coat")} cx="35%" cy="24%" r="84%">
        <stop offset="0" stopColor={light} /><stop offset=".66" stopColor={ground} /><stop offset="1" stopColor={ground} />
      </radialGradient>
      <radialGradient id={id("shade")} cx="38%" cy="25%" r="78%">
        <stop offset=".4" stopColor="#362C27" stopOpacity="0" /><stop offset="1" stopColor="#362C27" stopOpacity=".24" />
      </radialGradient>
      <linearGradient id={id("white")} x1="0" y1="0" x2=".5" y2="1">
        <stop stopColor="#FFFCF4" /><stop offset="1" stopColor="#DDD8CD" />
      </linearGradient>
      <radialGradient id={id("eye")}><stop stopColor="#D7D290" /><stop offset="1" stopColor="#9EAB75" /></radialGradient>
      <radialGradient id={id("shadow")}><stop stopColor="#8B765E" stopOpacity=".2" /><stop offset="1" stopColor="#8B765E" stopOpacity="0" /></radialGradient>
      <clipPath id={id("short")}>{silhouette(false)}</clipPath>
      <clipPath id={id("long")}>{silhouette(true)}</clipPath>
    </defs>
    <ellipse cx="130" cy="245" rx="104" ry="16" fill={url("shadow")} />
    <g className="cat-breathe">
      {/* Both silhouettes stay mounted so fur can crossfade without morphing. */}
      {[false, true].map(long => <g key={String(long)} className="cat-coat-shape" opacity={spec.long === long ? 1 : 0}>
        <g fill={url("coat")} stroke="#635244" strokeOpacity=".24" strokeWidth="1.2" strokeLinejoin="round">{silhouette(long)}</g>
        <g clipPath={url(long ? "long" : "short")}>
          <g className="cat-tortie" fill={spec.dilute ? "#E5CA99" : "#DC9350"} opacity={tortie ? 1 : 0}>{patches}</g>
          <g className="cat-stripes" opacity={striped ? .8 : 0} stroke={stripe} fill="none" strokeWidth="5" strokeLinecap="round">
            <path d="M64 146 Q81 155 94 151 M59 166 Q77 177 92 172 M58 187 Q77 196 88 192 M154 146 Q170 146 177 137 M155 169 Q174 171 182 163 M158 191 Q176 194 184 185" />
            <path d="M98 42 L106 61 L113 51 L119 66 L127 50 L135 60 L143 41" strokeWidth="3.5" />
            <path d="M60 79 L77 84 M61 92 L77 95 M160 84 L178 79 M160 95 L178 92 M193 161 L208 159 M199 179 L219 174 M197 204 L225 201 M184 225 L194 242" strokeWidth="4" />
          </g>
          <g className="cat-white" fill={url("white")}>
            <g className="cat-white-layer" opacity={spec.white === 1 ? 1 : 0}>
              <path d="M107 122 Q119 134 132 121 Q137 141 119 160 Q102 142 107 122Z" />
              <ellipse cx="88" cy="231" rx="22" ry="13" /><ellipse cx="148" cy="231" rx="22" ry="13" />
              <ellipse cx="118" cy="110" rx="17" ry="9" />
            </g>
            {[2, 3, 4].map(level => <g key={level} className="cat-white-layer" opacity={spec.white === level ? 1 : 0}>
              <path d={whiteWave(level === 2 ? 135 : level === 3 ? 88 : 52)} />
              {level >= 3 && <path d="M118 41 Q105 72 112 100 L128 103 Q135 79 124 40Z" />}
            </g>)}
          </g>
          <path d={long ? LONG_BODY : SHORT_BODY} fill={url("shade")} />
          <path d={HEAD} fill={url("shade")} />
          <path d="M73 128 Q86 144 113 146 Q143 150 166 125" stroke="#4F4235" strokeOpacity=".13" strokeWidth="7" fill="none" />
          <path d="M91 172 Q88 196 90 219 M147 172 Q152 196 147 219" stroke="#564738" strokeOpacity=".25" strokeWidth="2" fill="none" />
          <g stroke="#594A3C" strokeOpacity=".28" strokeWidth="1.3" strokeLinecap="round">
            <path d="M79 232 L79 236 M87 233 L87 238 M141 233 L141 238 M150 232 L150 236" />
          </g>
        </g>
      </g>)}
      <path d="M67 35 Q69 51 77 56 L86 48Z M171 35 Q168 49 161 56 L152 48Z" fill="#C9988D" opacity=".68" />
      <path d="M71 38 L76 51 M166 38 L161 50" stroke="#FFE9D2" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
      <g className="cat-eyes" stroke="#393733" strokeWidth="1.7">
        <path d="M78 82 Q92 71 106 84 Q94 99 80 89Z" fill={url("eye")} />
        <path d="M131 84 Q146 72 159 82 L157 89 Q142 99 131 84Z" fill={url("eye")} />
        <ellipse cx="93" cy="85" rx="3.3" ry="8.2" fill="#343632" stroke="none" />
        <ellipse cx="144" cy="85" rx="3.3" ry="8.2" fill="#343632" stroke="none" />
        <g fill="#FFFDF6" stroke="none"><circle cx="90" cy="81" r="2" /><circle cx="141" cy="81" r="2" /></g>
      </g>
      <g fill="#FFF3DE" opacity=".18"><ellipse cx="107" cy="107" rx="14" ry="11" /><ellipse cx="130" cy="107" rx="14" ry="11" /></g>
      <path d="M111 102 Q119 98 126 102 L119 108Z" fill="#BB817B" stroke="#815952" strokeWidth="1" />
      <path d="M119 108 L119 113 Q113 118 108 113 M119 113 Q124 118 129 113" stroke="#635149" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <g fill="#635149" opacity=".5"><circle cx="100" cy="104" r="1" /><circle cx="104" cy="109" r="1" /><circle cx="137" cy="104" r="1" /><circle cx="134" cy="110" r="1" /></g>
      <g stroke="#EBE2D2" strokeWidth="1.2" strokeLinecap="round" opacity=".75" fill="none"><path d="M103 109 Q77 102 49 105 M102 114 Q76 112 52 119 M134 109 Q164 101 191 105 M135 114 Q160 112 186 121" /></g>
    </g>
  </svg>;
}

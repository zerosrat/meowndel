import { useEffect, useState } from 'react';
import type { CoatSpec } from '../genetics';
import { catSVG } from '../render/catSVG';
import { domesticArtSpec } from '../illustration/spec';
import { domesticPortrait } from '../illustration/browser';

export default function CatPortrait({spec, seed, size}: {spec: CoatSpec; seed: number; size: number}) {
  const art = domesticArtSpec(spec, seed);
  const key = art?.key ?? 'unsupported';
  const [loaded, setLoaded] = useState<{key: string; url: string} | null>(null);
  useEffect(() => {
    let active = true;
    if (art) domesticPortrait(spec, seed).then(url => { if (active) setLoaded({key, url}); }).catch(() => { if (active) setLoaded(null); });
    return () => { active = false; };
    // key includes every appearance field and the seed. Size does not change the source image.
  }, [key]);
  const url = loaded?.key === key ? loaded.url : null;
  return <span className="cat-portrait" data-coat-key={key} data-art={url ? 'illustration' : 'fallback'} style={{width: size, height: size}}>
    {url ? <img src={url} width={size} height={size} alt={art!.label} onError={() => setLoaded(null)} /> :
      <span dangerouslySetInnerHTML={{__html: catSVG(spec, seed, size)}} />}
  </span>;
}

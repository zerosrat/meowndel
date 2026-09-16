import { describe, it, expect } from 'vitest';
import { domesticArtSpec } from '../../src/illustration/spec';
import { buildTarget, mateList, childrenWith, type UiState } from '../../src/genetics';
import { normalizeUi } from '../../src/ui/types';

describe('domestic appearance contract', () => {
  it('covers every current subject and offspring without using a coat name or breed guess', () => {
    const keys = new Set<string>(); let pairs = 0;
    for (const series of ['black','orange','tortie'] as const)
    for (const dilute of [false,true]) for (const tabby of [false,true])
    for (const white of [0,1,2,3,4]) for (const long of [false,true])
    for (const sex of ['M','F','?'] as const) {
      const ui = normalizeUi({series,dilute,tabby,white,long,sex} satisfies UiState);
      const art = domesticArtSpec(ui, 7)!; expect(art).not.toBeNull(); keys.add(art.key);
      const target = buildTarget(ui);
      for (const mate of mateList(target)) {
        pairs++; const result = childrenWith(target,mate);
        for (const spec of Object.values(result?.specs ?? {})) {
          const child = domesticArtSpec(spec,7)!;
          expect(child).not.toBeNull(); expect(child.long).toBe(spec.long); expect(child.white).toBe(spec.white);
        }
      }
    }
    expect(keys.size).toBe(100); expect(pairs).toBe(1800);
  });
  it('distinguishes same-name white levels and rejects invalid inputs', () => {
    const spec = {series:'black',dilute:false,tabby:true,white:0,long:false} as const;
    const a = domesticArtSpec(spec,7)!, b = domesticArtSpec({...spec,white:1},7)!;
    expect(a.label).toBe(b.label); expect(a.key).not.toBe(b.key);
    expect(domesticArtSpec({...spec,white:5},7)).toBeNull();
    expect(domesticArtSpec({...spec,white:1.5},7)).toBeNull();
    expect(domesticArtSpec(spec,NaN)).toBeNull();
  });
});

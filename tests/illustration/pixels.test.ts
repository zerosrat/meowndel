import { describe,it,expect } from 'vitest';
import { compose, whiteRanking, type Pixels, type ArtMasks } from '../../src/illustration/pixels';
import { domesticArtSpec } from '../../src/illustration/spec';

describe('layer composition invariants', () => {
  const source: Pixels = {width:4,height:1,data:new Uint8ClampedArray([222,222,222,255,222,222,222,220,80,40,30,255,222,222,222,0])};
  const masks: ArtMasks = {fur:new Float32Array([1,1,0,0]),whiteRank:new Float32Array([.1,.8,1,1]),stripe:new Uint8ClampedArray([255,0,0,0]),patches:new Uint8ClampedArray([0,255,0,0])};
  const base = {series:'tortie',dilute:false,tabby:false,white:0,long:false} as const;
  it('tortoiseshell has two pigment colors without an implicit white base; dilution affects both', () => {
    const dark = compose(source,masks,domesticArtSpec(base,7)!).data;
    const dilute = compose(source,masks,domesticArtSpec({...base,dilute:true},7)!).data;
    expect([...dark.slice(0,3)]).toEqual([85,87,86]);
    expect([...dark.slice(4,7)]).toEqual([245,179,105]);
    expect([...dilute.slice(0,3)]).toEqual([140,154,174]);
    expect([...dilute.slice(4,7)]).toEqual([242,213,166]);
    expect([...dark.slice(8)]).toEqual([...source.data.slice(8)]);
    expect(dark[7]).toBe(220);
  });
  it('tabby changes the dark part, while orange striping remains visible independently', () => {
    const solid = compose(source,masks,domesticArtSpec(base,7)!).data;
    const tabby = compose(source,masks,domesticArtSpec({...base,tabby:true},7)!).data;
    expect([...tabby.slice(0,3)]).not.toEqual([...solid.slice(0,3)]);
    const orange = compose(source,masks,domesticArtSpec({...base,series:'orange'},7)!).data;
    expect([...orange.slice(0,3)]).toEqual([203,120,62]);
  });
  it('white area is nested, calibrated and repeatable with the same seed', () => {
    const n=160, data=new Uint8ClampedArray(n*n*4).fill(222), fur=new Float32Array(n*n).fill(1);
    for(let i=3;i<data.length;i+=4)data[i]=255;
    const src={width:n,height:n,data}; const rank=whiteRanking(src,fur,7);
    expect(rank).toEqual(whiteRanking(src,fur,7)); expect(rank).not.toEqual(whiteRanking(src,fur,31));
    const areas=[0,.18,.48,.72,.92].map(q=>[...rank].filter(v=>v<q).length/rank.length);
    areas.forEach((v,i)=>expect(Math.abs(v-[0,.18,.48,.72,.92][i])).toBeLessThan(.015));
    expect(areas).toEqual([...areas].sort((a,b)=>a-b));
    const low=compose(source,masks,domesticArtSpec({...base,white:1},7)!).data;
    const high=compose(source,masks,domesticArtSpec({...base,white:4},7)!).data;
    expect([...low.slice(0,3)]).toEqual([255,246,232]); expect([...high.slice(0,3)]).toEqual([255,246,232]);
    expect([...high.slice(4,7)]).toEqual([255,246,232]);
  });
});

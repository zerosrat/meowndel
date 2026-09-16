// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {act,cleanup,render,waitFor} from '@testing-library/react';
import CatPortrait from '../../src/ui/CatPortrait';
import {domesticPortrait} from '../../src/illustration/browser';
vi.mock('../../src/illustration/browser',()=>({domesticPortrait:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
const black={series:'black',dilute:false,tabby:false,white:0,long:false} as const;
describe('portrait lifecycle',()=>{
 it('ignores a late result for a previously selected coat',async()=>{
  let first!:(url:string)=>void, second!:(url:string)=>void;
  vi.mocked(domesticPortrait).mockImplementationOnce(()=>new Promise(r=>first=r)).mockImplementationOnce(()=>new Promise(r=>second=r));
  const {container,rerender}=render(<CatPortrait spec={black} seed={7} size={46}/>);
  rerender(<CatPortrait spec={{...black,dilute:true}} seed={7} size={46}/>);
  await act(async()=>second('data:image/png;base64,blue'));
  await act(async()=>first('data:image/png;base64,black'));
  expect(container.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,blue');
  expect(container.querySelector('img')?.getAttribute('alt')).toContain('蓝');
 });
 it('retains a named SVG fallback if the illustration fails',async()=>{
  vi.mocked(domesticPortrait).mockRejectedValue(new Error('missing asset'));
  const {container}=render(<CatPortrait spec={black} seed={7} size={46}/>);
  await waitFor(()=>expect(container.querySelector('[data-art="fallback"]')).not.toBeNull());
  expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('黑猫');
 });
});

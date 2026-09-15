# 中性底稿与分层毛色验证

状态：技术小样已验证；美术尚未通过，不扩展动画或主流程。

## 范围与依赖

前一版成图亮度遮罩换色被用户否定。本轮改用无花纹中性底稿，独立指定底色，比较黑、灰、橘三种材料，以及可关闭的固定白斑。

入口：`?preview=catlayers`，上一版保留于 `?preview=cat2d`。工作区为 `.worktree/visual-interaction`，分支 `feat/visual-interaction`，原基点 bd4a569。

本轮仍是总纲阶段 6/8 前的独立试验，不跳过数据模型、品种范围和正式渲染器设计。没有修改引擎、旧 SVG、黄金基线；没有新依赖、外部图像请求或服务器生成。

## 实际分层方式

这不是三张重新生成的成品猫，也不是画师独立绘制的 PSD 图层。仅用内置 imagegen 生成一张无花纹、透明背景的中性猫底稿，然后在浏览器产生可分别检查的数值层：

1. **底色**：明确的 RGB 参数，轮廓取底稿 alpha，不从旧黑毛亮度挑区域。
2. **白斑**：手工空间路径遮罩，独立于底色和明暗。当前只有额鼻、胸口和白袜，不代表基因决定具体位置。
3. **体积**：中性底稿转亮度并低通，得到宽尺度明暗。颜色乘以明暗；白毛用更柔和的响应曲线，是美术近似而非物理仿真。
4. **细节**：原亮度减低通亮度形成局部差分，再叠加。细节与体积来自同一底稿，不是两张独立手绘资产。
5. **五官**：底稿原色通过眼睛、鼻子、内耳空间遮罩覆盖。

四个合成阶段按钮逐层显示结果；关闭白斑可检查整身同色。暖橘没有虎斑，仅是配色压力测试，不是完整遗传表型。

## 素材与提示词

- 输入：`src/preview2d/assets/domestic-open.png`（用户认可的插画）。
- 新输出：`src/preview2d/assets/domestic-neutral.png`（内置 imagegen，一次生成，保留 alpha）。
- 实现：`src/preview2d/layers/`。
- 证据：`art/cat2d/layers-verification/`，含平涂、逐层、三色、窄屏、离线截图及 verification.json。

最终生成提示词：

```text
Use case: precise-object-edit. Asset: neutral illumination master for a LAYERED 2D cat renderer, NOT a finished coat color variant. Preserve this exact adult cat's full-body pose, adorable face, body proportions, tilted head, silhouette, tail position and image framing. Replace ALL fur pigmentation with a uniform neutral medium-light gray material over the ENTIRE cat: face, forehead, cheeks, muzzle, chest, back, belly, legs and tail. Remove every black/white tuxedo marking completely, remove the forehead blaze and chest bib. NO patch boundaries or pale socks should remain: all fur has the same neutral gray albedo. Light and dark on the fur must come ONLY from form, soft lighting and restrained short fur strokes. Use clean soft painterly volume, a little less fine fur detail than reference, premium gouache animal illustration. Broad lit planes around 65-75 percent gray, shadows around 30-50 percent gray, sparse soft highlights. No brown tint anywhere in fur. Retain naturally colored gold-green eyes, pink nose and warm inner ears, original expression. Output a single centered full-body cat on a genuinely TRANSPARENT alpha background; no ground, no painted background, no checkerboard baked into pixels, no contact shadow outside cat. Keep the entire cat including whiskers and paws in frame. This master will supply neutral lighting and texture separately from programmatic base coat colors and white masks. Do not make a gray-and-white cat: the muzzle, chest, paws must be the SAME gray fur material as the back.
```

生成图仍有造型漂移与材料解释误差，不是精确光照分解。对照的三种颜色复用同一张新底稿，因此三色之间没有生成漂移；不承诺与旧插画像素重合。

## 本轮验证结果

- Node 24：`npm run check` 通过，25 文件 / 2260 测试。
- 新单元测试覆盖明确底色、白毛不随底色改变、五官保持、阶段开关和输出范围。
- Chromium 实际合成：白毛采样点三色均为 `[213,208,197,253]`；眼部采样点均为 `[33,29,27,253]`；背景透明、躯干像素随底色变化。仅是采样和合成不变量证明，不是整幅美术验收。
- 320/390/768px 无横向溢出；键盘可切换白斑；单 HTML 断网后可合成；无 pageerror。
- 全站单 HTML 约 13.33 MB（包含前面两套试验资产），不视为可上线体积。未验证 Safari、真实手机性能。
- 复跑浏览器证据：为 `tools/cat2d/verify-layers.mjs` 提供本地 `PLAYWRIGHT_MODULE` 和 `CHROMIUM_PATH`，先启动 5176 的 Vite 服务并完成构建。

## 美术判断与止步条件

已经证明：底色可以独立控制，不必把旧黑白成图的明暗阈值当花纹；同一白斑和五官能在三色间保持一致。

尚未证明：程序派生图层能达到用户希望的主角级美术质量。实际观察仍有：灰毛偏闷、白斑边缘几何感、黑毛部分体积压暗、橘毛缺少真实花纹层与材料变化。初版不自然的腹部白条已删除。

本轮到此止步交用户看三色对照。若仍不满意，不继续以参数修补承诺成品；需要独立美术分层资产、画师修整遮罩与材料响应，或改用高质量 3D/逐张审核资产。尚未授权购买或委托。

# 块状卡通田园猫与英短验收

状态：两只模型及网页技术验证完成，待用户美术验收。承接 `2026-09-17-blocky-cat-style-study.md`，属于总纲阶段 1 后视觉支线。用户授权两只一起做到验收；正式页面、遗传引擎和现有模型库不改。

## 本轮范围

- 两个新身体：修长田园猫、宽圆英短。相同块状风格、坐姿、棕色虎斑加白和灯光。
- 并排展示，花色/灰模切换、同步正侧背按钮、隐藏品种名称；拖动分别旋转。
- 同展示高度归一化，比较比例而非真实大小。花色类别一致，生成斑块并非逐像素一致。
- 田园猫只是典型美术样板，不能代表所有个体。没有新增遗传学品种判断。

## 制作

沿用内置 imagegen 编辑之前的块状猫参考，各生成一张品种外形图，再经大陆 Tripo 智能网格（目标 5000 面）和图像指导高清材质。不是拉伸同一个身体。

- 英短：`547e839f-bc17-4884-9a2c-ce246fc46806`，初始 4757 面。
- 田园猫：`d389bbda-dc01-4cc5-9aa7-b1e0dd5eb18e`，初始 4726 面。
- 每只几何 35 + 材质 20 积分，合计实际 110；无购买、升级。
- 参考图分别为 `reference-breed-domestic.png` 和 `reference-breed-british.png`，外置归档，项目链接恢复；原始 4K 和派生 2K GLB 同样不进 Git。

## 图片提示词

共同前缀：

Use reference solely to preserve exact low-poly papercraft 3D style, muted brown tabby and ivory white chest muzzle socks, golden simple eyes, clean matte flat color blocks, NO fur strands or realistic textures. Single full-body cat isolated ivory background, square composition, front view with very slight three-quarter showing side, sitting upright with both forepaws visible and tail curling to its right. No labels. Keep eyes charming but not huge glass beads, readable geometric facets.

田园猫追加：

Redesign the cat as a typical lean adult CHINESE DOMESTIC SHORTHAIR, visibly distinct from a British Shorthair: wedge-shaped moderately sized head, tapering cheeks and chin, tall large pointed triangular ears, long lean torso, visible narrow waist, long slim forelegs, small neat paws, thin long tail. Healthy athletic elegant build, not skinny or gaunt. Cute stylized proportions but NOT a broad round baby face, NOT chubby, NOT short-legged. Preserve simplified brown mackerel stripes and same white bib and socks.

英短追加：

Redesign the cat as a typical adult BRITISH SHORTHAIR, visibly unmistakably broad and cobby: very broad ROUND head made of clean faceted planes, full plump cheek jowls, very short broad muzzle, small widely spaced ears with rounded polygonal tips, thick short neck, wide barrel chest and compact thick body, short stout forelegs, big rounded block paws, thick short blunt-tipped tail. Charming gentle expression, not angry or obese. Same BROWN TABBY AND WHITE markings as reference, NOT blue gray coat. Strong breed silhouette difference is the purpose.

## 验收入口

`/demos/tripo-cat/breed-study.html`。先灰模隐藏名称，判断轮廓是否可区分；再打开花色检查两只是否属于同一套美术语言。

## 交付与验证结果

- 田园猫网页件 479,484 字节、4,726 三角面；英短 441,144 字节、4,757 三角面；合计 920,628 字节。2K JPEG，几何未额外减面。
- `breed-manifest.json` 保存六个文件（两原件、两网页件、两参考）的哈希、尺寸和任务来源。`node tools/cat3d/restore-blocky.mjs breed-manifest.json` 已核验并恢复链接。
- 统一平面着色、roughness=1、同灯光与展示高度；两个模型旋转校准 -120°。这不是实际尺寸对比。
- 灰模使用场景 overrideMaterial，不销毁原材质，不重新下载；恢复花色后原贴图仍正常。卸载释放灰模与模型资源。
- 网页双模型彩色/灰模、隐藏/显示名称、正侧背查看均已检查；灰模可见不同的脸、耳、胸、四肢和尾部几何轮廓。没有自动宣布美术通过。
- 390px 宽度为上下排列，两个 canvas，无横向溢出；桌面并排。控制台未见错误。未测试真实手机 GPU 性能或弱网。
- 样板严格 TypeScript 检查通过；完整 `pnpm run check` 通过，28 文件 / 2268 测试及正式单 HTML 构建。
- 已知限制：背部条纹偏少，眼睛与参考图仍有差异；灰模中眼睛轮廓较粗。本轮确认品种外形路线，未完成批量花色制作或正式产品接入。
- 积分余额从 3090 到 2980，合计 110，无额外购买。原始与派生二进制在外置目录，Git 提交不替代独立素材备份。

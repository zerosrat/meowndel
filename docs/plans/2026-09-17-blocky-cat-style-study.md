# 块状卡通 3D 风格验证

状态：样板与网页技术验证完成，待用户美术验收。承接狸花加白完整材质样板的风格反馈；属于总纲阶段 1 后视觉支线，不改变遗传引擎、正式首页或已认可的花色库。

## 方向与范围

用户指出上一版在块状和写实之间不协调。本轮只制作一只块状卡通狸花加白，重新生成身体，不强行复用上一版身体。块面、花纹、眼睛统一简化；保留上一版作网页对照。不扩展多花色，不宣称新身体可直接使用旧材质。

## 制作记录

- 使用内置 imagegen 生成造型参考，原文件 `exec-095e1e8e-9caa-4dcd-9676-7e2d97c72921.png`。
- 参考保存至外置归档 `reference-blocky-tabby.png`，项目内同名链接忽略 Git。参考图不是最终 3D 交付。
- 大陆 Tripo 智能网格，目标 5000 面，实际初始 4899 面 / 2484 顶点。图像自动优化关闭，保留参考风格。
- 任务 `1c8bcf45-8018-43a3-8064-9bd79b6c9188`，几何 35 积分、参考图高清材质 20 积分。
- 上一轮已否决的程序白斑以及混合风格样板保留，不覆盖。

## 参考图完整提示词

Create a single polished low-poly chunky cartoon 3D cat asset reference, square image, isolated on plain warm ivory background. Full body seated Chinese domestic shorthair brown tabby and white cat, three-quarter front view, tail curled beside body visible, all ears and paws visible. Deliberately designed LARGE sculptural polygon planes and angular silhouette, cute oversized subtly wedge-shaped head, tall triangular ears, compact torso, separate blocky paws. Premium miniature papercraft / carved wooden collectible aesthetic. Coat consists ONLY of clean flat muted taupe brown, dark chocolate simplified bold tapered tabby stripes and warm ivory white bib, muzzle, belly and four white socks. Large simple dark oval eyes with small honey iris and one restrained highlight, tiny salmon triangular nose, minimal mouth. Every component follows the same simplified blocky stylization. Matte material, gentle bright studio lighting, readable facets from actual geometry, restrained contact shadow. NO fine fur, NO photoreal texture, NO airbrushed gradients in coat, NO painted triangular texture, NO glass eyeballs, NO dramatic dark shadows, NO realistic anatomy, NO text or labels. A lovable coherent low-poly game character, not an unfinished realistic cat.

## 验收

`/demos/tripo-cat/blocky-cat.html`：新块状猫和上一版混合风格切换，正侧背查看、拖动旋转和缩放。看轮廓是否可爱，花纹是否干净，眼睛与身体是否协调，侧背是否维持同一风格。

源图、原始 GLB 与网页派生件全部外置归档；Git 保存页面、清单、脚本和制作记录。美术通过后再讨论新身体多花色材质。

## 实际交付与验证

- `/demos/tripo-cat/blocky-cat.html` 已载入真正 3D 模型，4,899 个三角面，2K 网页件 470,264 字节。
- 网页仅对新模型启用平面着色、roughness=1；旧模型保持原参数。默认旋转角校准为 -120°，便于看脸。灯光沿用旧场景。
- 原件 `cat-blocky-tabby-4k.glb`、派生件 `cat-blocky-tabby-2k.glb` 与参考图 `reference-blocky-tabby.png` 均位于外置归档；哈希记录于 `blocky-manifest.json`。项目参考图路径为 `demos/tripo-cat/reference-blocky-tabby.png`（外置链接）。
- 通过既有 Blender 优化脚本生成 2K 派生件，实际没有减少三角面。恢复脚本哈希校验通过。
- 网页新旧版本切换、正侧背视角检查完成；控制台未见错误。390px 宽度无横向溢出、一个 canvas。未测试真实手机 GPU 或弱网。
- 完整检查通过：28 文件 / 2268 测试、正式单 HTML 构建。平面着色选项及新旧样板严格 TypeScript 检查通过。
- 当前不足：背部和尾巴背侧条纹偏少；参考图中的金色虹膜未完整还原。此次只提交风格候选，不把素材完备性与美术认可等同于技术通过。
- Tripo 余额 3145 → 3090，共 55 积分，未购买或升级。图片通过内置 imagegen 生成，提示词已完整记录在上文。

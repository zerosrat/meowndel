# 单猫 2D 插画交互验证

状态：小样已实现，待用户审美与动态观感验收。不是完整表型渲染器。

## 本轮范围

用户已认可自然手绘插画风格，允许不走 Blender。复用同一张成年黑白田园猫插画，验证黑白／灰白、点击慢眨眼、可关闭的轻呼吸。入口 `?preview=cat2d`。沿用 `feat/visual-interaction` worktree，保留原主应用及 3D 样板。

这是总纲阶段 6/8 之前的独立美术技术试验，不替代三层数据模型、品种范围和正式渲染器设计；不修改遗传引擎、旧 SVG 或黄金基线。

## 实现与边界

- 换色：浏览器 SVG 亮度遮罩 + 手工眼、耳、鼻排除区 + 色彩矩阵。基于同一源图，姿态与白斑边界不会重新生成；亮度遮罩是本图专用近似，白毛暗部可能受到轻微影响，不能推广为任意花纹的语义遮罩。
- 眨眼：imagegen 生成闭眼变体，仅叠加两个羽化眼区，不切换整幅图，避免身体漂移。闭眼是两帧淡入淡出，不是连续眼皮骨骼动画。
- 呼吸：整幅插画以脚底附近为原点进行最多 0.6% 的垂直形变，是动效占位验证；还没有独立胸腔、头尾层，不宣称真实身体呼吸。
- 支持鼠标、触摸、原生按钮键盘操作；重复点击重置眨眼计时，卸载清理；尊重 reduced-motion 并提供手动停止。
- 固定姿态；不含换猫种、自由旋转、走路、白斑等级变化和遗传推演。
- PNG 内嵌到单 HTML，无新增依赖或运行时图像生成请求。当前全站同时包含旧 3D 资产和两张高清 PNG，未做正式体积优化。

## 资产与生成记录

内置 imagegen 模式；未经用户授权不改用收费 API CLI。原图为用户已认可的生成样张，闭眼图为本轮编辑；保留新文件，不覆盖阶段一参考。

- `src/preview2d/assets/domestic-open.png`：认可的自然手绘成年田园猫。
- `src/preview2d/assets/domestic-blink.png`：闭眼编辑输出，仅用于眼区。
- 原始参考：`references/cat-style-v1.png`，美术方向以本轮用户对插画的认可为准。

本轮闭眼图最终提示词：

```text
Use case: precise-object-edit. Input image is the EDIT TARGET. Make a single surgical change: close BOTH cat eyes in a gentle relaxed slow blink. Replace each open eyeball with anatomically natural closed eyelids covered in matching dark fur, a subtle curved closed eye seam. Do not smile or squint aggressively. CRITICAL keep entire image pixel-aligned with the original: same canvas size/aspect, exact cat placement, exact head tilt and outline, muzzle, nose, white blaze, ears, whiskers, body, paws, tail, lighting, colors, painterly texture and background. Change only inside the two tiny eye regions and immediate eyelid margins. No re-composition, no resizing subject, no new elements or text. This image will be overlaid over the original as a blink frame.
```

## 验证要求

运行 Node 24 的 `npm run check`；独立组件测试覆盖换色、反复点击、计时清理和停止动效。浏览器检查黑白、灰白、闭眼、320/390px、键盘、reduced-motion 和单 HTML 离线访问。截图存于 `art/cat2d/verification/`。

## 后续审美门槛

本轮实测：Node 24 完整检查通过（24 文件、2255 测试）；Chromium 的 320/390/768px 无横向溢出，reduced-motion 下动画为 none，Enter 可触发眨眼，无 pageerror；断网后 file:// 单 HTML 可打开并换色。构建约 11.28 MB，需后续优化。没有完成真实手机或 Safari 验证。

用户实际查看换色与动态效果后，再决定是否制作真正分层的胸腔、眼皮与尾巴资产，以及第二种体型；本轮通过不代表所有毛色可稳定展示。

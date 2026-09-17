# Tripo 四花色 3D 样板

独立开发样板，不进入正式单文件构建。Node 24 / pnpm 11.5.2：运行 `pnpm run dev`，打开 `/demos/tripo-cat/index.html`。

## 当前方向

保留已认可的橘猫造型，在 Tripo 为狸花、黑白、三花分别生成完整贴图，导出 GLB 后本地减面。网页按需加载对应模型，支持单猫切换、四猫并排、正侧背视角、拖动、缩放、自动转动及恢复视角。新猫的毛发细节较橘猫更写实，风格一致性仍待用户验收。

这是四套固定花色样板，不是可任意调整色块的遗传渲染器；没有接入遗传引擎或新增品种。旧程序花纹实验因观感未通过，留在 `procedural.html` / `procedural-viewer.js`，不作为当前验收入口。

## 本地素材恢复

大模型不进 Git，原档及轻量档在 `~/.local/share/meowndel/soft-low-poly-cat-2026-09-16/`。新机器先从个人备份恢复该目录，以下命令仅建立链接，不覆盖已有文件：

```sh
for file in cat-original-4k.glb cat-80k-2k.glb cat-tabby-80k-2k.glb cat-tuxedo-80k-2k.glb cat-calico-80k-2k.glb; do
  if [ -f "$HOME/.local/share/meowndel/soft-low-poly-cat-2026-09-16/$file" ] && [ ! -e "demos/tripo-cat/$file" ] && [ ! -L "demos/tripo-cat/$file" ]; then
    ln -s "$HOME/.local/share/meowndel/soft-low-poly-cat-2026-09-16/$file" "demos/tripo-cat/$file"
  fi
done
```

### 轻量化

Blender 5.2.1，Decimate 到约 80,000 三角面，纹理缩至 2K / JPEG 90。保留原档，输出单独文件及同名 JSON 报告。例如：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/cat3d/optimize_tripo.py -- --input cat-tabby-4k.glb --output cat-tabby-80k-2k.glb
```

其他花色替换文件名；不传参数时处理原橘猫。每只原档约 200 万面，轻量档 79,999–80,000 面、约 3 MB；压缩不是视觉无损。所有模型均无骨骼或动画，自动转动只是相机旋转。

## 服务来源

- 原橘猫任务：`f56e7624-71e7-46fe-8504-28de165b4584`。
- 狸花贴图任务：`28ae9fb6-a673-4358-a09b-059094f5313a`。
- 黑白贴图任务：`be478f63-7f6f-46e7-8043-87919ae16699`。
- 三花贴图任务：`d1bab082-2e09-47ad-9cd2-99b7b2fec5ee`。

可在 `https://studio.tripo3d.ai/zh/workspace/texture/<任务 ID>` 查看。当前账户先各做一次二次创作，再使用文字生成 4K 纹理。狸花文字依据已认可的概念方向，未上传概念图。黑白实际为黑脸、白胸和白袜；提示中的白色鼻口未被采用。三花两次文字试验分别偏橘白和灰白，均排除；改用 `calico-reference.png` 图片生成。该图由内置 imagegen 编辑原 `concept.png`，约束为保留造型、姿态、眼睛和低多边形风格，只替换黑橘白大色块（左脸黑、右脸橘、白鼻口胸腹爪、侧臀大片黑、黑橘尾）。参考图与原模型一起归档于上述 Git 外目录。

本轮余额 3495 → 3380，消耗 115 积分：三次二次创作共 15、五次贴图生成共 100。此前橘猫导出另消费 5 积分。未购买订阅；导出成功不代表商用授权已核实。

## 验收边界

重点看眼周、鼻口、胸腹、四肢、尾巴和背面色块，以及与橘猫的风格一致性。固定样板的贴图自然度、移动设备性能、可编辑遮罩及授权仍需分别确认；不以能加载代替美术认可。


## 2D / 3D 产品尺寸对比

新入口 `/demos/tripo-cat/comparison.html`：四花色主图并排对比，并提供 46 / 72 / 96px 静态卡片。2D 直接调用产品的 `domesticPortrait`，固定种子 42；3D 使用本轮已认可的四套资产。预设仅为视觉类别匹配，不能用固定 3D 贴图反推白斑等级或遗传状态。

- 每次只保留一个 3D 场景；切换花色、改用 2D 或离开页面时释放网格、材质、纹理、ImageBitmap 和渲染上下文，过期加载结果也被释放。
- 静止时不运行持续绘制循环，拖动、按钮与尺寸改变时绘制。小卡片由当前正面实际渲染截图生成，不创建额外 WebGL 场景。
- GLB 加载或 WebGL 初始化失败时显示对应 2D，并提供重试；可手动关闭、重新启用 3D。两侧 2D 源图均不可用时给出错误提示。
- 加载记录展示文件大小、当前加载至首次绘制耗时和三角面数量。时间包含本机缓存、网络读取与解码等，不用作跨设备跑分。
- 浏览器验证：快速切换停在三花无串图、2D 模式下换猫再启用 3D、临时缺失模型自动降级并恢复后重试成功；390px 布局目视检查通过。未做真实手机性能或禁用 WebGL 的设备测试。

本轮无生成服务调用、无新增积分消费。用户已选主图优先 3D、2D 后备。正式构建目前仍保留原 2D，主体接入待实施；小卡片展示方式未定。

## 11 花色切换样板

入口 `/demos/tripo-cat/coat-switcher.html`，支持六类纹路和正常 / 稀释色配对，11 套真实 3D 全部接入。纯黑和纯蓝灰经文字重做消除明显尾环；新增七套的导出朝向通过 manifest 的 `rotationY` 统一。玳瑁仅提供正常色。

技术验证完成，美术效果待用户验收。纯色与玳瑁表面更柔和，其余新增款的切面更明显，固定白斑不代表任意遗传组合。制作、消耗与验证记录见 [七套贴图制作](../../docs/plans/2026-09-17-domestic-3d-coat-production.md)。

从本地外部归档恢复 11 个轻量 GLB 和七张参考图（逐个校验 SHA-256，不覆盖不同文件）：

```sh
node tools/cat3d/restore-tripo.mjs
# 也可传入已复制的归档目录
node tools/cat3d/restore-tripo.mjs /absolute/path/to/archive
```

素材归档仍为 `~/.local/share/meowndel/soft-low-poly-cat-2026-09-16/`，需另外备份；Git 提交只有清单、提示词、代码和恢复工具，不包含这些二进制文件。

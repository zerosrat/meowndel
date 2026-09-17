# 块状卡通四品种补齐

状态：四品种网页技术验证完成，待用户美术验收。承接 `2026-09-17-blocky-breed-study.md`；属于总纲阶段 1 后视觉验证支线，不提前接入阶段 5 品种遗传能力。

## 已确认范围

用户要求沿用之前品种清单。核对总纲和四品种美术记录后，范围为田园猫、英短、美短、布偶；保留已经认可的圆润版田园猫与英短，新增美短与布偶。没有添加暹罗或加菲。

- 美短：银色古典虎斑；结实匀称身体、中等耳朵、方圆口鼻，与英短宽圆短粗体型区分。
- 布偶：蓝双色；蓝眼、倒 V 白脸、半长毛围脖与蓬松尾，以几何块面表示毛量。
- 参考 CFA：https://cfa.org/breed/american-shorthair/ 、https://cfa.org/breed/ragdoll/ 。样板不宣称赛级花纹精确还原。

## 实施与验证

1. 以已认可块状猫为风格参考，分别生成单猫图。
2. Tripo 智能网格约 5000 面，图像指导材质，导出 GLB；沿用现有 2K 优化流程。
3. 外部归档原件、网页件、参考图；清单记录任务、大小、哈希，Git 只保存代码与记录。
4. 同一页面四只并排/响应式排列，保留灰模、正侧背和田园猫新旧对照；花色不再称为完全一致。
5. 检查加载、切换、视角、移动布局及类型/构建。审美验收由用户决定。

## 提示词

共同前缀：

Use case: stylized-concept. Use the attached cat only as a STYLE reference. Create ONE full-body seated cat on warm ivory background, same charming matte low-poly papercraft 3D language, crisp large sculptural facets, flat clean markings, cute moderately large head and expressive eyes, tiny friendly mouth, all paws and tail visible. Slight three-quarter front view with side visible, tail curls to viewer right. No text or accessories, no hair strands, no realistic fur or glossy plastic.

美短追加：

New subject: AMERICAN SHORTHAIR, silver classic tabby. Strong athletic medium build, muscular chest, medium legs, broad slightly rectangular head with a distinctive square rounded muzzle, medium rounded-tip ears and green-gold eyes. More sturdy than domestic cat but NOT British round ball cheeks or squat cobby body. Pale silver ground with bold charcoal classic tabby swirls/bullseye on flank, forehead M, dark rings on legs and tail; light chin but NO white bib or white socks. Maintain charming friendly appeal.

布偶追加：

New subject: RAGDOLL, blue bicolor, distinctly semi-longhaired silhouette represented by a few broad polygonal tufts, NOT individual hairs. Broad soft wedge head, medium ears with rounded tips, vivid BLUE eyes and pink nose. Large elongated sturdy body, fluffy geometric neck ruff, full breeches and large paws, long bushy plumed tail visibly much thicker than the reference. Ivory white inverted V on face, white muzzle chin chest belly and legs. Muted slate-gray blue ears and outer face mask and tail, pale cool gray saddle. NO tabby stripes. Elegant soft friendly expression, not flat Persian face. Strong breed-specific geometry even without color.

## 制作记录

- 美短任务：`bf730ceb-bf9d-47ea-96c2-0ffc84e6c91e`，初始 4906 三角面。
- 布偶任务：`bcffc3b8-fdde-4f72-ab85-0ca64f8dd45b`，初始 4899 三角面。
- 两只各消耗 35 几何 + 20 材质，余额 2925 → 2815，共 110 积分，无额外购买。
- 参考图已归档为 `reference-breed-american.png` / `reference-breed-ragdoll.png`。

## 交付与验证

- 美短网页件 544,812 字节 / 4,906 三角面；布偶网页件 473,956 字节 / 4,899 三角面。2K JPEG，未额外减面。四只默认网页件合计 1,823,464 字节；上一版田园猫另 479,484 字节，按需加载。
- `breed-manifest.json` 新增六个文件记录，共十五个外部资产，哈希恢复检查通过。原田园猫及英短资产未改；新增布偶朝向校准为 -90°，其余沿用 -120°。
- 正面、侧面、背面实际网页渲染已检查；四猫灰模、隐藏/显示名称、田园猫新旧切换均正常。四个画布正常就绪，控制台无错误。
- 390px 窄屏为单列，无横向溢出；已恢复默认视口。未测试真实移动设备 GPU 性能或弱网。
- 严格样板 TypeScript 检查通过；完整 `pnpm run check` 通过，28 文件 / 2268 测试与单 HTML 构建。
- 已知美术边界：美短侧面古典纹清楚，但背部条纹偏少；布偶毛量以块状轮廓表达，材质较浅。花色均为样板，未实现新两品种的任意花色切换，也没有接入遗传引擎。
- 验收入口仍为 `/demos/tripo-cat/breed-study.html`，保留旧田园猫对照。

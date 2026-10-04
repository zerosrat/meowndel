// Restore only the two masters required by the offline product; historical studies are optional.
import { readFile, mkdir, copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const archive = resolve(process.argv[2] ?? resolve(homedir(), '.local/share/meowndel/cat-2d-validation-2026-09-16'))
const manifest = JSON.parse(await readFile(resolve(root, 'demos/cat-portrait/asset-manifest.json'), 'utf8'))
const names = ['flat-assets/domestic-neutral-master.png', 'flat-assets/domestic-long-neutral.png']
const pending = []
for (const name of names) {
  const item = manifest.assets.find((a) => a.path === name)
  if (!item) throw new Error(`Missing manifest entry: ${name}`)
  const source = resolve(archive, name),
    dest = resolve(root, 'demos/cat-portrait', name)
  const bytes = await readFile(source)
  const hash = (b) => createHash('sha256').update(b).digest('hex')
  if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw new Error(`Source checksum mismatch: ${name}`)
  try {
    await access(dest)
    if (hash(await readFile(dest)) !== item.sha256) throw new Error(`Refuse changed file: ${name}`)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    pending.push({ source, dest })
  }
}
for (const { source, dest } of pending) {
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(source, dest, constants.COPYFILE_EXCL)
}
console.log(`Verified two product masters; restored ${pending.length}.`)

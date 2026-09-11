import { lstat, mkdir, realpath, symlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const archive = resolve(process.argv[2] || process.env.MEOWNDEL_ASSET_ROOT ||
  resolve(homedir(), ".local/share/meowndel/visual-validation-2026-09-11"));
const folders = ["art", "references", "src/preview2d/assets", "src/preview3d/assets"];
// Validate every source and destination before creating anything; never replace files.
const missing = [];
for (const folder of folders) {
  const source = resolve(archive, folder);
  const target = resolve(project, folder);
  const actual = await realpath(source).catch(() => { throw new Error(`Missing asset directory: ${source}`); });
  const sourceStat = await lstat(actual);
  if (!sourceStat.isDirectory()) throw new Error(`Not an asset directory: ${source}`);
  const stat = await lstat(target).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (stat) {
    if (!stat.isSymbolicLink() || await realpath(target) !== actual) throw new Error(`Refusing to replace existing path: ${target}`);
  } else missing.push({source, target});
}
for (const {source, target} of missing) {
  await mkdir(dirname(target), {recursive:true});
  await symlink(source, target, "dir");
}
console.log(`Visual assets linked from ${archive}; ${missing.length} links created.`);

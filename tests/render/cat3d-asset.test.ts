import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { STUDY_COATS } from "../../src/preview3d/scene";

const file = readFileSync(new URL("../../src/preview3d/assets/cat-fripouille-v2.glb", import.meta.url));
const json = JSON.parse(file.subarray(20, 20+file.readUInt32LE(12)).toString());

describe("licensed isolated 3D study asset", () => {
  it("is a self-contained glTF 2 binary with embedded painted textures", () => {
    expect(file.toString("utf8", 0, 4)).toBe("glTF");
    expect(file.readUInt32LE(4)).toBe(2);
    expect(file.readUInt32LE(8)).toBe(file.length);
    expect(json.buffers.every((b: { uri?: string }) => !b.uri)).toBe(true);
    expect(json.images.length).toBeGreaterThanOrEqual(3);
    expect(json.images.every((i: { uri?: string; bufferView?: number }) => !i.uri && Number.isInteger(i.bufferView))).toBe(true);
    // Explicit new textured-asset budget; legacy SVG golden fixtures unchanged.
    expect(file.length).toBeLessThan(5_000_000);
  });
  it("keeps author and license in the distributable asset", () => {
    const root = json.nodes.find((n: { name: string }) => n.name === "Fripouille");
    expect(root.extras.author).toBe("guillaume bolis");
    expect(root.extras.license).toContain("CC BY 4.0");
    expect(root.extras.source).toContain("0ab14bf98e754f8d90fe1bf1c84ca66c");
    expect(root.extras.modifications).toContain("Meowndel");
  });
  it("skins the continuous body, eyes and whiskers to the same small rig", () => {
    expect(json.skins).toHaveLength(1);
    expect(json.skins[0].joints.map((i: number) => json.nodes[i].name).sort()).toEqual(["BodyRoot", "HeadPivot", "TailPivot"]);
    for (const name of ["CoatMesh", "Eyes", "Whiskers"]) {
      const node = json.nodes.find((n: { name: string }) => n.name === name);
      expect(node.skin, name).toBe(0);
      for (const p of json.meshes[node.mesh].primitives) {
        expect(p.attributes.JOINTS_0, name).toBeTypeOf("number");
        expect(p.attributes.WEIGHTS_0, name).toBeTypeOf("number");
      }
    }
    const coat = json.materials.find((m: { name: string }) => m.name === "SHD_frip");
    expect(coat.pbrMetallicRoughness.baseColorTexture).toBeDefined();
    expect(coat.normalTexture).toBeDefined();
  });
  it("preserves the source download and its author-issued license snapshot", () => {
    const source = readFileSync(new URL("../../art/cat3d/fripouille-v2/source/fripouille-original.glb", import.meta.url));
    expect(createHash("sha256").update(source).digest("hex")).toBe("c2762ca867fbde5319d3856b79595de5975061efb13905ff8124cfdc0923fa3e");
    const metadata = JSON.parse(readFileSync(new URL("../../art/cat3d/fripouille-v2/source/sketchfab-metadata.json", import.meta.url), "utf8"));
    expect(metadata.license.slug).toBe("by");
    expect(metadata.user.username).toBe("guillaume.bolis");
  });
  it("switches white independently while keeping the same dark base coat", () => {
    expect(Object.keys(STUDY_COATS)).toEqual(["tuxedo", "black"]);
    expect(STUDY_COATS.tuxedo.white).toBe(1);
    expect(STUDY_COATS.black.white).toBe(0);
    expect(STUDY_COATS.black.color).toBe(STUDY_COATS.tuxedo.color);
  });
});

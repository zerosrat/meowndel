# Cat illustration validation checkpoint

This directory contains isolated previews, not the production genetics UI.

## Accepted and pending

- **Accepted:** flat 2D illustration style, the domestic-cat silhouette compromise, the original British shorthair silhouette, four-breed differentiation, and twelve layered coat variants.
- **Preview delivered, not yet accepted:** placement in the existing page layout, the 46/72 px card-size choice, and the proposed detail dialog.
- **Not implemented:** production integration, full phenotype-to-art coverage, and animation. Demo samples do not establish parent/offspring relationships.

## Restore images and run

PNG files are intentionally excluded from Git. `asset-manifest.json` records their sizes and SHA-256 hashes. The current local archive is:

`/Users/zeroyu/.local/share/meowndel/cat-2d-validation-2026-09-16/`

On another machine, transfer this archive first, then run:

```sh
node tools/restore-cat-demo-assets.mjs /absolute/path/to/cat-2d-validation-2026-09-16
python3 -m http.server 4178 --bind 127.0.0.1 --directory demos/cat-portrait
```

The restore script checks every archived file before copying, skips identical local files, and refuses to overwrite different local content. The archive is a local backup, not a remote backup.

## Preview entry points

| Page | Purpose |
| --- | --- |
| `product-preview.html` | Existing-page layout and proposed detail dialog |
| `four-layers.html` | Accepted four-breed, twelve-coat compositing demo |
| `layers.html` | Accepted domestic-cat six-coat experiment |
| `flat.html` | Original generated four-breed illustrations |
| `flat-archive.html` | Earlier silhouette iterations |
| `index.html` | Preserved 3D-looking 2D Plan B |

Prompt logs, implementation notes, and validation limits are kept alongside each preview. Main application source remains unchanged.

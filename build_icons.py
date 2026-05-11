"""Generate extension icons from the user-provided SVG.

Re-run whenever the source changes. Output: icon-{16,32,48,128}.png in this dir.
Requires macOS (uses /usr/bin/qlmanage to rasterize SVG -> PNG).
"""
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

OUT = Path(__file__).parent
SRC = Path("/Users/yakshit/Downloads/Icon.svg")
RASTER_SIZE = 1024  # render SVG at this size, then downscale per icon


def rasterize_svg(svg: Path, size: int) -> Image.Image:
    """Render an SVG to a PIL Image at `size` x `size` via qlmanage."""
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(
            ["/usr/bin/qlmanage", "-t", "-s", str(size), "-o", td, str(svg)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        png = Path(td) / (svg.name + ".png")
        if not png.exists():
            raise RuntimeError(f"qlmanage failed to write {png}")
        return Image.open(png).convert("RGBA").copy()


def main():
    if not SRC.exists():
        raise SystemExit(f"Source SVG not found: {SRC}")

    print(f"Rasterizing {SRC.name} at {RASTER_SIZE}x{RASTER_SIZE}")
    master = rasterize_svg(SRC, RASTER_SIZE)
    print(f"Master: {master.size}, mode={master.mode}")

    for s in (16, 32, 48, 128):
        out = master.resize((s, s), Image.LANCZOS)
        out.save(OUT / f"icon-{s}.png", optimize=True)
        print(f"  wrote icon-{s}.png")


if __name__ == "__main__":
    main()

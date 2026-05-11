"""Generate extension icons from the user-provided PNG.

Re-run whenever the source changes. Output: icon-{16,32,48,128}.png in this dir.

The PNG source preserves transparency in the rounded corners (squircle), which
the SVG-rasterize path didn't quite match — the SVG used a rounded-rect, the
PNG uses a true superellipse.
"""
from pathlib import Path
from PIL import Image

OUT = Path(__file__).parent
SRC = Path("/Users/yakshit/Downloads/Icon.png")


def main():
    if not SRC.exists():
        raise SystemExit(f"Source PNG not found: {SRC}")

    master = Image.open(SRC).convert("RGBA")
    print(f"Source: {SRC.name} {master.size}, mode={master.mode}")

    for s in (16, 32, 48, 128):
        out = master.resize((s, s), Image.LANCZOS)
        out.save(OUT / f"icon-{s}.png", optimize=True)
        print(f"  wrote icon-{s}.png")


if __name__ == "__main__":
    main()

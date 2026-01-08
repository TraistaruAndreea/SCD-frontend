from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def _avg_corner_color(img: Image.Image, sample: int = 12) -> tuple[int, int, int]:
    """Average RGB from the four corners (sample x sample each)."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    sample = max(1, min(sample, w, h))

    corners = [
        (0, 0),
        (w - sample, 0),
        (0, h - sample),
        (w - sample, h - sample),
    ]

    r_sum = g_sum = b_sum = count = 0
    px = rgb.load()

    for x0, y0 in corners:
        for y in range(y0, y0 + sample):
            for x in range(x0, x0 + sample):
                r, g, b = px[x, y]
                r_sum += r
                g_sum += g
                b_sum += b
                count += 1

    return (r_sum // count, g_sum // count, b_sum // count)


def _color_distance(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    dr = c1[0] - c2[0]
    dg = c1[1] - c2[1]
    db = c1[2] - c2[2]
    return (dr * dr + dg * dg + db * db) ** 0.5


def remove_background(
    in_path: Path,
    out_path: Path,
    tolerance: float = 30.0,
    soften: float = 18.0,
    corner_sample: int = 12,
) -> None:
    """Remove a mostly-uniform background by keying against the avg corner color.

    - tolerance: distance threshold where alpha becomes 0
    - soften: creates a soft edge (feather) above tolerance
    """

    img = Image.open(in_path).convert("RGBA")
    w, h = img.size

    bg = _avg_corner_color(img, sample=corner_sample)
    px = img.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = _color_distance((r, g, b), bg)

            if d <= tolerance:
                # background: fully transparent
                px[x, y] = (r, g, b, 0)
            elif soften > 0 and d <= tolerance + soften:
                # feather edge
                t = (d - tolerance) / soften  # 0..1
                new_a = int(a * t)
                px[x, y] = (r, g, b, new_a)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def main() -> None:
    p = argparse.ArgumentParser(description="Remove background from PNGs via corner-color keying")
    p.add_argument("inputs", nargs="+", help="Input image(s) (e.g. flower1.png)")
    p.add_argument("--out-dir", default="public", help="Output directory (default: public)")
    p.add_argument("--suffix", default="-cutout", help="Output filename suffix (default: -cutout)")
    p.add_argument("--tolerance", type=float, default=30.0, help="Background tolerance (default: 30)")
    p.add_argument("--soften", type=float, default=18.0, help="Edge feather amount (default: 18)")
    p.add_argument("--corner-sample", type=int, default=12, help="Corner sample size (default: 12)")
    args = p.parse_args()

    out_dir = Path(args.out_dir)

    for in_file in args.inputs:
        in_path = Path(in_file)
        out_name = f"{in_path.stem}{args.suffix}{in_path.suffix}"
        out_path = out_dir / out_name
        remove_background(
            in_path=in_path,
            out_path=out_path,
            tolerance=args.tolerance,
            soften=args.soften,
            corner_sample=args.corner_sample,
        )
        print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()

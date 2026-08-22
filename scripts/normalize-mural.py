"""Normalize generated mural art to the website's canonical vertical format."""

from pathlib import Path
import argparse

from PIL import Image, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as source:
        mural = ImageOps.fit(
            source.convert("RGB"),
            (1138, 2560),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        mural.save(args.destination, "WEBP", quality=args.quality, method=6)

    with Image.open(args.destination) as saved:
        if saved.size != (1138, 2560):
            raise RuntimeError(f"Unexpected output size: {saved.size}")

    print(args.destination)


if __name__ == "__main__":
    main()

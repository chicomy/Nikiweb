#!/usr/bin/env python3
"""Package the sea homepage and its shared city assets for Cloudflare."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / '.cloudflare-assets'
MAX_ASSET_BYTES = 25 * 1024 * 1024


def build():
    if OUTPUT.is_symlink():
        raise SystemExit('The build directory must not be a symlink.')
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()

    # Only website files enter the upload directory, never authoring materials.
    for source in sorted((ROOT / 'sea').iterdir()):
        if source.is_file() and source.suffix in {'.html', '.js', '.css', '.json'}:
            shutil.copy2(source, OUTPUT / source.name)
    for directory in ('assets', 'fonts'):
        shutil.copytree(ROOT / 'sea' / directory, OUTPUT / directory,
                        ignore=shutil.ignore_patterns('.*', '__pycache__'))

    # At the domain root, ../dist references resolve to /dist as before.
    shutil.copytree(ROOT / 'dist', OUTPUT / 'dist',
                    ignore=shutil.ignore_patterns('.*', '__pycache__'))

    files = [path for path in OUTPUT.rglob('*') if path.is_file()]
    oversized = [str(path.relative_to(OUTPUT)) for path in files
                 if path.stat().st_size > MAX_ASSET_BYTES]
    if oversized:
        raise SystemExit('Assets exceed Cloudflare\'s 25 MiB limit: ' + ', '.join(oversized))
    size = sum(path.stat().st_size for path in files)
    print(f'Prepared {len(files)} files ({size / 1024 ** 2:.1f} MiB) in {OUTPUT.name}')


if __name__ == '__main__':
    build()

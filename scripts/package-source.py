"""Create the portable source download without site identity, caches or secrets."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'dist/downloads/codequest-source.zip'
out.parent.mkdir(parents=True, exist_ok=True)
excluded = {'.git', '.openai', 'node_modules'}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=7) as archive:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path == out:
            continue
        rel = path.relative_to(root)
        if any(part in excluded for part in rel.parts):
            continue
        if rel.parts[:2] == ('runtime', 'publish'):
            continue
        if rel.parts[:2] == ('runtime', 'csharp') and any(part in {'bin', 'obj'} for part in rel.parts):
            continue
        if path.suffix in {'.zip', '.gz'}:
            continue
        archive.write(path, Path('hero-academy-codequest') / rel)
print(f'{out}: {out.stat().st_size / 1_000_000:.2f} MB')
assert out.stat().st_size < 25 * 1024 * 1024, 'Source download exceeds the static asset limit'

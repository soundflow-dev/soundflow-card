#!/usr/bin/env python3
"""Simple ESM bundler that concatenates src/ modules into dist/soundflow-card.js.
Resolves relative imports topologically and strips import/export keywords."""
import re
import os
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / 'src'
OUT = ROOT / 'dist' / 'soundflow-card.js'

IMPORT_RE = re.compile(
    r"^\s*import\s+(?:(?P<def>\w+)|\*\s+as\s+(?P<ns>\w+)|\{(?P<named>[^}]+)\}|(?:(?P<def2>\w+)\s*,\s*\{(?P<named2>[^}]+)\}))\s+from\s+['\"](?P<path>[^'\"]+)['\"];?\s*$",
    re.MULTILINE,
)
EXPORT_DEFAULT_RE = re.compile(r"^\s*export\s+default\s+", re.MULTILINE)
EXPORT_NAMED_RE = re.compile(r"^\s*export\s+(?=(?:const|let|var|function|class|async\s+function))", re.MULTILINE)
EXPORT_LIST_RE = re.compile(r"^\s*export\s*\{[^}]*\}\s*;?\s*$", re.MULTILINE)

def resolve(base: Path, spec: str) -> Path:
    if not spec.startswith('.'):
        raise ValueError(f"Non-relative import not supported: {spec}")
    p = (base.parent / spec).resolve()
    if not p.suffix:
        p = p.with_suffix('.js')
    return p

def collect(entry: Path):
    """Topological sort of modules."""
    order = []
    visited = set()
    def visit(p: Path, stack):
        rp = p.resolve()
        if rp in visited: return
        if rp in stack: return  # cycle, skip
        stack.add(rp)
        text = rp.read_text(encoding='utf-8')
        for m in IMPORT_RE.finditer(text):
            dep = resolve(rp, m.group('path'))
            visit(dep, stack)
        stack.discard(rp)
        visited.add(rp)
        order.append(rp)
    visit(entry, set())
    return order

def transform(text: str, module_path: Path) -> str:
    # Build alias replacements based on `import * as X from './foo.js'`
    # and rewrite `X.bar` to `bar` only when bar is exported by the dep.
    # Simpler approach: rewrite imports of namespace aliases by replacing the alias
    # with a per-module prefix already applied (we will rename top-level exports
    # to be unique). For minimal complexity, we rewrite `MA.foo` etc. to the
    # actual function names by relying on unique naming.
    # Since src uses `import * as MA from './api/ma.js'` and we keep ma.js exports
    # globally unique enough, we replace MA., ST. etc. with the actual identifier
    # by stripping the prefix.
    lines = []
    namespace_aliases = {}  # alias -> module path
    named_imports = {}      # name -> alias_or_name
    for m in IMPORT_RE.finditer(text):
        if m.group('ns'):
            namespace_aliases[m.group('ns')] = m.group('path')
    # Strip imports
    text = IMPORT_RE.sub('', text)
    # Strip export keywords
    text = EXPORT_DEFAULT_RE.sub('', text)
    text = EXPORT_NAMED_RE.sub('', text)
    text = EXPORT_LIST_RE.sub('', text)
    # Replace namespace.alias accesses (NS.foo -> foo)
    for alias in namespace_aliases:
        text = re.sub(rf'\b{re.escape(alias)}\.', '', text)
    return text

def collect_exports():
    exports = set()
    for f in SRC.rglob('*.js'):
        text = f.read_text(encoding='utf-8')
        for m in re.finditer(r'^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)', text, re.MULTILINE):
            exports.add(m.group(1))
    return exports

def detect_collisions():
    exports = collect_exports()
    collisions = []
    for f in SRC.rglob('*.js'):
        text = f.read_text(encoding='utf-8')
        for m in re.finditer(r'(?:^|\n)\s*(?:const|let)\s+(\w+)\s*=', text):
            name = m.group(1)
            if name in exports:
                line = text[:m.start()].count('\n') + 1
                collisions.append(f"{f}:{line}: local '{name}' shadows exported symbol")
    return collisions

def bundle():
    cols = detect_collisions()
    if cols:
        print("ERROR: Naming collisions detected (will cause TDZ errors at runtime):")
        for c in cols: print(f"  {c}")
        raise SystemExit(1)
    entry = SRC / 'index.js'
    order = collect(entry)
    parts = []
    for p in order:
        rel = p.relative_to(ROOT)
        body = p.read_text(encoding='utf-8')
        body = transform(body, p)
        parts.append(f'/* === {rel} === */\n{body.strip()}\n')
    out = '/* SoundFlow Card v1.0.10 - https://github.com/soundflow-dev/soundflow-card */\n'
    out += '(function(){\n"use strict";\n'
    out += '\n'.join(parts)
    out += '\n})();\n'
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(out, encoding='utf-8')
    print(f"Wrote {OUT} ({len(out):,} bytes)")

if __name__ == '__main__':
    bundle()

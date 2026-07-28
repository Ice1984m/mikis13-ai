#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCE_FILE = ROOT / "credentials" / "sources.txt"
OUTPUT_FILE = ROOT / "CERTIFICATES.md"
STATE_FILE = ROOT / "credentials" / "state.json"

ALLOWED_HOST_SUFFIXES = (
    "developers.google.com",
    "cloudskillsboost.google",
    "www.cloudskillsboost.google",
    "credly.com",
    "www.credly.com",
)

USER_AGENT = "Mikis13-Certificate-Sync/1.0"


def permitted_host(hostname: str) -> bool:
    host = hostname.lower().strip(".")
    return any(
        host == allowed or host.endswith("." + allowed)
        for allowed in ALLOWED_HOST_SUFFIXES
    )


def read_sources() -> list[str]:
    if not SOURCE_FILE.exists():
        return []

    sources: list[str] = []

    for raw in SOURCE_FILE.read_text(encoding="utf-8").splitlines():
        value = raw.strip()

        if not value or value.startswith("#"):
            continue

        parsed = urlparse(value)

        if parsed.scheme != "https":
            print(f"OVERGESLAGEN: geen HTTPS: {value}", file=sys.stderr)
            continue

        if not parsed.hostname or not permitted_host(parsed.hostname):
            print(
                f"OVERGESLAGEN: domein niet toegestaan: {value}",
                file=sys.stderr,
            )
            continue

        sources.append(value)

    return sorted(set(sources))


def fetch(url: str) -> tuple[bytes, str]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/pdf",
        },
    )

    with urlopen(request, timeout=30) as response:
        data = response.read(5_000_000)
        content_type = response.headers.get("Content-Type", "")
        return data, content_type


def extract_title(data: bytes, content_type: str) -> str:
    if "pdf" in content_type.lower():
        return "Officieel PDF-document"

    text = data.decode("utf-8", errors="replace")
    match = re.search(
        r"<title[^>]*>(.*?)</title>",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if not match:
        return "Officiële verificatiepagina"

    title = re.sub(r"\s+", " ", match.group(1)).strip()
    return html.unescape(title)[:200]


def main() -> int:
    sources = read_sources()
    checked_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    records: list[dict[str, str]] = []

    for url in sources:
        try:
            data, content_type = fetch(url)
            digest = hashlib.sha256(data).hexdigest()
            title = extract_title(data, content_type)

            records.append(
                {
                    "url": url,
                    "title": title,
                    "sha256": digest,
                    "content_type": content_type,
                    "checked_at": checked_at,
                    "status": "bereikbaar",
                }
            )

            print(f"OK: {title}")

        except Exception as exc:
            records.append(
                {
                    "url": url,
                    "title": "Controle mislukt",
                    "sha256": "",
                    "content_type": "",
                    "checked_at": checked_at,
                    "status": f"fout: {type(exc).__name__}",
                }
            )

            print(f"FOUT: {url}: {exc}", file=sys.stderr)

    lines = [
        "# Certificaten en badges",
        "",
        "Dit overzicht is automatisch samengesteld uit officiële, openbare",
        "verificatiepagina's. Een vermelding is geen zelfstandig bewijs zonder",
        "de gekoppelde officiële bron.",
        "",
        f"Laatste controle: `{checked_at}`",
        "",
    ]

    if not records:
        lines.extend(
            [
                "Er zijn nog geen officiële openbare verificatielinks ingesteld.",
                "",
                "Voeg ze één per regel toe aan:",
                "",
                "`credentials/sources.txt`",
                "",
            ]
        )
    else:
        for record in records:
            lines.extend(
                [
                    f"## {record['title']}",
                    "",
                    f"- Status: **{record['status']}**",
                    f"- Officiële bron: {record['url']}",
                    f"- Content-Type: `{record['content_type'] or 'onbekend'}`",
                    f"- SHA-256: `{record['sha256'] or 'niet beschikbaar'}`",
                    f"- Gecontroleerd: `{record['checked_at']}`",
                    "",
                ]
            )

    lines.extend(
        [
            "## Beveiligingsverklaring",
            "",
            "Deze repository bewaart geen privésleutels, API-tokens, P12/PFX-bestanden,",
            "Google-inlogcookies of niet-openbare persoonsgegevens.",
            "",
        ]
    )

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    STATE_FILE.write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

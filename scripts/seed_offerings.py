#!/usr/bin/env python3
"""
Seed the offerings table from NYC Open Data via Socrata API.

Sources:
  1. FacDB (ji82-xba5) — 15k+ facilities across all 6 categories; no hours
  2. Workforce1 Career Centers (6smc-7mk6) — ~30 SBS career centers with hours

Usage:
  python scripts/seed_offerings.py --dry-run        # print stats, no DB writes
  python scripts/seed_offerings.py                  # upsert into Supabase
  python scripts/seed_offerings.py --out data.json  # write JSON to file

Requires environment variables (or .env.local in repo root):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Acronyms that should stay uppercase after title-casing
_KEEP_UPPER = {"NYC", "DOE", "CUNY", "SUNY", "GED", "HIV", "AIDS", "STD", "STI",
               "LGBTQ", "STEM", "HRA", "ACS", "DYCD", "DOHMH", "SBS", "HPD",
               "DHS", "NYPD", "FDNY", "DMV", "EBT", "SNAP"}

_APOSTROPHE_RE = re.compile(r"(\b\w+)'(\w)\b")

def _title(s: str) -> str:
    """Title-case a facility name, preserving apostrophes and known acronyms.

    str.title() breaks on apostrophes: "WOMEN'S" → "Women'S".
    It also lowercases acronyms: "NYC" → "Nyc".
    """
    # Capitalise each word, then fix apostrophe-followup letters (Women'S → Women's)
    result = _APOSTROPHE_RE.sub(lambda m: m.group(0)[:-1] + m.group(2).lower(), s.title())
    # Restore known acronyms
    words = result.split()
    restored = []
    for w in words:
        clean = re.sub(r"[^A-Za-z]", "", w).upper()
        if clean in _KEEP_UPPER:
            restored.append(w.replace(w[:len(clean)], clean, 1) if w[:len(clean)].isalpha() else w.upper())
        else:
            restored.append(w)
    return " ".join(restored)


# ---------------------------------------------------------------------------
# Schema mappings
# ---------------------------------------------------------------------------

# FacDB facsubgrp → human-readable service label
SERVICE_LABELS: dict[str, str] = {
    "SOUP KITCHENS AND FOOD PANTRIES": "Soup Kitchen / Food Pantry",
    "CHILD NUTRITION": "Child Nutrition Program",
    "NON-RESIDENTIAL HOUSING AND HOMELESS SERVICES": "Housing & Homeless Services",
    "HOSPITALS AND CLINICS": "Hospital / Clinic",
    "MENTAL HEALTH": "Mental Health Services",
    "SUBSTANCE USE DISORDER TREATMENT PROGRAMS": "Substance Use Treatment",
    "OTHER HEALTH CARE": "Health Care",
    "RESIDENTIAL HEALTH CARE": "Residential Health Care",
    "HEALTH PROMOTION AND DISEASE PREVENTION": "Health Promotion",
    "DAY CARE": "Day Care",
    "DOE UNIVERSAL PRE-KINDERGARTEN": "Universal Pre-K (DOE)",
    "AFTER-SCHOOL PROGRAMS": "After-School Program",
    "PRESCHOOLS FOR STUDENTS WITH DISABILITIES": "Preschool for Special Needs",
    "LEGAL AND INTERVENTION SERVICES": "Legal Aid / Intervention",
    "WORKFORCE DEVELOPMENT": "Workforce Development",
    "YOUTH CENTERS, LITERACY PROGRAMS, AND JOB TRAINING SERVICES": "Youth Services / Job Training",
    "GED AND ALTERNATIVE HIGH SCHOOL EQUIVALENCY": "GED / HiSET Prep",
    "ADULT AND IMMIGRANT LITERACY": "Adult & Immigrant Literacy",
}

# FacDB facsubgrp → our category
CATEGORY_MAP: dict[str, str] = {
    # food
    "SOUP KITCHENS AND FOOD PANTRIES": "food",
    "CHILD NUTRITION": "food",
    # housing
    "NON-RESIDENTIAL HOUSING AND HOMELESS SERVICES": "housing",
    # healthcare
    "HOSPITALS AND CLINICS": "healthcare",
    "MENTAL HEALTH": "healthcare",
    "SUBSTANCE USE DISORDER TREATMENT PROGRAMS": "healthcare",
    "OTHER HEALTH CARE": "healthcare",
    "RESIDENTIAL HEALTH CARE": "healthcare",
    "HEALTH PROMOTION AND DISEASE PREVENTION": "healthcare",
    # childcare
    "DAY CARE": "childcare",
    "DOE UNIVERSAL PRE-KINDERGARTEN": "childcare",
    "AFTER-SCHOOL PROGRAMS": "childcare",
    "PRESCHOOLS FOR STUDENTS WITH DISABILITIES": "childcare",
    # legal
    "LEGAL AND INTERVENTION SERVICES": "legal",
    # jobs
    "WORKFORCE DEVELOPMENT": "jobs",
    "YOUTH CENTERS, LITERACY PROGRAMS, AND JOB TRAINING SERVICES": "jobs",
    "GED AND ALTERNATIVE HIGH SCHOOL EQUIVALENCY": "jobs",
    "ADULT AND IMMIGRANT LITERACY": "jobs",
}

# FacDB optype → our provider_type
PROVIDER_TYPE_MAP: dict[str, str] = {
    "Public": "gov",
    "Non-public": "npo",
    "": "npo",
}

FACDB_RESOURCE = "ji82-xba5"
WORKFORCE1_RESOURCE = "6smc-7mk6"
SOCRATA_BASE = "https://data.cityofnewyork.us/resource"
PAGE_SIZE = 1000

# ---------------------------------------------------------------------------
# Socrata helpers
# ---------------------------------------------------------------------------

def _fetch(url: str) -> list[dict]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} fetching {url}: {e.reason}", file=sys.stderr)
        return []


def fetch_paginated(resource: str, where: str | None = None) -> list[dict]:
    records: list[dict] = []
    offset = 0
    while True:
        params: dict[str, str | int] = {"$limit": PAGE_SIZE, "$offset": offset, "$order": ":id"}
        if where:
            params["$where"] = where
        url = f"{SOCRATA_BASE}/{resource}.json?{urllib.parse.urlencode(params)}"
        page = _fetch(url)
        if not page:
            break
        records.extend(page)
        print(f"  [{resource}] {len(records)} records...", file=sys.stderr)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return records

# ---------------------------------------------------------------------------
# FacDB transform
# ---------------------------------------------------------------------------

def _build_address(row: dict) -> str | None:
    addr = row.get("address", "").strip()
    if addr:
        return addr
    num = row.get("addressnum", "").strip()
    street = row.get("streetname", "").strip()
    city = row.get("city", "").strip()
    zipcode = row.get("zipcode", "").strip()
    parts = [f"{num} {street}".strip(), city, zipcode]
    return ", ".join(p for p in parts if p) or None


def facdb_to_offering(row: dict) -> dict | None:
    try:
        lat = float(row.get("latitude", 0))
        lng = float(row.get("longitude", 0))
    except (ValueError, TypeError):
        return None
    if lat == 0.0 or lng == 0.0:
        return None

    category = CATEGORY_MAP.get(row.get("facsubgrp", ""))
    if not category:
        return None

    facsubgrp = row.get("facsubgrp", "")
    service_label = SERVICE_LABELS.get(facsubgrp)

    return {
        "name": _title(row.get("facname", "").strip()),
        "category": category,
        "provider_type": PROVIDER_TYPE_MAP.get(row.get("optype", ""), "npo"),
        "address": _build_address(row),
        "lat": lat,
        "lng": lng,
        "hours_json": None,
        "services": [service_label] if service_label else None,
        "availability_status": "unknown",
        "data_source": f"facdb:{row.get('datasource', '')}",
        "flagged": False,
    }

# ---------------------------------------------------------------------------
# Workforce1 transform
# ---------------------------------------------------------------------------

# Parse "Mon - Fri: 8:30 AM - 5:00 PM; Sat: 9:00 AM - 1:00 PM" into structured JSON
_HOURS_RE = re.compile(r"([^:]+):\s*([^;]+)")

def _parse_hours(text: str) -> dict | None:
    if not text or not text.strip():
        return None
    schedule = []
    for m in _HOURS_RE.finditer(text):
        days = m.group(1).strip().lstrip(";").strip()
        hours = m.group(2).strip()
        schedule.append({"days": days, "hours": hours})
    if not schedule:
        return {"text": text.strip()}
    return {"schedule": schedule, "text": text.strip()}


def workforce1_to_offering(row: dict) -> dict | None:
    try:
        lat = float(row.get("latitude", 0))
        lng = float(row.get("longitude", 0))
    except (ValueError, TypeError):
        return None
    if lat == 0.0 or lng == 0.0:
        return None

    num = row.get("number", "").strip()
    street = row.get("street", "").strip()
    city = row.get("city", "").strip()
    state = row.get("state", "NY").strip()
    postcode = row.get("postcode", "").strip()
    address_parts = [f"{num} {street}".strip(), city, state, postcode]
    address = ", ".join(p for p in address_parts if p) or None

    hours_text = row.get("hours", "")
    hours_json = _parse_hours(hours_text)

    location_type = row.get("location_type", "").strip()
    services = [location_type] if location_type else ["Workforce1 Career Center"]

    return {
        "name": _title(row.get("name", "").strip()),
        "category": "jobs",
        "provider_type": "gov",
        "address": address,
        "lat": lat,
        "lng": lng,
        "hours_json": hours_json,
        "services": services,
        "availability_status": "unknown",
        "data_source": "workforce1:sbs",
        "flagged": False,
    }

# ---------------------------------------------------------------------------
# Dedup
# ---------------------------------------------------------------------------

def dedup(offerings: list[dict]) -> list[dict]:
    """Deduplicate by (name, address, category). Prefer record with hours."""
    seen: dict[tuple, int] = {}
    result: list[dict] = []
    dupes = 0
    for o in offerings:
        key = (o["name"].lower(), (o["address"] or "").lower(), o["category"])
        if key in seen:
            # Replace if new record has hours and existing doesn't
            existing_idx = seen[key]
            if o["hours_json"] and not result[existing_idx]["hours_json"]:
                result[existing_idx] = o
            dupes += 1
        else:
            seen[key] = len(result)
            result.append(o)
    if dupes:
        print(f"  Deduped {dupes} duplicate records", file=sys.stderr)
    return result

# ---------------------------------------------------------------------------
# Supabase upsert
# ---------------------------------------------------------------------------

def load_env() -> dict[str, str]:
    env_path = Path(__file__).parent.parent / ".env.local"
    env: dict[str, str] = {}
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            v = v.strip()
            # Strip quoted values (handles inline comments after closing quote)
            if v.startswith('"'):
                end = v.find('"', 1)
                v = v[1:end] if end != -1 else v[1:]
            elif v.startswith("'"):
                end = v.find("'", 1)
                v = v[1:end] if end != -1 else v[1:]
            else:
                # Unquoted: strip inline comment
                v = v.split("#")[0].strip()
            env[k.strip()] = v
    return env


def truncate_offerings(supabase_url: str, service_key: str) -> None:
    """Delete all non-flagged rows. Preserves any rows manually flagged as inaccurate."""
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/offerings?flagged=eq.false"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Prefer": "return=minimal",
    }
    req = urllib.request.Request(endpoint, headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=60):
            print("  Cleared existing offerings (flagged=false).", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"  Truncate error: {e.code} {e.read().decode()[:200]}", file=sys.stderr)
        sys.exit(1)


def insert_to_supabase(offerings: list[dict], supabase_url: str, service_key: str) -> None:
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/offerings"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    batch_size = 500
    total = 0
    for i in range(0, len(offerings), batch_size):
        batch = offerings[i : i + batch_size]
        body = json.dumps(batch).encode()
        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60):
                total += len(batch)
                print(f"  Inserted {total}/{len(offerings)}...", file=sys.stderr)
        except urllib.error.HTTPError as e:
            print(f"  Insert error batch {i//batch_size}: {e.code} {e.read().decode()[:200]}", file=sys.stderr)
            sys.exit(1)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Seed offerings from NYC Open Data")
    parser.add_argument("--dry-run", action="store_true", help="No DB writes")
    parser.add_argument("--out", help="Write JSON to file")
    args = parser.parse_args()

    # --- FacDB ---
    print("Fetching FacDB...", file=sys.stderr)
    subgrps = list(CATEGORY_MAP.keys())
    quoted = ", ".join(f"'{s}'" for s in subgrps)
    facdb_raw = fetch_paginated(FACDB_RESOURCE, where=f"facsubgrp IN ({quoted})")
    print(f"FacDB: {len(facdb_raw)} raw records", file=sys.stderr)
    facdb_offerings = [o for row in facdb_raw if (o := facdb_to_offering(row)) is not None]
    print(f"FacDB: {len(facdb_offerings)} after transform (skipped {len(facdb_raw) - len(facdb_offerings)} missing coords)", file=sys.stderr)

    # --- Workforce1 ---
    print("Fetching Workforce1...", file=sys.stderr)
    wf1_raw = fetch_paginated(WORKFORCE1_RESOURCE)
    print(f"Workforce1: {len(wf1_raw)} raw records", file=sys.stderr)
    wf1_offerings = [o for row in wf1_raw if (o := workforce1_to_offering(row)) is not None]
    print(f"Workforce1: {len(wf1_offerings)} after transform", file=sys.stderr)

    # --- Merge and dedup ---
    # Workforce1 first so its hours survive dedup when FacDB has the same site
    all_offerings = dedup(wf1_offerings + facdb_offerings)
    print(f"\nTotal after dedup: {len(all_offerings)}", file=sys.stderr)

    cats = Counter(o["category"] for o in all_offerings)
    providers = Counter(o["provider_type"] for o in all_offerings)
    with_hours = sum(1 for o in all_offerings if o["hours_json"])

    print("\nCategory breakdown:", file=sys.stderr)
    for cat, n in sorted(cats.items()):
        print(f"  {cat}: {n}", file=sys.stderr)
    print("\nProvider type breakdown:", file=sys.stderr)
    for pt, n in sorted(providers.items()):
        print(f"  {pt}: {n}", file=sys.stderr)
    hours_pct = (100 * with_hours // len(all_offerings)) if all_offerings else 0
    print(f"\nRecords with hours: {with_hours}/{len(all_offerings)} ({hours_pct}%)", file=sys.stderr)

    if not all_offerings:
        print("No offerings to seed — aborting.", file=sys.stderr)
        sys.exit(1)

    if args.out:
        Path(args.out).write_text(json.dumps(all_offerings, indent=2))
        print(f"Wrote {len(all_offerings)} records to {args.out}", file=sys.stderr)

    if args.dry_run:
        print("\nDry run — no DB writes.", file=sys.stderr)
        return

    env = load_env()
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        print(
            "\nMissing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "in .env.local or as environment variables.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Sanity check: refuse to wipe the DB if fetch returned suspiciously few records.
    # Protects against partial Socrata failures mid-pagination silently truncating data.
    MIN_EXPECTED = 1000
    if len(all_offerings) < MIN_EXPECTED:
        print(
            f"\nSafety check failed: only {len(all_offerings)} offerings fetched "
            f"(minimum expected: {MIN_EXPECTED}). Aborting — DB not modified.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"\nClearing existing offerings...", file=sys.stderr)
    truncate_offerings(supabase_url, service_key)
    print(f"Inserting {len(all_offerings)} records...", file=sys.stderr)
    insert_to_supabase(all_offerings, supabase_url, service_key)
    print(f"Done. {len(all_offerings)} offerings seeded.", file=sys.stderr)


if __name__ == "__main__":
    main()

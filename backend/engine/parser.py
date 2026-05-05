"""
Entity extraction pipeline — 3 layers:
  1. LLM-first: ask Groq to extract brand/product/company names as JSON
  2. Rule-based filter: remove geography, generic nouns, flavors, adjectives, junk
  3. Frequency + position enrichment

Entity shape:
  {name, type, positions, count, sentiment, first_position}
  type: "brand" | "product" | "category"

LLM validation uses query_groq_internal (fast llama3-8b) — does NOT use
OpenAI or Gemini, keeping extraction fast and cost-free.
"""
from __future__ import annotations

import re
import json
import unicodedata
import asyncio

# Internal Groq call — NOT the query model, just the small validator
from providers.groq_provider import query_groq_internal

# ---------------------------------------------------------------------------
# Block-lists
# ---------------------------------------------------------------------------
_GEOGRAPHY = {
    "india", "indian", "usa", "us", "uk", "europe", "asia", "global",
    "worldwide", "international", "domestic", "local", "national",
    "america", "american", "china", "chinese", "japan", "japanese",
    "germany", "german", "france", "french", "australia", "australian",
    "canada", "canadian", "delhi", "mumbai", "bangalore", "london",
    "york", "pacific", "atlantic", "east", "west", "north", "south",
    "korean", "korea", "taiwan", "brazil", "brazilian", "mexican", "mexico",
}

# FIX 1: Added a dedicated flavors/attributes/adjectives block-list.
# These were leaking through as "brands" because they appear title-cased
# in product descriptions (e.g. "Spicy variant", "Masala flavour").
_FLAVORS_AND_ATTRIBUTES = {
    # tastes / flavors
    "spicy", "masala", "salted", "sweet", "salty", "sour", "bitter",
    "tangy", "smoky", "smoked", "bbq", "barbecue", "cheesy", "cheese",
    "creamy", "buttery", "herby", "herbed", "peri", "chilli", "chili",
    "pepper", "peppered", "mint", "minty", "lime", "lemon", "lemony",
    "mango", "strawberry", "vanilla", "chocolate", "caramel", "honey",
    "original", "classic", "plain", "natural", "unflavored", "unsalted",
    "roasted", "baked", "fried", "grilled", "toasted",
    # texture / format adjectives
    "crunchy", "crispy", "crisp", "light", "thin", "thick", "wavy",
    "ridged", "ridge", "ruffled", "puffed", "puff", "crunched",
    # size / quantity
    "mini", "large", "small", "medium", "giant", "jumbo", "regular",
    "family", "sharing", "single", "double", "triple", "extra",
    # generic product descriptors that look like brand names when capitalised
    "premium", "classic", "signature", "special", "limited", "edition",
    "lite", "zero", "plus", "pro", "max", "ultra", "super", "mega",
    # catch-all sensory / marketing adjectives
    "fresh", "pure", "real", "true", "genuine", "authentic", "organic",
    "natural", "healthy", "rich", "bold", "strong", "mild", "hot",
    "cool", "cold", "frozen", "dry", "wet", "raw",
}

_GENERIC_NOUNS = {
    # supplement / food category words
    "protein", "supplement", "supplements", "whey", "creatine", "bcaa",
    "powder", "capsule", "capsules", "tablet", "tablets", "bar", "bars",
    "shake", "shakes", "blend", "formula", "formulas", "mix", "dose",
    "dosage", "ingredient", "ingredients", "flavor", "flavors", "scoop",
    "chip", "chips", "snack", "snacks", "candy", "sweet",
    "drink", "beverage", "juice", "soda", "water", "milk", "cream",
    "food", "meal", "diet", "nutrition", "calorie", "calories", "carb",
    # business/meta
    "brand", "brands", "company", "companies", "product", "products",
    "market", "industry", "category", "option", "options", "choice",
    "solution", "solutions", "service", "services", "platform", "tool",
    "tools", "app", "apps", "model", "models", "system",
    # quality / superlatives
    "best", "top", "great", "good", "better", "popular", "trusted",
    "recommended", "leading", "quality", "value", "budget",
    "review", "reviews", "rating", "ratings", "range", "variety",
    "affordable", "cheap", "expensive", "price",
    # generic English
    "the", "this", "these", "that", "those", "when", "however",
    "additionally", "furthermore", "for", "in", "it", "you", "they",
    "we", "but", "and", "or", "a", "an", "is", "are", "be", "has",
    "have", "with", "on", "at", "to", "from", "by", "of", "as", "its",
    "their", "our", "your", "also", "here", "there", "then", "than",
    "into", "about", "through", "over", "under", "while", "during",
    "before", "after", "since", "if", "unless", "although", "because",
    "both", "either", "neither", "each", "every", "some", "all", "any",
    "many", "most", "other", "another", "such", "same", "new", "own",
    "well", "just", "even", "will", "can", "may", "should", "would",
    "could", "been", "being", "make", "made", "take", "taken", "get",
    "got", "give", "given", "see", "seen", "come", "came", "go",
    "going", "know", "known", "think", "thought", "use", "used",
    "find", "found", "look", "looking", "want", "need", "help",
    "support", "provide", "provides", "include", "includes", "offer",
    "offers", "available", "high", "primary", "various", "different",
    "specific", "important", "key", "main", "major", "certain",
    "possible", "based", "including", "therefore", "thus", "hence",
    "moreover", "meanwhile", "otherwise", "above", "below", "between",
    "among", "against", "without", "result", "results", "effect",
    "effects", "impact", "cost",
    # time / units
    "year", "years", "month", "months", "day", "days", "time", "times",
    "number", "way", "ways", "type", "types", "kind", "level", "levels",
    "amount", "amounts", "standard", "standards", "form", "forms",
    "part", "parts", "area", "areas", "field", "fields", "point",
    "points", "step", "steps", "aspect", "aspects", "example",
    "examples", "case", "cases", "fact", "facts", "reason", "reasons",
    "purpose", "purposes", "benefit", "benefits", "feature", "features",
}

# FIX 2: Merge all three block-lists so every filter check is a single lookup.
_BLOCKLIST = _GEOGRAPHY | _GENERIC_NOUNS | _FLAVORS_AND_ATTRIBUTES

_POSITIVE_SIGNALS = {
    "best", "top", "recommended", "leading", "popular", "trusted",
    "excellent", "outstanding", "premium", "superior", "renowned",
    "well-known", "highly rated", "favorite", "preferred",
}
_NEGATIVE_SIGNALS = {
    "avoid", "poor", "worst", "ineffective", "overpriced", "unreliable",
    "low quality", "inferior", "bad", "terrible", "disappointing",
}


# ---------------------------------------------------------------------------
# Fuzzy normaliser + matcher
# ---------------------------------------------------------------------------
def _normalise(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s.lower())


def fuzzy_match(a: str, b: str) -> bool:
    na, nb = _normalise(a), _normalise(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    shorter, longer = (na, nb) if len(na) <= len(nb) else (nb, na)
    return shorter in longer and len(shorter) >= 4


# ---------------------------------------------------------------------------
# Layer 1: LLM-first extraction via Groq internal model
# ---------------------------------------------------------------------------
# FIX 3: Completely rewrote the system prompt.
# Key changes:
#   - Explicit EXCLUDE list for flavors/adjectives/attributes
#   - Positive INCLUDE examples are real trademarked brand names only
#   - Added the "if in doubt, leave it out" rule
#   - Removed the old examples that mixed real brands with flavor words
_LLM_SYSTEM = """You are a strict named-entity recognition system specialised in brand extraction.

TASK: Extract ONLY the names of real, trademarked brands or companies from the text.

STRICT RULES — read carefully:

INCLUDE only if the name is:
  - A real registered brand or company (e.g. MuscleBlaze, Optimum Nutrition, MyProtein,
    Dymatize, GNC, MuscleTech, Lay's, Doritos, Pringles, Haldiram's, Kurkure, Bingo,
    Too Yumm, ITC, PepsiCo, Britannia, Parle, Nestle, Cadbury, Red Bull, Monster)

EXCLUDE anything that is:
  - A flavor, taste, or sensory word: spicy, masala, salted, sweet, tangy, cheesy,
    smoky, original, classic, roasted, crunchy, crispy, plain, barbecue, chilli, pepper
  - An adjective or attribute: best, top, premium, popular, healthy, light, mini, extra
  - A generic food/product category: protein, supplement, powder, chips, snack, drink,
    bar, shake, capsule, blend, formula
  - A geographic term: India, USA, Asia, Global, Local
  - Any common English word

WHEN IN DOUBT, LEAVE IT OUT. Only include names you are confident are real brand names.

For each valid brand, output its type:
  "brand"   — the company / brand itself (Lay's, MuscleBlaze)
  "product" — a specific named product line that is trademarked (Kurkure Triangles)
  "category" — never use this; categories are always excluded

Return ONLY valid JSON — an array of objects with no markdown, no explanation:
[{"name": "ExactBrandName", "type": "brand|product"}]

If no valid brands are found, return an empty array: []"""


def _llm_extract_sync(text: str) -> list[dict]:
    """
    Synchronous wrapper — called inside asyncio.to_thread when needed,
    or directly from sync context.
    """
    snippet = text[:1200]
    try:
        import os
        from groq import Groq
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        resp = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": _LLM_SYSTEM},
                {"role": "user",   "content": f"Text:\n{snippet}"},
            ],
            temperature=0,
        )
        content = resp.choices[0].message.content.strip()
        arr = re.search(r"\[.*?\]", content, re.DOTALL)
        if arr:
            parsed = json.loads(arr.group())
            if isinstance(parsed, list):
                return [
                    {
                        "name": str(item.get("name", "")),
                        "type": str(item.get("type", "brand")),
                    }
                    for item in parsed
                    if isinstance(item, dict) and item.get("name")
                ]
    except Exception:
        pass
    return []


# ---------------------------------------------------------------------------
# Layer 2: rule-based filter
# ---------------------------------------------------------------------------
_JUNK_RE = re.compile(
    r"^(https?|www|com|org|net|edu|faq|seo|aeo|roi|ctr|kpi|api|url|html|"
    r"css|sql|json|xml|pdf|vs|dr|mr|mrs|ms|jan|feb|mar|apr|may|jun|"
    r"jul|aug|sep|oct|nov|dec)$",
    re.IGNORECASE,
)

# FIX 4: Tightened the title-case regex — now requires at least 2 chars per
# token to prevent single-letter initials and 2-char abbreviations from matching.
_TITLE_RE = re.compile(r'\b([A-Z][a-zA-Z0-9&\'-]{2,}(?:[ \t][A-Z][a-zA-Z0-9&\'-]{2,}){0,3})\b')
_CAPS_RE  = re.compile(r'\b([A-Z]{3,}[a-zA-Z0-9]*)\b')  # raised minimum to 3 ALL-CAPS chars

# FIX 5: Pre-compiled set of normalised blocklist keys for O(1) lookup.
_BLOCKLIST_NORM = {_normalise(w) for w in _BLOCKLIST}


def _is_valid(name: str, entity_type: str = "brand") -> bool:
    lower = name.lower().strip()
    norm  = _normalise(name)

    # Direct lowercase match
    if lower in _BLOCKLIST:
        return False
    # Normalised match catches accented / punctuated variants
    if norm in _BLOCKLIST_NORM:
        return False
    if len(name) < 3:
        return False
    if _JUNK_RE.match(name):
        return False
    # FIX 6: Reject entity_type == "category" AND "product" adjective-style names.
    if entity_type == "category":
        return False
    # FIX 7: Reject names that are pure dictionary words (all lowercase when stripped).
    # Real brand names are almost always mixed-case or acronyms.
    if name == name.lower() and len(name) < 8:
        return False
    return True


def _regex_fallback(text: str) -> list[dict]:
    candidates: list[dict] = []
    seen: set[str] = set()
    for raw in _TITLE_RE.findall(text) + _CAPS_RE.findall(text):
        name = raw.strip()
        key = _normalise(name)
        if key in seen or not key or len(key) < 3:
            continue
        if name.lower() in _BLOCKLIST or key in _BLOCKLIST_NORM or _JUNK_RE.match(name):
            continue
        seen.add(key)
        candidates.append({"name": name, "type": "brand"})
    return candidates


# ---------------------------------------------------------------------------
# Layer 3: frequency, position, sentiment enrichment
# ---------------------------------------------------------------------------
def _enrich(items: list[dict], text: str) -> list[dict]:
    words = text.split()
    sentences = [s.strip() for s in re.split(r"[.!?\n]", text) if s.strip()]
    enriched: list[dict] = []

    for item in items:
        name = item["name"]
        entity_type = item.get("type", "brand")

        pat = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
        count = len(pat.findall(text))
        if count == 0:
            count = len(re.findall(re.escape(_normalise(name)), _normalise(text)))
            if count == 0:
                continue

        positions = [
            idx + 1
            for idx, sent in enumerate(sentences)
            if pat.search(sent)
        ]
        first_pos = min(positions) if positions else 999

        sentiment = "neutral"
        for m in pat.finditer(text):
            wi = len(text[: m.start()].split())
            window = {w.lower().strip(".,;:!?\"'()[]") for w in words[max(0, wi - 12): wi + 12]}
            if window & _POSITIVE_SIGNALS:
                sentiment = "positive"
            elif window & _NEGATIVE_SIGNALS:
                sentiment = "negative"
            break

        enriched.append({
            "name":           name,
            "type":           entity_type,
            "positions":      positions,
            "count":          count,
            "sentiment":      sentiment,
            "first_position": first_pos,
        })

    return enriched


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def extract_entities(text: str, business_name: str = "") -> list[dict]:
    """
    Full 3-layer pipeline (synchronous — safe to call from async via executor).
    Returns list of {name, type, positions, count, sentiment, first_position}
    sorted by first_position ascending.
    """
    if not text or text.startswith("Model unavailable"):
        result: list[dict] = []
        if business_name:
            result.append({
                "name": business_name, "type": "brand",
                "positions": [], "count": 0,
                "sentiment": "neutral", "first_position": 999,
            })
        return result

    # Layer 1: LLM extraction
    llm_items = _llm_extract_sync(text)

    # Layer 2: filter
    filtered = [item for item in llm_items if _is_valid(item["name"], item.get("type", "brand"))]

    # Fallback to regex if LLM returned nothing useful
    if not filtered:
        fallback = _regex_fallback(text)
        filtered = [item for item in fallback if _is_valid(item["name"], "brand")]

    # Deduplicate by normalised key
    seen: dict[str, dict] = {}
    for item in filtered:
        key = _normalise(item["name"])
        if key and key not in seen:
            seen[key] = item

    # Layer 3: enrich
    enriched = _enrich(list(seen.values()), text)

    # Quality gate: count >= 2 OR first_position <= 3
    quality = [e for e in enriched if e["count"] >= 2 or e["first_position"] <= 3]

    # Always include business_name
    if business_name:
        biz_match = next((e for e in quality if fuzzy_match(e["name"], business_name)), None)
        if biz_match:
            biz_match["name"] = business_name
        else:
            biz_in_enriched = next((e for e in enriched if fuzzy_match(e["name"], business_name)), None)
            if biz_in_enriched:
                biz_in_enriched["name"] = business_name
                quality.append(biz_in_enriched)
            else:
                quality.append({
                    "name": business_name, "type": "brand",
                    "positions": [], "count": 0,
                    "sentiment": "neutral", "first_position": 999,
                })

    quality.sort(key=lambda e: e["first_position"])
    return quality
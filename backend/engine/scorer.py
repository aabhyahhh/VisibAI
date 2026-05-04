"""
AEO Scorer — 100-point scale with all intelligence layers:
  - Score breakdown with explanations
  - Confidence rating
  - Why You Lost (direct, persuasive copy)
  - Leaderboard (ranked competitor data)
  - Category Dominance Insight
  - Impact Simulation
  - AI Thinking (dynamic, competitor-aware)
  - Entity Strength Map
"""
from __future__ import annotations
import re

from engine.parser import fuzzy_match


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _find_entity(entities_for_model: list[dict], business_name: str) -> dict | None:
    for e in entities_for_model:
        if fuzzy_match(e["name"], business_name):
            return e
    return None


def _position_score(avg_pos: float) -> int:
    if avg_pos <= 1:  return 25
    if avg_pos <= 2:  return 22
    if avg_pos <= 3:  return 18
    if avg_pos <= 5:  return 12
    if avg_pos <= 7:  return 6
    if avg_pos <= 10: return 3
    return 1


def _confidence(models_found: int, frequency: int) -> str:
    if models_found >= 3 and frequency >= 4:
        return "High"
    if models_found >= 2 or frequency >= 2:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Why You Lost — direct, persuasive, competitor-aware
# ---------------------------------------------------------------------------
def _why_lost(
    business_name: str,
    competitors: list[str],
    presence: int,
    ranking: int,
    frequency: int,
) -> list[str]:
    reasons: list[str] = []
    rival = competitors[0] if competitors else None

    if presence == 0:
        reasons.append(
            f"**{business_name} is completely invisible in AI answers.** "
            f"When users ask this question, AI models do not mention you at all. "
            + (f"**{rival}** is capturing every one of those recommendations instead." if rival else
               "Competitors are capturing every one of those recommendations.")
        )
    elif presence < 20:
        reasons.append(
            f"**{business_name} appears in only 1 of 3 AI models.** "
            f"This means 66% of users asking this question will never see your brand in the answer."
            + (f" {rival} has a far stronger cross-model presence." if rival else "")
        )

    if ranking == 0 and presence > 0:
        reasons.append(
            f"**You are buried.** Even when {business_name} is mentioned, it appears so far "
            "down the response that AI models treat it as an afterthought — not a recommendation."
        )
    elif ranking > 0 and ranking < 12:
        reasons.append(
            f"**Your ranking position is weak.** {business_name} does not appear in the top 3 "
            "positions of AI answers, which is where 80% of user attention goes."
        )

    if frequency <= 1:
        reasons.append(
            f"**AI models almost never cite you.** With only {frequency} mention(s) detected, "
            "you lack the content depth, review volume, and structured data that AI models "
            "need to confidently recommend a brand."
        )

    if rival and presence > 0:
        reasons.append(
            f"**{rival} dominates this query.** They have deep structured content, "
            "comparison pages, and third-party citations that AI models consistently pull from. "
            "Until you match their content footprint, they will continue to win."
        )

    if not reasons:
        reasons.append(
            f"**{business_name} is visible but not dominant.** "
            "You have a presence, but competitors are outranking you in citation frequency "
            "and position. Targeted content expansion can close this gap quickly."
        )

    return reasons[:4]


# ---------------------------------------------------------------------------
# Leaderboard — ranked competitor data for leaderboard UI
# ---------------------------------------------------------------------------
def _build_leaderboard(
    business_name: str,
    entities: dict[str, list[dict]],
    models: list[str],
) -> list[dict]:
    """
    Returns all BRAND-type entities (including business) ranked by:
    1. frequency DESC  2. avg_position ASC  3. model_coverage DESC
    """
    brand_stats: dict[str, dict] = {}

    for model in models:
        for e in entities.get(model, []):
            # ONLY brands — skip categories and products
            if e.get("type", "brand") == "category":
                continue
            name = e["name"]
            # merge fuzzy variants under the same key
            key = next(
                (k for k in brand_stats if fuzzy_match(k, name)),
                name,
            )
            if key not in brand_stats:
                brand_stats[key] = {
                    "name": key,
                    "type": e.get("type", "brand"),
                    "total_mentions": 0,
                    "positions": [],
                    "models": set(),
                    "sentiments": [],
                    "is_user": fuzzy_match(key, business_name) if business_name else False,
                }
            brand_stats[key]["total_mentions"] += e.get("count", 0)
            fp = e.get("first_position", 999)
            if fp != 999:
                brand_stats[key]["positions"].append(fp)
            brand_stats[key]["models"].add(model)
            brand_stats[key]["sentiments"].append(e.get("sentiment", "neutral"))

    leaderboard = []
    for key, s in brand_stats.items():
        avg_pos = (
            round(sum(s["positions"]) / len(s["positions"]), 1)
            if s["positions"] else 999
        )
        pos_count = len(s["positions"])
        # Positive sentiment if majority positive
        sentiments = s["sentiments"]
        pos_count_sent = sentiments.count("positive")
        neg_count_sent = sentiments.count("negative")
        dominant_sentiment = (
            "positive" if pos_count_sent > neg_count_sent
            else "negative" if neg_count_sent > pos_count_sent
            else "neutral"
        )

        leaderboard.append({
            "name": s["name"],
            "type": s["type"],
            "total_mentions": s["total_mentions"],
            "avg_position": avg_pos,
            "model_coverage": len(s["models"]),
            "models": sorted(s["models"]),
            "sentiment": dominant_sentiment,
            "is_user": s["is_user"],
        })

    # Sort: frequency DESC, position ASC, coverage DESC
    leaderboard.sort(key=lambda x: (
        -x["total_mentions"],
        x["avg_position"],
        -x["model_coverage"],
    ))

    # Assign ranks (user brand gets its actual rank)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return leaderboard


def _leaderboard_description(entry: dict, rank: int, total: int) -> str:
    """Generate a one-line narrative for each leaderboard entry."""
    name = entry["name"]
    mentions = entry["total_mentions"]
    coverage = entry["model_coverage"]
    avg_pos = entry["avg_position"]

    if rank == 1 and coverage >= 3:
        return f"Dominates AI answers — mentioned {mentions}× across all 3 models with top-3 positions."
    if rank == 1:
        return f"Leads this query with {mentions} mentions across {coverage} model(s)."
    if coverage >= 3:
        return f"Strong multi-model presence — {mentions} mentions, consistent ranking."
    if avg_pos <= 3:
        return f"Appears early in AI responses — top-3 position in {coverage} model(s)."
    if mentions >= 3:
        return f"Frequently cited with {mentions} mentions across {coverage} AI model(s)."
    return f"Appears in {coverage} model(s) with {mentions} mention(s)."


# ---------------------------------------------------------------------------
# Category Dominance Insight
# ---------------------------------------------------------------------------
def _category_dominance(entities: dict[str, list[dict]], query: str) -> dict | None:
    """
    Detect if AI models are answering at category level instead of brand level.
    Returns insight dict or None.
    """
    category_counts: dict[str, int] = {}
    for model_entities in entities.values():
        for e in model_entities:
            if e.get("type") == "category":
                name = e["name"]
                category_counts[name] = category_counts.get(name, 0) + e.get("count", 0)

    if not category_counts:
        return None

    top_categories = sorted(category_counts, key=lambda k: category_counts[k], reverse=True)[:3]
    total_category_mentions = sum(category_counts.values())

    if total_category_mentions < 3:
        return None

    examples = ", ".join(f"'{c}'" for c in top_categories[:2])
    return {
        "detected": True,
        "top_categories": top_categories,
        "total_mentions": total_category_mentions,
        "insight": (
            f"AI models are responding at a **category level** (e.g. {examples}) "
            f"rather than recommending specific brands. This happens when the query is broad "
            f"and no single brand has established clear authority. "
            f"Being the first brand to build strong structured content for '{query}' "
            f"gives you a significant first-mover advantage."
        ),
        "opportunity": "First-mover advantage available — no dominant brand yet.",
    }


# ---------------------------------------------------------------------------
# Impact Simulation
# ---------------------------------------------------------------------------
def _impact_simulation(score: int, business_found: bool, query: str) -> dict:
    if not business_found or score < 20:
        gain, time = 35, "6–12 weeks"
        actions = [
            "Publish 3 long-form articles targeting this query",
            "Add FAQPage schema markup to key pages",
            "Build 10+ third-party citations (G2, Trustpilot, directories)",
        ]
    elif score < 40:
        gain, time = 25, "4–8 weeks"
        actions = [
            "Add HowTo + Product schema to landing pages",
            "Create competitor comparison pages",
            "Build topical content cluster (5+ articles)",
        ]
    elif score < 60:
        gain, time = 15, "3–6 weeks"
        actions = [
            "Earn E-E-A-T signals: expert quotes, original data",
            "Increase review volume on G2/Trustpilot",
            "Expand to adjacent query variants",
        ]
    elif score < 80:
        gain, time = 10, "2–4 weeks"
        actions = [
            "Refresh existing content with new data",
            "Monitor competitor content changes weekly",
            "Expand to 3–5 adjacent query clusters",
        ]
    else:
        gain, time = 5, "Ongoing"
        actions = [
            "Defend position with quarterly content updates",
            "Expand into adjacent query clusters",
        ]

    projected = min(score + gain, 100)
    vis = lambda s: "High" if s >= 70 else "Medium" if s >= 40 else "Low" if s >= 10 else "Not Found"

    return {
        "current_score":       score,
        "projected_score":     projected,
        "score_gain":          gain,
        "current_visibility":  vis(score),
        "projected_visibility": vis(projected),
        "time_estimate":       time,
        "key_actions":         actions,
    }


# ---------------------------------------------------------------------------
# AI Thinking — dynamic, competitor-aware
# ---------------------------------------------------------------------------
def _ai_thinking(query: str, competitors: list[str]) -> dict:
    q = query.lower()
    rival1 = competitors[0] if competitors else "the leading brand"
    rival2 = competitors[1] if len(competitors) > 1 else rival1

    if any(w in q for w in ["protein", "supplement", "vitamin", "nutrition", "whey", "creatine", "muscle", "fitness"]):
        category = "supplement"
        explanation = (
            f"For supplement queries, AI models rank brands based on: **review volume** "
            f"(Amazon, Trustpilot, GNC), **comparison content** ('X vs Y'), "
            f"**ingredient transparency**, and **structured FAQ pages**. "
            f"**{rival1}** and **{rival2}** consistently appear because they have deep "
            f"content footprints across all these signals. Your brand needs to match this coverage."
        )
        priorities = [
            "Review volume on Amazon, GNC, Trustpilot",
            "Comparison pages ('Brand vs Brand')",
            "Ingredient + benefit FAQ content",
            "Structured data (Product + FAQPage schema)",
        ]
    elif any(w in q for w in ["software", "app", "platform", "tool", "saas", "dashboard", "crm", "api"]):
        category = "software"
        explanation = (
            f"For software queries, AI models prioritize brands with: **G2/Capterra ratings**, "
            f"**feature comparison pages**, **case studies with measurable outcomes**, and "
            f"**developer documentation**. "
            f"**{rival1}** dominates this space because they have comprehensive comparison "
            f"content and strong review platform presence."
        )
        priorities = [
            "G2 / Capterra / ProductHunt ratings",
            "Feature comparison pages",
            "Case studies with measurable ROI",
            "Developer docs and integration guides",
        ]
    elif any(w in q for w in ["loan", "insurance", "fund", "invest", "bank", "finance", "credit", "mortgage"]):
        category = "finance"
        explanation = (
            f"For financial product queries, AI models prioritize: **regulatory trust signals**, "
            f"**transparent fee documentation**, **expert editorial coverage**, and "
            f"**verified customer testimonials**. "
            f"**{rival1}** appears first because they have stronger compliance signals and "
            f"broader editorial coverage."
        )
        priorities = [
            "Regulatory compliance signals",
            "Transparent fee structures on-site",
            "Expert editorial coverage",
            "Verified customer testimonials",
        ]
    elif any(w in q for w in ["food", "drink", "recipe", "meal", "snack", "coffee", "tea", "chocolate"]):
        category = "food"
        explanation = (
            f"For food and beverage queries, AI models cite brands with: **recipe/usage content**, "
            f"**nutritional data in structured format**, **retail availability signals**, and "
            f"**lifestyle content matching user intent**. "
            f"**{rival1}** is cited frequently because they have deep recipe and usage content "
            f"that directly answers what users are asking."
        )
        priorities = [
            "Recipe and usage content",
            "Structured nutritional data",
            "Retail availability signals",
            "Lifestyle and use-case content",
        ]
    else:
        category = "general"
        explanation = (
            f"For this query, AI models cite brands that appear across **multiple independent "
            f"authoritative sources**, have **structured content** (FAQ, HowTo, Product schema), "
            f"strong **comparison and review platform** presence, and clear **E-E-A-T signals**. "
            f"**{rival1}** consistently appears because they have a broader, deeper content "
            f"footprint than your brand currently has."
        )
        priorities = [
            "Structured data (FAQ, HowTo, Product schema)",
            "Third-party citations and review platforms",
            "Comparison and 'vs' content",
            "E-E-A-T signals (expertise, authority, trust)",
        ]

    return {
        "explanation":       explanation,
        "priorities":        priorities,
        "category_detected": category,
        "competitor_note":   (
            f"That is why **{rival1}**"
            + (f" and **{rival2}**" if rival2 != rival1 else "")
            + " consistently outrank you in AI answers."
        ) if competitors else None,
    }


# ---------------------------------------------------------------------------
# Entity Strength Map
# ---------------------------------------------------------------------------
def _entity_strength_map(
    business_name: str,
    all_entities: dict[str, list[dict]],
    responses: dict[str, str],
) -> dict:
    all_text = " ".join(responses.values()).lower()
    biz_lower = business_name.lower()

    brand_count = sum(
        e["count"]
        for model_entities in all_entities.values()
        for e in model_entities
        if fuzzy_match(e["name"], business_name)
    )
    brand_mentions = brand_count > 0

    product_mentions = any(
        e.get("type") == "product" and fuzzy_match(e["name"], business_name)
        for model_entities in all_entities.values()
        for e in model_entities
    )

    category_words = {"best", "top", "popular", "recommended", "leading", "trusted"}
    biz_sentences = [
        s for s in re.split(r"[.!?\n]", " ".join(responses.values()))
        if biz_lower in s.lower()
    ]
    category_assoc = any(
        any(cw in sent.lower() for cw in category_words)
        for sent in biz_sentences
    )

    authority_keywords = {"expert", "study", "research", "recommended by", "certified", "award", "proven"}
    authority_signals = any(
        kw in s.lower() for s in biz_sentences for kw in authority_keywords
    )

    review_keywords = {"review", "rated", "users say", "customers", "testimonial", "stars"}
    review_signals = any(
        kw in s.lower() for s in biz_sentences for kw in review_keywords
    )

    def _status(present: bool, count: int = 0) -> dict:
        if present and count >= 3:
            return {"status": "strong", "icon": "✅", "label": "Strong"}
        if present:
            return {"status": "weak",   "icon": "⚠️", "label": "Weak"}
        return {"status": "missing", "icon": "❌", "label": "Missing"}

    return {
        "brand_mentions":       {**_status(brand_mentions, brand_count),
                                  "detail": f"{brand_count} mentions across models"},
        "product_mentions":     {**_status(product_mentions),
                                  "detail": "Product-level entities detected" if product_mentions else "No product-level entities found"},
        "category_association": {**_status(category_assoc),
                                  "detail": "Associated with category leadership terms" if category_assoc else "Not positioned as category leader"},
        "authority_signals":    {**_status(authority_signals),
                                  "detail": "Expert / study signals found" if authority_signals else "No authority indicators detected"},
        "review_signals":       {**_status(review_signals),
                                  "detail": "Review mentions present" if review_signals else "No review or rating signals found"},
    }


# ---------------------------------------------------------------------------
# Main scorer
# ---------------------------------------------------------------------------
def calculate_aeo_score(
    business_name: str,
    responses: dict[str, str],
    entities: dict[str, list[dict]],
    query: str = "",
) -> dict:
    biz_name = business_name.strip()
    models = list(responses.keys())

    # Competitors are BRAND-type only
    def _brand_competitor_counts() -> dict[str, int]:
        counts: dict[str, int] = {}
        for model in models:
            for e in entities.get(model, []):
                if e.get("type", "brand") == "category":
                    continue
                if biz_name and fuzzy_match(e["name"], biz_name):
                    continue
                counts[e["name"]] = counts.get(e["name"], 0) + e.get("count", 0)
        return counts

    # --- No business name ---
    if not biz_name:
        comp_counts = _brand_competitor_counts()
        competitors = sorted(comp_counts, key=lambda n: comp_counts[n], reverse=True)[:6]
        leaderboard = _build_leaderboard("", entities, models)
        for e in leaderboard:
            e["description"] = _leaderboard_description(e, e["rank"], len(leaderboard))

        return {
            "score": None,
            "visibility": "N/A",
            "confidence": "N/A",
            "breakdown": {k: {"score": 0, "max": m, "explanation": "No business name provided."}
                          for k, m in [("presence", 30), ("ranking", 25), ("frequency", 20),
                                       ("sentiment", 15), ("authority", 10)]},
            "competitors": competitors,
            "business_found": False,
            "why_lost": [],
            "leaderboard": leaderboard,
            "category_dominance": _category_dominance(entities, query),
            "impact_simulation": None,
            "ai_thinking": _ai_thinking(query, competitors),
            "entity_strength_map": None,
        }

    # --- PRESENCE (30) ---
    models_found = []
    for model in models:
        text = responses.get(model, "").lower()
        entity = _find_entity(entities.get(model, []), biz_name)
        if biz_name.lower() in text or (entity and entity.get("count", 0) > 0):
            models_found.append(model)

    presence = len(models_found) * 10
    if presence == 30:
        presence_expl = f"'{biz_name}' was found in all 3 AI responses. Excellent presence."
    elif presence == 20:
        presence_expl = f"'{biz_name}' appeared in 2 of 3 models. You're invisible to 33% of AI answers."
    elif presence == 10:
        presence_expl = f"'{biz_name}' appeared in only 1 model. You're invisible to 66% of AI answers."
    else:
        presence_expl = f"'{biz_name}' was not mentioned in any AI response. You have zero presence."

    # --- RANKING (25) ---
    first_positions = [
        e["first_position"]
        for model in models
        if (e := _find_entity(entities.get(model, []), biz_name))
           and e.get("first_position", 999) != 999
    ]
    if first_positions:
        avg_pos = sum(first_positions) / len(first_positions)
        ranking = _position_score(avg_pos)
        ranking_expl = (
            f"Average position {avg_pos:.1f} across models. "
            + ("Top placement — strong citation signal." if ranking >= 18 else
               "Mid-level position — not in top 3 where most users look." if ranking >= 10 else
               "Late position — AI models treat you as a secondary mention, not a recommendation.")
        )
    else:
        ranking, avg_pos = 0, None
        ranking_expl = f"'{biz_name}' never appeared in a ranked position in any response."

    # --- FREQUENCY (20) ---
    total_count = sum(
        e.get("count", 0)
        for model in models
        if (e := _find_entity(entities.get(model, []), biz_name))
    )
    if total_count >= 8:
        frequency = 20
        freq_expl = f"Mentioned {total_count}× total — AI models cite you frequently. Strong signal."
    elif total_count >= 4:
        frequency = 14
        freq_expl = f"Mentioned {total_count}× total — moderate. Competitors with more mentions will rank above you."
    elif total_count >= 1:
        frequency = 6
        freq_expl = f"Only {total_count} mention(s) — dangerously low. AI models barely register your brand."
    else:
        frequency = 0
        freq_expl = "Zero mentions detected. AI models have no content signal to cite you from."

    # --- SENTIMENT (15) ---
    sentiments = [
        e["sentiment"]
        for model in models
        if (e := _find_entity(entities.get(model, []), biz_name))
    ]
    if not sentiments:
        sentiment_score, sent_expl = 0, "No sentiment — brand not mentioned."
    else:
        pos, neg = sentiments.count("positive"), sentiments.count("negative")
        if pos > neg and pos > 0:
            sentiment_score = 15
            sent_expl = f"Positive sentiment in {pos}/{len(sentiments)} models — AI presents you favourably."
        elif neg > pos:
            sentiment_score = 2
            sent_expl = f"Negative sentiment detected in {neg}/{len(sentiments)} models. Review your content quality."
        elif pos > 0 or neg > 0:
            sentiment_score, sent_expl = 5, "Mixed sentiment. You're mentioned but not praised."
        else:
            sentiment_score, sent_expl = 8, "Neutral sentiment — cited but without positive context."

    # --- AUTHORITY (10) ---
    authority = 5 if (presence > 0 or total_count > 0) else 0
    auth_expl = ("Base authority awarded — brand found in responses." if authority > 0
                 else "No authority points — brand absent from all responses.")

    score = presence + ranking + frequency + sentiment_score + authority

    if score >= 70:   visibility = "High"
    elif score >= 40: visibility = "Medium"
    elif score >= 10: visibility = "Low"
    else:             visibility = "Not Found"

    confidence = _confidence(len(models_found), total_count)

    # --- COMPETITORS (brands only) ---
    comp_counts = _brand_competitor_counts()
    competitors = sorted(comp_counts, key=lambda n: comp_counts[n], reverse=True)[:6]

    business_found = presence > 0 or total_count > 0

    why_lost_list = (
        _why_lost(biz_name, competitors, presence, ranking, total_count)
        if (not business_found or score < 60) else []
    )

    # --- LEADERBOARD ---
    leaderboard = _build_leaderboard(biz_name, entities, models)
    for entry in leaderboard:
        entry["description"] = _leaderboard_description(entry, entry["rank"], len(leaderboard))

    return {
        "score": score,
        "visibility": visibility,
        "confidence": confidence,
        "breakdown": {
            "presence":  {"score": presence,       "max": 30, "explanation": presence_expl},
            "ranking":   {"score": ranking,         "max": 25, "explanation": ranking_expl},
            "frequency": {"score": frequency,       "max": 20, "explanation": freq_expl},
            "sentiment": {"score": sentiment_score, "max": 15, "explanation": sent_expl},
            "authority": {"score": authority,       "max": 10, "explanation": auth_expl},
        },
        "competitors": competitors,
        "business_found": business_found,
        "why_lost": why_lost_list,
        "leaderboard": leaderboard,
        "category_dominance": _category_dominance(entities, query),
        "impact_simulation": _impact_simulation(score, business_found, query),
        "ai_thinking": _ai_thinking(query, competitors),
        "entity_strength_map": _entity_strength_map(biz_name, entities, responses) if biz_name else None,
    }

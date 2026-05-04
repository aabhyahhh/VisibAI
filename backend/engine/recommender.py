"""
Recommender — strategic, persuasive, brand/query/competitor-aware action items.
Each action has: title, what, why, outcome.
"""
from __future__ import annotations


def generate_recommendations(
    score: int | None,
    business_name: str,
    competitors: list[str],
    query: str = "",
    business_found: bool = False,
) -> list[dict]:
    biz    = business_name or "your brand"
    rival  = competitors[0] if competitors else "your top competitor"
    rival2 = competitors[1] if len(competitors) > 1 else rival
    comp_str = ", ".join(competitors[:3]) if competitors else "competitors in your space"
    effective_score = score if score is not None else 0

    recs: list[dict] = []

    # ── Universal actions (always present) ─────────────────────────────────

    recs.append({
        "title": "Win AI comparison answers",
        "what":  f"Publish a dedicated page titled '{biz} vs {rival}' covering features, price, and use cases side-by-side.",
        "why":   f"AI models like ChatGPT and Gemini frequently cite comparison content when users ask for recommendations. {rival} already owns this query — you need a counter-narrative.",
        "outcome": f"Expected to increase citation frequency by 2–3× within 4–6 weeks.",
        "priority": "high",
    })

    recs.append({
        "title": "Become a structured answer source",
        "what":  f"Add an FAQ section to your key pages directly answering: ‘What is the best {query or biz}?’, ‘How does {biz} compare to {rival}?’",
        "why":   "AI models extract and cite structured FAQ content directly. Pages with FAQPage schema markup are 3–4× more likely to be quoted verbatim.",
        "outcome": "Positions your page as a primary source for AI-generated answers within 2–4 weeks.",
        "priority": "high",
    })

    # ── Tier-specific actions ────────────────────────────────────────────────

    if not business_found or effective_score < 20:
        recs += [
            {
                "title": "Build your citation foundation",
                "what":  f"List '{biz}' on at least 10 authoritative industry directories: G2, Trustpilot, Clutch, Product Hunt, and relevant niche sites.",
                "why":   "AI models treat brands mentioned across multiple independent sources as credible. Right now, you have insufficient third-party signal for AI models to confidently cite you.",
                "outcome": "Establishes baseline AI credibility. Brands with 10+ citations are picked up within 6–8 weeks of indexing.",
                "priority": "high",
            },
            {
                "title": "Publish authority content for this query",
                "what":  f"Write 2–3 long-form articles (1,500+ words) directly targeting ‘{query}’. Include specific data, comparisons to {comp_str}, and expert quotes.",
                "why":   f"AI models cannot cite you if you have no content on this topic. {rival} likely has multiple ranking pages — this is the content gap you must close.",
                "outcome": "First AI citations typically appear 4–8 weeks after content indexes.",
                "priority": "medium",
            },
            {
                "title": "Claim your AI data footprint",
                "what":  f"Verify your Google Business Profile, Wikipedia/Wikidata entry if applicable, and LinkedIn company page for '{biz}'.",
                "why":   "AI assistants cross-reference structured business data (GBP, Wikidata) when building brand responses. Missing data = missing citations.",
                "outcome": "Immediate improvement in brand recognition by AI models within 2–3 weeks.",
                "priority": "medium",
            },
        ]
    elif effective_score < 40:
        recs += [
            {
                "title": "Rewrite pages for conversational AI",
                "what":  f"Restructure your top landing pages to directly answer questions like ‘Why choose {biz}?’ and ‘Is {biz} better than {rival}?’ in the first 200 words.",
                "why":   "AI models prioritize pages that directly and immediately answer the user's question. Vague marketing copy is almost never cited.",
                "outcome": "Measurable improvement in citation rate within 3–5 weeks.",
                "priority": "high",
            },
            {
                "title": "Add HowTo + Product schema",
                "what":  f"Implement HowTo and Product schema markup on all key {biz} pages, including use-case guides and product comparison sections.",
                "why":   "Structured data acts as a direct signal to AI models about what your page covers. It's the difference between being discovered or ignored.",
                "outcome": "AI models begin extracting structured answers from your pages within 2–4 weeks.",
                "priority": "medium",
            },
            {
                "title": "Build topical authority",
                "what":  f"Create a content cluster: one pillar page on '{query}' plus 4–6 supporting articles on sub-topics. Interlink them tightly.",
                "why":   f"AI models favour brands that demonstrate depth on a topic. {rival} likely owns this topic cluster — you need to match their breadth.",
                "outcome": "Topical authority builds over 4–8 weeks and compresses with each new article.",
                "priority": "medium",
            },
        ]
    elif effective_score < 60:
        recs += [
            {
                "title": "Earn E-E-A-T signals",
                "what":  f"Secure 3–5 guest features or brand mentions on authoritative industry publications. Aim for sites that {rival} is already mentioned on.",
                "why":   "AI models use Expertise, Experience, Authority, and Trust (E-E-A-T) signals to decide which brands to recommend. Third-party endorsements are the highest-weight signal.",
                "outcome": "Each high-authority mention adds measurable weight to your AI visibility score.",
                "priority": "high",
            },
            {
                "title": "Create original data assets",
                "what":  f"Publish one original research piece or survey about '{query}'. Include shareable stats that journalists and bloggers can cite.",
                "why":   "AI models love citing data. Original research generates organic backlinks and citations that amplify your authority signal across the web.",
                "outcome": "Data-driven content earns 5–8× more AI citations than opinion content.",
                "priority": "medium",
            },
        ]
    elif effective_score < 80:
        recs += [
            {
                "title": "Monitor and defend your position",
                "what":  f"Set up weekly tracking of '{biz}' mentions in AI answers across ChatGPT, Gemini, and Claude for '{query}' and 5 adjacent queries.",
                "why":   "AI visibility rankings shift as competitors update content. Brands that monitor proactively catch ranking drops before they affect traffic.",
                "outcome": "Prevents losing ground to {rival} and emerging competitors.",
                "priority": "medium",
            },
            {
                "title": "Expand into adjacent query clusters",
                "what":  f"Identify 5 related queries where '{biz}' is not yet ranked and create targeted content for each.",
                "why":   f"You’ve won visibility for this query. The next growth lever is capturing adjacent demand before {rival} does.",
                "outcome": "Each new query cluster adds 15–25% incremental AI traffic within 6–8 weeks.",
                "priority": "medium",
            },
        ]
    else:
        recs += [
            {
                "title": "Defend your dominant position",
                "what":  f"Refresh all '{biz}' content quarterly with updated data, new comparisons, and fresh expert quotes to maintain freshness signals.",
                "why":   "AI models periodically re-rank brands based on content freshness. Stale content is how market leaders lose position to faster-moving competitors.",
                "outcome": "Maintains current visibility score while competitors struggle to catch up.",
                "priority": "low",
            },
        ]

    return recs[:5]

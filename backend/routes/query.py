from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from engine.orchestrator import run_query_across_models
from engine.parser import extract_entities
from engine.scorer import calculate_aeo_score
from engine.recommender import generate_recommendations

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    business_name: str = ""


@router.post("/api/query")
async def run_query(body: QueryRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        responses = await run_query_across_models(body.query, body.business_name)

        entities: dict = {}
        for model, text in responses.items():
            entities[model] = extract_entities(text, body.business_name)

        score_data = calculate_aeo_score(
            body.business_name, responses, entities, query=body.query
        )

        recommendations = generate_recommendations(
            score=score_data["score"],
            business_name=body.business_name,
            competitors=score_data["competitors"],
            query=body.query,
            business_found=score_data["business_found"],
        )

        return {
            "query":          body.query,
            "business_name":  body.business_name,
            "responses":      responses,
            "entities":       entities,
            "score":          score_data["score"],
            "visibility":     score_data["visibility"],
            "confidence":     score_data["confidence"],
            "breakdown":      score_data["breakdown"],
            "competitors":    score_data["competitors"],
            "business_found": score_data["business_found"],
            "why_lost":       score_data["why_lost"],
            "leaderboard":         score_data["leaderboard"],
            "category_dominance":  score_data["category_dominance"],
            "impact_simulation":   score_data["impact_simulation"],
            "ai_thinking":         score_data["ai_thinking"],
            "entity_strength_map": score_data["entity_strength_map"],
            "recommendations":     recommendations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

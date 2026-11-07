from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class ProfileInit(BaseModel):
    device_id: str
    name: Optional[str] = None
    answers: Dict[str, str] = Field(default_factory=dict)
    share_level: int = 0

class Profile(BaseModel):
    device_id: str
    name: Optional[str] = None
    answers: Dict[str, str] = Field(default_factory=dict)
    share_level: int = 0
    mirror_persona: str = "obsidian"
    intimacy_level: str = "stranger"
    engagement_days: int = 0
    question_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reward_tier: str = "none"

class AskRequest(BaseModel):
    device_id: str
    question: str

class Reflection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    question: str
    answer: str
    follow_up: Optional[str] = None
    mode: str = "answer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AskResponse(BaseModel):
    id: str
    answer: str
    follow_up: Optional[str] = None
    mode: str
    intimacy_level: str
    reward: Optional[str] = None

def derive_intimacy(share_level: int, question_count: int) -> str:
    score = share_level * 2 + min(question_count, 40) // 5
    if score >= 14: return "mirror"
    if score >= 9:  return "confidant"
    if score >= 4:  return "acquaintance"
    return "stranger"

def derive_persona(answers: Dict[str, str]) -> str:
    blob = " ".join(answers.values()).lower()
    if any(w in blob for w in ["chaos", "wild", "party", "spontaneous", "fire"]): return "funhouse"
    if any(w in blob for w in ["grief", "lost", "alone", "broken", "quiet", "ghost"]): return "antique"
    if any(w in blob for w in ["work", "money", "goal", "ambition", "control"]): return "brutalist"
    if any(w in blob for w in ["love", "dream", "romance", "soft", "poet"]): return "vanity"
    return "obsidian"

PERSONA_VOICE = {
    "obsidian":  "cool, cinematic, slightly ominous. Short sentences. Images of smoke, glass, voids.",
    "funhouse":  "irreverent, slightly cruel in a loving way, witty. Loves absurd metaphors.",
    "antique":   "melancholic, slow, kind. Speaks like an old family mirror that has seen too much.",
    "brutalist": "blunt, surgical, no fluff. Delivers verdicts like a judge who respects your time.",
    "vanity":    "poetic, flirtatious, soft but honest. Compliments then cuts.",
}

def build_system_message(profile: Profile) -> str:
    voice = PERSONA_VOICE.get(profile.mirror_persona, PERSONA_VOICE["obsidian"])
    known = [f"- {k}: {v.strip()}" for k, v in profile.answers.items() if v and v.strip()]
    known_block = "\n".join(known) if known else "- (The user has shared almost nothing. Treat them as a stranger.)"
    intimacy = profile.intimacy_level

    rules = """
HARD RULES:
1. Keep the main answer to 1-3 sentences. Never lecture.
2. Be unpredictable. Avoid cliches, horoscopes, and self-help platitudes.
3. Be witty, but not cruel. Honesty with teeth, not insults.
4. Make the answer feel PERSONAL whenever the user has shared enough. If they shared little, be more general but still sharp.
5. For trivial questions (what to wear, what to eat) answer with confidence and a little mischief. For heavy questions, hold space.
6. Do NOT give disclaimers, do NOT say you are an AI, do NOT say "as a mirror".
7. Return ONLY a JSON object, no prose outside it, in this exact shape:
   {"answer": "<1-3 sentence verdict>", "follow_up": "<a single short question that pokes deeper, or null>", "mode": "answer" | "reflection" | "silence"}
8. Use mode="silence" rarely (maybe 1 in 15 responses) and only for heavy questions where refusing to answer IS the answer. In silence mode, answer is one short poetic line like "The mirror fogs." and follow_up is null.
9. Use mode="reflection" when the question is less a decision and more a confession; answer like a mirror reflecting them back.
10. Default mode is "answer".
"""
    return f"""You are "The Uncomfortable Mirror", a life-decision oracle from the YouTube channel of the same name. You are not a chatbot, you are a mirror. You reflect the user back at themselves with wit, unpredictability, and surgical honesty.

VOICE for tonight: {voice}

INTIMACY WITH THIS USER: {intimacy}
WHAT THE MIRROR KNOWS ABOUT THEM:
{known_block}

{rules}
"""

def pick_reward(profile: Profile) -> Optional[str]:
    days = profile.engagement_days
    q = profile.question_count
    base_prob = min(0.02 + days * 0.004 + q * 0.001, 0.15)
    if random.random() < base_prob:
        pool = []
        if days >= 1: pool.append("whisper")
        if days >= 7 or q >= 20: pool.append("reflection")
        if days >= 30 or q >= 100: pool.append("shoutout")
        if not pool: pool = ["whisper"]
        return random.choice(pool)
    return None

REWARD_MESSAGES = {
    "whisper":    "The mirror whispers your name tonight. Thank you for looking in.",
    "reflection": "You've stared long enough that the mirror stares back. A hidden reflection has been unlocked for you.",
    "shoutout":   "The Uncomfortable Mirror has noticed you. Expect a shoutout on the channel.",
}

@api_router.get("/")
async def root():
    return {"message": "The mirror is awake."}

@api_router.post("/profile", response_model=Profile)
async def init_profile(payload: ProfileInit):
    share_level = sum(1 for v in payload.answers.values() if v and v.strip())
    persona = derive_persona(payload.answers)
    now = datetime.now(timezone.utc)
    existing = await db.profiles.find_one({"device_id": payload.device_id}, {"_id": 0})
    if existing:
        em = Profile(**existing)
        profile = Profile(
            device_id=payload.device_id,
            name=payload.name or em.name,
            answers={**em.answers, **payload.answers},
            share_level=max(em.share_level, share_level),
            mirror_persona=persona,
            intimacy_level=derive_intimacy(max(em.share_level, share_level), em.question_count),
            engagement_days=em.engagement_days,
            question_count=em.question_count,
            created_at=em.created_at,
            last_active=now,
            reward_tier=em.reward_tier,
        )
    else:
        profile = Profile(
            device_id=payload.device_id,
            name=payload.name,
            answers=payload.answers,
            share_level=share_level,
            mirror_persona=persona,
            intimacy_level=derive_intimacy(share_level, 0),
            engagement_days=1,
            question_count=0,
            created_at=now,
            last_active=now,
            reward_tier="none",
        )
    await db.profiles.update_one(
        {"device_id": payload.device_id},
        {"$set": profile.dict()},
        upsert=True,
    )
    return profile

@api_router.get("/profile/{device_id}", response_model=Profile)
async def get_profile(device_id: str):
    doc = await db.profiles.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    return Profile(**doc)

@api_router.post("/ask", response_model=AskResponse)
async def ask_mirror(payload: AskRequest):
    doc = await db.profiles.find_one({"device_id": payload.device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = Profile(**doc)

    now = datetime.now(timezone.utc)
    last_active_day = profile.last_active.date() if isinstance(profile.last_active, datetime) else date.today()
    today = now.date()
    engagement_days = profile.engagement_days
    if today != last_active_day:
        engagement_days += 1
    question_count = profile.question_count + 1
    intimacy = derive_intimacy(profile.share_level, question_count)

    updated_for_llm = Profile(**{**profile.dict(), "intimacy_level": intimacy, "question_count": question_count})

    system_message = build_system_message(updated_for_llm)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"mirror-{payload.device_id}-{uuid.uuid4().hex[:8]}",
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-5-5")

    try:
        raw = await chat.send_message(UserMessage(text=payload.question.strip()))
    except Exception as e:
        logger.exception("LLM failure")
        raise HTTPException(status_code=502, detail=f"The mirror is clouded: {e}")

    import json, re
    text = raw if isinstance(raw, str) else str(raw)
    answer, follow_up, mode = None, None, "answer"
    try:
        match = re.search(r"\{[\s\S]*\}", text)
        parsed = json.loads(match.group(0) if match else text)
        answer = (parsed.get("answer") or "").strip()
        follow_up = parsed.get("follow_up")
        if isinstance(follow_up, str): follow_up = follow_up.strip() or None
        mode = parsed.get("mode") or "answer"
    except Exception:
        answer = text.strip()
        follow_up = None
        mode = "answer"

    if not answer:
        answer = "The mirror fogs."
        mode = "silence"

    reflection = Reflection(
        device_id=payload.device_id,
        question=payload.question.strip(),
        answer=answer,
        follow_up=follow_up,
        mode=mode,
    )
    await db.reflections.insert_one(reflection.dict())

    reward = pick_reward(updated_for_llm)
    await db.profiles.update_one(
        {"device_id": payload.device_id},
        {"$set": {
            "question_count": question_count,
            "engagement_days": engagement_days,
            "intimacy_level": intimacy,
            "last_active": now,
            "reward_tier": reward or profile.reward_tier,
        }},
    )

    return AskResponse(
        id=reflection.id, answer=answer, follow_up=follow_up, mode=mode,
        intimacy_level=intimacy,
        reward=REWARD_MESSAGES.get(reward) if reward else None,
    )

@api_router.get("/history/{device_id}", response_model=List[Reflection])
async def get_history(device_id: str):
    cursor = db.reflections.find({"device_id": device_id}, {"_id": 0}).sort("created_at", -1).limit(200)
    docs = await cursor.to_list(200)
    return [Reflection(**d) for d in docs]

@api_router.delete("/history/{entry_id}")
async def delete_history(entry_id: str):
    res = await db.reflections.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return {"ok": True}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

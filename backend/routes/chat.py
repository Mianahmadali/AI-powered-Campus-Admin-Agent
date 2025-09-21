from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse

from agent import run_chat, stream_chat_tokens

router = APIRouter()


@router.post("")
async def chat(payload: Dict[str, Any]) -> Dict[str, Any]:
    session_id = payload.get("session_id")
    message = payload.get("message")
    if not session_id or not message:
        raise HTTPException(status_code=400, detail="session_id and message are required")

    reply = await run_chat(session_id=session_id, user_message=message)
    return {"session_id": session_id, "reply": reply}


@router.post("/stream")
async def chat_stream_post(payload: Dict[str, Any]):
    session_id = payload.get("session_id")
    message = payload.get("message")
    if not session_id or not message:
        raise HTTPException(status_code=400, detail="session_id and message are required")

    async def event_gen():
        async for chunk in stream_chat_tokens(session_id=session_id, user_message=message):
            yield chunk

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@router.get("/stream")
async def chat_stream_get(session_id: str = Query(...), message: str = Query(...)):
    async def event_gen():
        async for chunk in stream_chat_tokens(session_id=session_id, user_message=message):
            yield chunk

    return StreamingResponse(event_gen(), media_type="text/event-stream")

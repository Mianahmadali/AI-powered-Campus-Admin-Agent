from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import OpenAI

from db import get_db
from tools import TOOL_SCHEMAS
import tools as tool_impl

logger = logging.getLogger("campus_admin.agent")

AGENT_MODEL = os.getenv("AGENT_MODEL", "gpt-4o-mini")
SYSTEM_PROMPT = (
    "You are Campus Admin Agent, an AI assistant for campus administration. "
    "You can manage student records, provide analytics, answer FAQs, and send notifications. "
    "Use the available tools to fetch or update data rather than guessing. "
    "Be concise and include relevant details in your final answer."
)

_client: Optional[OpenAI] = None

def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        try:
            # Check if we're using OpenRouter (detect by API key format)
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key and api_key.startswith("sk-or-"):
                # OpenRouter configuration
                _client = OpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1",
                )
                logger.info("Initialized OpenAI client for OpenRouter")
            else:
                # Standard OpenAI configuration
                _client = OpenAI()
                logger.info("Initialized OpenAI client for OpenAI")
        except Exception as e:
            logger.exception("Failed to initialize OpenAI client: %s", e)
            raise
    return _client


# -----------------------------
# Conversation Memory (MongoDB)
# -----------------------------
async def _ensure_conversation(db: AsyncIOMotorDatabase, session_id: str) -> Dict[str, Any]:
    conv = await db.conversations.find_one({"session_id": session_id})
    if conv:
        return conv
    doc = {
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "messages": [],  # list of {role, content}
    }
    await db.conversations.insert_one(doc)
    return doc


async def _append_message(db: AsyncIOMotorDatabase, session_id: str, role: str, content: Any) -> None:
    await db.conversations.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": {"role": role, "content": content}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )


async def _get_messages(db: AsyncIOMotorDatabase, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    conv = await _ensure_conversation(db, session_id)
    messages: List[Dict[str, Any]] = conv.get("messages", [])[-limit:]
    return messages


# -----------------------------
# Tool Invocation
# -----------------------------
async def _call_tool(db: AsyncIOMotorDatabase, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if name == "add_student":
            return await tool_impl.add_student(db, arguments)
        if name == "get_student":
            return await tool_impl.get_student(db, arguments["student_id"])
        if name == "update_student_tool":
            return await tool_impl.update_student_tool(db, arguments["student_id"], arguments.get("updates", {}))
        if name == "delete_student_tool":
            return await tool_impl.delete_student_tool(db, arguments["student_id"])
        if name == "list_students_tool":
            return await tool_impl.list_students_tool(db, arguments.get("department"), arguments.get("status"), arguments.get("limit", 20))
        if name == "get_total_students":
            return await tool_impl.get_total_students(db)
        if name == "get_students_by_department":
            return await tool_impl.get_students_by_department(db)
        if name == "get_recent_onboarded_students":
            return await tool_impl.get_recent_onboarded_students(db, arguments.get("limit", 5))
        if name == "get_active_students_last_7_days":
            return await tool_impl.get_active_students_last_7_days(db)
        if name == "get_cafeteria_timings":
            return await tool_impl.get_cafeteria_timings()
        if name == "get_library_hours":
            return await tool_impl.get_library_hours()
        if name == "get_event_schedule":
            return await tool_impl.get_event_schedule()
        if name == "send_email":
            return await tool_impl.send_email(arguments["student_id"], arguments["message"])
    except Exception as e:
        logger.exception("Tool '%s' failed: %s", name, e)
        return {"ok": False, "error": f"Tool {name} failed: {e}"}
    return {"ok": False, "error": f"Unknown tool: {name}"}


# -----------------------------
# Agent core
# -----------------------------
async def run_chat(session_id: str, user_message: str) -> str:
    db = get_db()
    await _ensure_conversation(db, session_id)
    await _append_message(db, session_id, "user", user_message)

    prior = await _get_messages(db, session_id)

    # Build OpenAI messages
    oai_messages: List[Dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    oai_messages.extend(prior)

    client = get_openai_client()

    # Loop for tool calls
    for _ in range(4):  # up to 4 rounds of tool use
        try:
            completion = client.chat.completions.create(
                model=AGENT_MODEL,
                messages=oai_messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=1000,  # Limit tokens to reduce costs
            )
        except Exception as e:
            logger.error("OpenAI API error: %s", e)
            error_msg = "I apologize, but I'm currently experiencing technical difficulties. Please try again later."
            await _append_message(db, session_id, "assistant", error_msg)
            return error_msg
        msg = completion.choices[0].message

        # If tool calls
        if msg.tool_calls:
            oai_messages.append({"role": msg.role, "content": msg.content or "", "tool_calls": [tc.model_dump() for tc in msg.tool_calls]})
            for tc in msg.tool_calls:
                name = tc.function.name
                args = json.loads(tc.function.arguments or "{}")
                result = await _call_tool(db, name, args)
                # Provide tool result back to the model
                oai_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, ensure_ascii=False, default=str),
                    }
                )
            # Continue loop to let model use results
            continue
        else:
            content = msg.content or ""
            await _append_message(db, session_id, "assistant", content)
            return content

    # Fallback if tool loop exceeded
    fallback = "I'm sorry, I couldn't complete the request right now. Please try again."
    await _append_message(db, session_id, "assistant", fallback)
    return fallback


async def stream_chat_tokens(session_id: str, user_message: str):
    """Generator that yields SSE-formatted events for the assistant's reply tokens.
    Strategy: execute any needed tool calls first (non-stream), then request a streamed final message.
    """
    db = get_db()
    await _ensure_conversation(db, session_id)
    await _append_message(db, session_id, "user", user_message)
    prior = await _get_messages(db, session_id)

    client = get_openai_client()

    # First, resolve tool calls using a non-streaming pass
    oai_messages: List[Dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    oai_messages.extend(prior)

    for _ in range(4):
        try:
            completion = client.chat.completions.create(
                model=AGENT_MODEL,
                messages=oai_messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=1000,  # Limit tokens to reduce costs
            )
        except Exception as e:
            logger.error("OpenAI API error in streaming: %s", e)
            error_msg = "I apologize, but I'm currently experiencing technical difficulties. Please try again later."
            await _append_message(db, session_id, "assistant", error_msg)
            yield f"data: {{\"type\": \"error\", \"message\": {json.dumps(error_msg)}}}\n\n"
            return
        msg = completion.choices[0].message
        if msg.tool_calls:
            oai_messages.append({"role": msg.role, "content": msg.content or "", "tool_calls": [tc.model_dump() for tc in msg.tool_calls]})
            for tc in msg.tool_calls:
                name = tc.function.name
                args = json.loads(tc.function.arguments or "{}")
                result = await _call_tool(db, name, args)
                oai_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, ensure_ascii=False, default=str),
                    }
                )
            continue
        else:
            # No tool calls needed; fall through to streaming directly
            break

    # Now stream the final answer using the built context
    yield "data: {\"type\": \"message_start\"}\n\n"

    try:
        stream = client.chat.completions.create(
            model=AGENT_MODEL,
            messages=oai_messages,
            temperature=0.2,
            stream=True,
            max_tokens=500,  # Limit tokens for streaming response
        )
    except Exception as e:
        logger.error("OpenAI API error in final streaming: %s", e)
        error_msg = "I apologize, but I'm currently experiencing technical difficulties. Please try again later."
        await _append_message(db, session_id, "assistant", error_msg)
        yield f"data: {{\"type\": \"error\", \"message\": {json.dumps(error_msg)}}}\n\n"
        return
    full_text = []
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            full_text.append(delta.content)
            yield f"data: {{\"type\": \"token\", \"value\": {json.dumps(delta.content)} }}\n\n"

    final_text = "".join(full_text)
    await _append_message(db, session_id, "assistant", final_text)
    yield "data: {\"type\": \"message_end\"}\n\n"

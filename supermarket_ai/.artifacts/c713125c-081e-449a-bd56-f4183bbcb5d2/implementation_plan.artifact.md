# Implementation Plan - Fix AI Agent and OpenRouter Integration

The user is experiencing issues with their AI agent not responding correctly. The project uses OpenRouter with the `openai` Python library, but the current implementation in `ai.py` uses an outdated syntax (v0.28 style) with a newer library version (v1.57.0), leading to failures. Additionally, the response parsing is incorrect for the modern OpenAI client.

## User Review Required

> [!IMPORTANT]
> I will be updating the AI integration to use the modern `OpenAI` client class. This requires ensuring the `.env` variables `OPENAI_API_KEY` and `OPENAI_API_BASE` are correctly set. Based on the `.env` file, they seem to be configured for OpenRouter.

## Proposed Changes

### AI Component

#### [MODIFY] [ai.py](file:///C:/Users/acer/Pictures/supermarket_ai/ai.py)
- Update `openai` library usage to v1.0.0+ syntax.
- Initialize an `OpenAI` client with `api_key` and `base_url`.
- Refactor `call_openai` to use `client.chat.completions.create`.
- Fix `extract_response_text` to correctly parse the `Choice` object from the OpenAI response.
- Update the system prompt to better handle general questions like ChatGPT, as requested by the user.
- Remove redundant language detection/scope restriction if it's not being used or hindering the "ChatGPT-like" behavior.

### Database Component (Cleanup)

#### [MODIFY] [database.py](file:///C:/Users/acer/Pictures/supermarket_ai/database.py)
- Remove the redundant and unused `get_ai_answer` function to avoid confusion, as `ai.py` provides the main implementation.

## Verification Plan

### Automated Tests
- I will create a small test script `test_ai_fix.py` to verify that `get_ai_answer` correctly falls back to the LLM for general questions and uses the rule-based system for supermarket-specific questions.
- I will mock the OpenAI client to test the parsing logic without making actual API calls if necessary, but since I have the environment, I can try a real call if the user's key is valid.

### Manual Verification
- Test with a supermarket-specific question (e.g., "How many products?").
- Test with a general question (e.g., "Hi, how are you?") to ensure it replies like ChatGPT.
- Test with a Tanglish question to ensure language handling is working.

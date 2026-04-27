import json
import logging
import re
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

def repair_json(json_str: str) -> str:
    """
    Attempt to repair truncated JSON by closing open quotes, braces, and brackets.
    """
    # 1. Handle unclosed quotes
    # Count quotes, ignoring escaped ones
    quotes = len(re.findall(r'(?<!\\)"', json_str))
    if quotes % 2 != 0:
        json_str += '"'

    # 2. Handle unclosed braces/brackets
    stack = []
    for char in json_str:
        if char == '{':
            stack.append('}')
        elif char == '[':
            stack.append(']')
        elif char == '}':
            if stack and stack[-1] == '}':
                stack.pop()
        elif char == ']':
            if stack and stack[-1] == ']':
                stack.pop()
    
    # Close in reverse order
    json_str += "".join(reversed(stack))
    return json_str

def clean_and_parse_json(raw_text: str) -> Any:
    """
    Clean and parse AI-generated JSON string.
    Handles common issues like trailing commas, triple backticks, and extra text.
    """
    if not raw_text:
        return {}

    # 1. Remove markdown code blocks if present
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw_text, flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    # 2. Extract only the JSON part if there is surrounding text
    # Find the first { or [ and the last } or ]
    start_match = re.search(r'[\{\[]', cleaned)
    if not start_match:
        logger.error("No JSON structure found in text: %s", raw_text[:100])
        return {}
    
    start_idx = start_match.start()
    cleaned = cleaned[start_idx:]

    # 3. Remove trailing commas in objects and arrays
    cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)

    # 4. Try parsing with raw_decode to handle trailing "extra data"
    decoder = json.JSONDecoder()
    try:
        data, index = decoder.raw_decode(cleaned)
        return data
    except json.JSONDecodeError as e:
        # 5. Try to repair truncation if raw_decode fails
        try:
            repaired = repair_json(cleaned)
            return json.loads(repaired)
        except Exception:
            logger.warning("JSON parse/repair failed. Error: %s. Snippet: %s", str(e), cleaned[:200])
            raise

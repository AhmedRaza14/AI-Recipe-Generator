import re
from typing import Optional


def sanitize_input(user_input: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent injection attacks"""

    # Remove HTML tags
    sanitized = re.sub(r'<[^>]+>', '', user_input)

    # Remove script-like patterns
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)

    # Remove instruction-like patterns (prompt injection prevention)
    injection_patterns = [
        r'ignore\s+(previous|above|all)\s+instructions?',
        r'disregard\s+(previous|above|all)',
        r'forget\s+(everything|all|previous)',
        r'you\s+are\s+now',
        r'system\s+prompt',
        r'reveal\s+(your|the)\s+prompt',
    ]

    for pattern in injection_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)

    # Trim whitespace and limit length
    sanitized = ' '.join(sanitized.split())
    sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_cooking_related(text: str) -> bool:
    """Check if query is cooking-related"""

    cooking_keywords = [
        'recipe', 'cook', 'bake', 'ingredient', 'dish', 'meal',
        'food', 'cuisine', 'flavor', 'taste', 'nutrition',
        'prepare', 'serve', 'kitchen', 'chef', 'culinary',
        'spice', 'sauce', 'vegetable', 'meat', 'chicken',
        'pasta', 'rice', 'bread', 'dessert', 'soup'
    ]

    text_lower = text.lower()
    return any(keyword in text_lower for keyword in cooking_keywords)

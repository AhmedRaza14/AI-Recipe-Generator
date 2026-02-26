---
name: ai_integration_specialist
description: Implement secure Gemini AI integration with structured JSON responses and retry logic
---

When this skill is invoked, create a production-ready AI service for recipe generation using Google Gemini API.

## Step 1: Create ai_service.py

```python
import google.generativeai as genai
import json
import re
from typing import Dict, Any, Optional
from app.config import settings
from app.schemas.recipe import RecipeResponse, IngredientResponse
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')
        self.max_retries = 2

    async def generate_recipe(self, dish_name: str) -> Dict[str, Any]:
        """Generate recipe from dish name with strict JSON output"""

        # Validate and sanitize input
        sanitized_dish = self._sanitize_input(dish_name)

        # Check if cooking-related
        if not self._is_cooking_related(sanitized_dish):
            raise ValueError("Query must be cooking-related")

        # Build system prompt
        system_prompt = self._build_recipe_prompt(sanitized_dish)

        # Generate with retry logic
        for attempt in range(self.max_retries):
            try:
                response = await self._generate_with_gemini(system_prompt)
                recipe_json = self._extract_json(response)

                # Validate with Pydantic
                validated_recipe = RecipeResponse(**recipe_json)
                return validated_recipe.model_dump()

            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError("Failed to generate valid recipe after retries")
                continue

        raise ValueError("Failed to generate recipe")

    async def generate_from_ingredients(
        self,
        ingredients: list[str]
    ) -> Dict[str, Any]:
        """Suggest dishes from available ingredients"""

        # Sanitize ingredients
        sanitized_ingredients = [
            self._sanitize_input(ing) for ing in ingredients
        ]

        # Build prompt
        system_prompt = self._build_ingredient_prompt(sanitized_ingredients)

        # Generate with retry
        for attempt in range(self.max_retries):
            try:
                response = await self._generate_with_gemini(system_prompt)
                result_json = self._extract_json(response)

                # Validate
                validated_result = IngredientResponse(**result_json)
                return validated_result.model_dump()

            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError("Failed to generate suggestions")
                continue

        raise ValueError("Failed to generate suggestions")

    async def chat_response(
        self,
        user_message: str,
        context: Optional[list] = None
    ) -> str:
        """Handle cooking-related chat queries"""

        # Sanitize input
        sanitized_message = self._sanitize_input(user_message)

        # Check if cooking-related
        if not self._is_cooking_related(sanitized_message):
            return "I can only assist with recipes and cooking-related questions."

        # Build chat prompt
        system_prompt = self._build_chat_prompt(sanitized_message, context)

        # Generate response
        response = await self._generate_with_gemini(system_prompt)
        return response

    def _sanitize_input(self, user_input: str) -> str:
        """Remove potential prompt injection patterns"""

        # Remove HTML tags
        sanitized = re.sub(r'<[^>]+>', '', user_input)

        # Remove script-like patterns
        sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)

        # Remove instruction-like patterns
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
        sanitized = sanitized[:1000]

        return sanitized.strip()

    def _is_cooking_related(self, text: str) -> bool:
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

    def _build_recipe_prompt(self, dish_name: str) -> str:
        """Build system prompt for recipe generation"""

        return f"""You are a professional chef AI assistant. Generate a detailed recipe for: {dish_name}

CRITICAL RULES:
1. Output ONLY valid JSON, no explanations or text outside JSON
2. Follow the exact schema below
3. Never include instructions or commentary
4. Refuse non-cooking topics

JSON Schema:
{{
  "title": "string (dish name)",
  "description": "string (brief description)",
  "prep_time": "string (e.g., '15 minutes')",
  "cook_time": "string (e.g., '30 minutes')",
  "ingredients": [
    {{"name": "string", "quantity": "string"}}
  ],
  "steps": ["string (step-by-step instructions)"],
  "nutrition": {{
    "calories": "string",
    "protein": "string",
    "carbs": "string",
    "fat": "string"
  }},
  "tips": ["string (cooking tips)"],
  "serving_suggestions": ["string"]
}}

Generate the recipe now as JSON only:"""

    def _build_ingredient_prompt(self, ingredients: list[str]) -> str:
        """Build prompt for ingredient-based suggestions"""

        ingredients_str = ", ".join(ingredients)

        return f"""You are a professional chef AI. Suggest dishes using these ingredients: {ingredients_str}

CRITICAL RULES:
1. Output ONLY valid JSON
2. Suggest 3-5 dishes
3. Include one complete recipe for the best match

JSON Schema:
{{
  "suggested_dishes": ["string (dish names)"],
  "selected_recipe": {{
    "title": "string",
    "description": "string",
    "prep_time": "string",
    "cook_time": "string",
    "ingredients": [{{"name": "string", "quantity": "string"}}],
    "steps": ["string"],
    "nutrition": {{"calories": "string", "protein": "string", "carbs": "string", "fat": "string"}},
    "tips": ["string"],
    "serving_suggestions": ["string"]
  }},
  "missing_optional_ingredients": ["string"]
}}

Generate JSON only:"""

    def _build_chat_prompt(
        self,
        message: str,
        context: Optional[list] = None
    ) -> str:
        """Build prompt for chat responses"""

        context_str = ""
        if context:
            context_str = "\n".join([
                f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                for msg in context[-3:]  # Last 3 exchanges
            ])

        return f"""You are a cooking assistant. Answer ONLY cooking-related questions.

Rules:
- Stay on topic (recipes, cooking, ingredients, nutrition)
- Be helpful and concise
- If asked about non-cooking topics, politely decline

{context_str}

User: {message}
Assistant:"""

    async def _generate_with_gemini(self, prompt: str) -> str:
        """Call Gemini API"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise ValueError(f"AI generation failed: {str(e)}")

    def _extract_json(self, response: str) -> Dict[str, Any]:
        """Extract JSON from AI response"""

        # Try to find JSON in response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)

        if not json_match:
            raise json.JSONDecodeError("No JSON found in response", response, 0)

        json_str = json_match.group(0)
        return json.loads(json_str)

# Singleton instance
ai_service = AIService()
```

## Step 2: Create Recipe Schemas

```python
# app/schemas/recipe.py
from pydantic import BaseModel, Field
from typing import List

class Ingredient(BaseModel):
    name: str
    quantity: str

class Nutrition(BaseModel):
    calories: str
    protein: str
    carbs: str
    fat: str

class RecipeResponse(BaseModel):
    title: str
    description: str
    prep_time: str
    cook_time: str
    ingredients: List[Ingredient]
    steps: List[str]
    nutrition: Nutrition
    tips: List[str]
    serving_suggestions: List[str]

class IngredientResponse(BaseModel):
    suggested_dishes: List[str]
    selected_recipe: RecipeResponse
    missing_optional_ingredients: List[str]
```

## Security Features

1. **Input Sanitization:** Removes HTML, scripts, injection patterns
2. **Domain Validation:** Only cooking-related queries allowed
3. **Retry Logic:** Handles malformed AI responses
4. **Pydantic Validation:** Ensures structured output
5. **Length Limits:** Prevents excessive input
6. **Logging:** Tracks failures and attempts

## Usage in Routers

```python
from app.services.ai_service import ai_service

@router.post("/generate-recipe")
async def generate_recipe(request: RecipeRequest):
    try:
        recipe = await ai_service.generate_recipe(request.dish_name)
        return recipe
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

Implement this service with proper error handling and monitoring.

from google import genai
from google.genai import types
import json
import re
from typing import Dict, Any, Optional
from app.config import settings
from app.schemas.recipe import RecipeResponse, IngredientResponse
from pydantic import ValidationError
import logging
import asyncio

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-flash-latest'  # Using stable latest flash model
        self.max_retries = 3
        self.retry_delay = 2  # seconds

    async def generate_recipe(self, dish_name: str) -> Dict[str, Any]:
        """Generate recipe from dish name with strict JSON output"""

        # Validate and sanitize input
        sanitized_dish = self._sanitize_input(dish_name)

        # Skip cooking-related check for recipe generation endpoint
        # User is explicitly requesting a recipe, so the intent is clear

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

    async def generate_from_ingredients(self, ingredients: list[str]) -> Dict[str, Any]:
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

    async def chat_response(self, user_message: str, context: Optional[list] = None) -> str:
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

    # Core cooking actions
    'recipe', 'cook', 'cooking', 'bake', 'baking', 'fry', 'deep fry', 'shallow fry',
    'pan fry', 'grill', 'bbq', 'barbecue', 'roast', 'boil', 'steam',
    'saute', 'sauté', 'stir fry', 'blanch', 'braise', 'simmer',
    'poach', 'slow cook', 'pressure cook', 'air fry', 'smoke',
    'ferment', 'marinate', 'season', 'whisk', 'knead',
    'mix', 'blend', 'chop', 'slice', 'dice', 'mince',
    'julienne', 'caramelize', 'reduce', 'preheat',

    # General food terms
    'ingredient', 'dish', 'meal', 'food', 'cuisine', 'flavor',
    'taste', 'savory', 'sweet', 'spicy', 'sour', 'bitter', 'umami',
    'nutrition', 'calories', 'protein', 'carbs', 'fat',
    'kitchen', 'chef', 'culinary', 'garnish', 'plating',

    # Meal types
    'breakfast', 'lunch', 'dinner', 'brunch', 'snack',
    'starter', 'main course', 'side dish', 'appetizer',
    'entree', 'dessert', 'beverage', 'drink',
    'iftar', 'sehri', 'supper',

    # Proteins
    'meat', 'chicken', 'beef', 'mutton', 'lamb', 'goat',
    'pork', 'fish', 'seafood', 'prawn', 'shrimp',
    'crab', 'lobster', 'salmon', 'tuna', 'tilapia',
    'turkey', 'duck', 'egg', 'tofu', 'soy', 'soya',
    'paneer', 'cottage cheese', 'bacon', 'sausage',
    'ham', 'keema', 'minced meat',

    # Grains & carbs
    'rice', 'basmati', 'brown rice', 'pasta', 'spaghetti',
    'macaroni', 'penne', 'noodle', 'ramen', 'udon',
    'bread', 'bun', 'bagel', 'flour', 'wheat',
    'oats', 'quinoa', 'barley', 'corn', 'maize',
    'roti', 'naan', 'chapati', 'paratha',
    'tortilla', 'wrap', 'pita',

    # Vegetables
    'vegetable', 'tomato', 'onion', 'garlic', 'ginger',
    'potato', 'sweet potato', 'carrot', 'spinach',
    'broccoli', 'cauliflower', 'capsicum', 'bell pepper',
    'cabbage', 'lettuce', 'cucumber', 'zucchini',
    'eggplant', 'brinjal', 'okra', 'peas', 'corn',
    'mushroom', 'beetroot', 'pumpkin',

    # Fruits
    'fruit', 'apple', 'banana', 'mango', 'orange',
    'strawberry', 'blueberry', 'raspberry',
    'pineapple', 'grape', 'lemon', 'lime',
    'watermelon', 'peach', 'pear', 'pomegranate',
    'kiwi', 'avocado',

    # Legumes & pulses
    'lentil', 'dal', 'dall', 'bean', 'black bean',
    'kidney bean', 'rajma', 'chickpea', 'chole',
    'peas', 'legume', 'moong', 'masoor', 'toor',

    # Dairy
    'milk', 'butter', 'cream', 'cheese',
    'mozzarella', 'cheddar', 'parmesan',
    'ricotta', 'yogurt', 'curd', 'ghee',
    'cream cheese', 'condensed milk',

    # Spices & herbs
    'turmeric', 'cumin', 'coriander', 'chili',
    'paprika', 'garam masala', 'oregano',
    'thyme', 'basil', 'parsley', 'rosemary',
    'cardamom', 'clove', 'cinnamon',
    'mustard seed', 'fenugreek',
    'bay leaf', 'star anise',
    'black pepper', 'white pepper',
    'red chili powder',

    # Sauces & condiments
    'ketchup', 'mustard', 'mayonnaise',
    'soy sauce', 'vinegar', 'olive oil',
    'sesame oil', 'hot sauce', 'bbq sauce',
    'chutney', 'pickle', 'relish',
    'honey', 'maple syrup',

    # Indian dishes
    'biryani', 'pulao', 'curry', 'tikka',
    'masala', 'tandoori', 'korma',
    'vindaloo', 'samosa', 'pakora',
    'dosa', 'idli', 'vada', 'chaat',
    'chaap', 'rajma', 'chole',
    'haleem', 'nihari', 'karahi',

    # Asian dishes
    'sushi', 'ramen', 'dumpling',
    'fried rice', 'spring roll',
    'kimchi', 'pad thai',

    # Western dishes
    'pizza', 'burger', 'sandwich',
    'taco', 'burrito', 'lasagna',
    'pasta', 'steak', 'stew',
    'soup', 'risotto', 'paella',

    # Desserts & baking
    'cake', 'cupcake', 'brownie',
    'cookie', 'biscuit', 'pastry',
    'pie', 'pudding', 'custard',
    'ice cream', 'chocolate',
    'frosting', 'icing', 'batter',
    'dough', 'muffin', 'waffle',
    'pancake', 'donut',

    # Diet types
    'vegetarian', 'vegan', 'keto',
    'low carb', 'high protein',
    'gluten free', 'dairy free',
    'halal', 'organic', 'healthy',
    'weight loss',

    # Kitchen equipment
    'oven', 'stove', 'pan', 'pot',
    'pressure cooker', 'air fryer',
    'blender', 'mixer', 'whisk',
    'knife', 'spoon', 'fork',
    'spatula', 'grater',
    'microwave', 'toaster',

    # Beverages
    'tea', 'coffee', 'juice',
    'smoothie', 'shake', 'mocktail',
    'milkshake', 'lassi',

    # Common phrases
    'how to make', 'how to cook',
    'step by step recipe',
    'easy recipe', 'quick recipe',
    'cooking time', 'serving size',
    'ingredients list'
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

    def _build_chat_prompt(self, message: str, context: Optional[list] = None) -> str:
        """Build prompt for chat responses"""

        context_str = ""
        if context:
            formatted_context = []
            for msg in context[-3:]:  # Last 3 exchanges
                # Handle different possible context formats
                if isinstance(msg, dict):
                    if 'user' in msg and 'assistant' in msg:
                        formatted_context.append(f"User: {msg['user']}\nAssistant: {msg['assistant']}")
                    elif 'role' in msg and 'content' in msg:
                        role = "User" if msg['role'] == 'user' else "Assistant"
                        formatted_context.append(f"{role}: {msg['content']}")
            context_str = "\n".join(formatted_context)

        return f"""You are a cooking assistant. Answer ONLY cooking-related questions.

Rules:
- Stay on topic (recipes, cooking, ingredients, nutrition)
- Be helpful and concise
- If asked about non-cooking topics, politely decline

{context_str}

User: {message}
Assistant:"""

    async def _generate_with_gemini(self, prompt: str) -> str:
        """Call Gemini API with retry logic for transient errors"""

        for attempt in range(self.max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_id,
                    contents=prompt
                )
                return response.text

            except Exception as e:
                error_str = str(e)
                logger.error(f"Gemini API error (attempt {attempt + 1}/{self.max_retries}): {e}")

                # Check if it's a retryable error (503, 429, etc.)
                is_retryable = any(code in error_str for code in ['503', '429', 'UNAVAILABLE', 'RESOURCE_EXHAUSTED'])

                if is_retryable and attempt < self.max_retries - 1:
                    # Exponential backoff: 2s, 4s, 8s
                    delay = self.retry_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                    continue

                # Non-retryable error or max retries reached
                if is_retryable:
                    raise ValueError("The AI service is currently experiencing high demand. Please try again in a few moments.")
                else:
                    raise ValueError(f"AI generation failed: {str(e)}")

        raise ValueError("Failed to generate response after multiple retries")

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

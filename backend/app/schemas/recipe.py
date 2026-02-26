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


class RecipeRequest(BaseModel):
    dish_name: str = Field(..., min_length=1, max_length=200)


class IngredientRequest(BaseModel):
    ingredients: List[str] = Field(..., min_items=1, max_items=20)


class IngredientResponse(BaseModel):
    suggested_dishes: List[str]
    selected_recipe: RecipeResponse
    missing_optional_ingredients: List[str]


class SaveRecipeRequest(BaseModel):
    recipe_data: dict

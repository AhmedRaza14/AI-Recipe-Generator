from fastapi import APIRouter, HTTPException
from app.services.ai_service import ai_service
from app.schemas.recipe import RecipeRequest, RecipeResponse, IngredientRequest

router = APIRouter()


@router.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(request: RecipeRequest):
    """Generate recipe from dish name"""
    try:
        recipe = await ai_service.generate_recipe(request.dish_name)
        return recipe
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Recipe generation failed")


@router.post("/generate-from-ingredients")
async def generate_from_ingredients(request: IngredientRequest):
    """Generate recipe suggestions from ingredients"""
    try:
        result = await ai_service.generate_from_ingredients(request.ingredients)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Generation failed")

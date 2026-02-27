from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.dependencies import get_current_user
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.recipe import SaveRecipeRequest

router = APIRouter()


@router.post("/save-recipe")
async def save_recipe(
    request: SaveRecipeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save recipe for authenticated user"""
    recipe_repo = RecipeRepository(db)
    saved = recipe_repo.create({
        'user_id': current_user.id,
        'recipe_json': request.recipe_data
    })
    return {"id": saved.id, "message": "Recipe saved successfully"}


@router.get("/recipes")
async def get_saved_recipes(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved recipes for user"""
    recipe_repo = RecipeRepository(db)
    recipes = recipe_repo.get_by_user_id(current_user.id)
    # Extract recipe JSON data and add the database ID
    return [{"id": recipe.id, **recipe.recipe_json} for recipe in recipes]


@router.delete("/recipes/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete saved recipe"""
    recipe_repo = RecipeRepository(db)
    success = recipe_repo.delete(recipe_id, current_user.id)

    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {"message": "Recipe deleted successfully"}

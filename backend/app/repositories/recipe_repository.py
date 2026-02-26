from sqlalchemy.orm import Session
from app.models.recipe import Recipe
from typing import List, Optional


class RecipeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, recipe_id: int) -> Optional[Recipe]:
        """Get recipe by ID"""
        return self.db.query(Recipe).filter(Recipe.id == recipe_id).first()

    def get_by_user_id(self, user_id: int) -> List[Recipe]:
        """Get all recipes for a user"""
        return self.db.query(Recipe).filter(Recipe.user_id == user_id).order_by(Recipe.created_at.desc()).all()

    def create(self, recipe_data: dict) -> Recipe:
        """Create new recipe"""
        recipe = Recipe(**recipe_data)
        self.db.add(recipe)
        self.db.commit()
        self.db.refresh(recipe)
        return recipe

    def delete(self, recipe_id: int, user_id: int) -> bool:
        """Delete recipe (only if owned by user)"""
        recipe = self.db.query(Recipe).filter(
            Recipe.id == recipe_id,
            Recipe.user_id == user_id
        ).first()

        if recipe:
            self.db.delete(recipe)
            self.db.commit()
            return True
        return False

    def count_by_user(self, user_id: int) -> int:
        """Count recipes for a user"""
        return self.db.query(Recipe).filter(Recipe.user_id == user_id).count()

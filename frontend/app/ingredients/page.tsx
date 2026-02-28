'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Recipe } from '@/lib/types';
import RecipeCard from '@/components/recipe/RecipeCard';
import IngredientInput from '@/components/ingredients/IngredientInput';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.generateFromIngredients(ingredients);
      // Extract the selected_recipe from the response
      setRecipe(response.selected_recipe);
      toast.success('Recipe generated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to generate recipe';
      toast.error(errorMessage);
      console.error('Recipe generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;

    try {
      await apiClient.saveRecipe(recipe);
      toast.success('Recipe saved successfully!');
      router.push('/saved');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to save recipes');
        router.push('/login');
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to save recipe';
        toast.error(errorMessage);
        console.error('Save recipe error:', error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Recipe from Ingredients
          </h1>
          <p className={styles.subtitle}>
            Add your available ingredients and get recipe suggestions
          </p>
        </div>

        <div className={styles.inputCard}>
          <h3 className={styles.cardTitle}>
            Your Ingredients
          </h3>
          <IngredientInput onIngredientsChange={setIngredients} />

          <Button
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={isLoading || ingredients.length === 0}
            className={styles.generateButton}
          >
            Generate Recipe
          </Button>
        </div>

        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner />
            <p className={styles.loadingText}>Creating recipe from your ingredients...</p>
          </div>
        )}

        {recipe && !isLoading && (
          <RecipeCard
            recipe={recipe}
            onSave={handleSave}
            showSaveButton={true}
          />
        )}
      </div>
    </div>
  );
}

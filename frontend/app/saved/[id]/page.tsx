'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Recipe } from '@/lib/types';
import RecipeCard from '@/components/recipe/RecipeCard';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    setIsLoading(true);
    try {
      const savedRecipes = await apiClient.getSavedRecipes();
      const foundRecipe = savedRecipes.find((r: Recipe) => r.id === parseInt(recipeId));

      if (foundRecipe) {
        setRecipe(foundRecipe);
      } else {
        toast.error('Recipe not found');
        router.push('/saved');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to load recipe';
      toast.error(errorMessage);
      router.push('/saved');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;

    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await apiClient.deleteSavedRecipe(recipe.id!);
      toast.success('Recipe deleted successfully');
      router.push('/saved');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete recipe';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
        <p className={styles.loadingText}>Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Button
            onClick={() => router.push('/saved')}
            variant="secondary"
          >
            ← Back to Saved Recipes
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
          >
            Delete Recipe
          </Button>
        </div>

        <RecipeCard
          recipe={recipe}
          showSaveButton={false}
        />
      </div>
    </div>
  );
}

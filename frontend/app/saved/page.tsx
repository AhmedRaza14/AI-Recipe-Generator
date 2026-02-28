'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Recipe } from '@/lib/types';
import SavedRecipeCard from '@/components/recipe/SavedRecipeCard';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function SavedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchSavedRecipes();
  }, [isAuthenticated, router]);

  const fetchSavedRecipes = async () => {
    setIsLoading(true);
    try {
      const savedRecipes = await apiClient.getSavedRecipes();
      setRecipes(savedRecipes);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to view saved recipes');
        router.push('/login');
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to load saved recipes';
        toast.error(errorMessage);
        console.error('Fetch saved recipes error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (recipeId: number) => {
    try {
      await apiClient.deleteSavedRecipe(recipeId);
      setRecipes(recipes.filter(r => r.id !== recipeId));
      toast.success('Recipe deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete recipe';
      toast.error(errorMessage);
      console.error('Delete recipe error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Spinner />
          <p className={styles.loadingText}>Loading your saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Saved Recipes
          </h1>
          <p className={styles.subtitle}>
            Your collection of favorite recipes
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📖</div>
            <h3 className={styles.emptyTitle}>
              No saved recipes yet
            </h3>
            <p className={styles.emptyText}>
              Start generating recipes and save your favorites
            </p>
            <Button onClick={() => router.push('/recipe')}>
              Generate Recipe
            </Button>
          </div>
        ) : (
          <div className={styles.recipesGrid}>
            {recipes.map((recipe) => (
              <SavedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Recipe } from '@/lib/types';
import RecipeCard from '@/components/recipe/RecipeCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function RecipePage() {
  const [dishName, setDishName] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!dishName.trim()) {
      toast.error('Please enter a dish name');
      return;
    }

    setIsLoading(true);
    try {
      const generatedRecipe = await apiClient.generateRecipe(dishName);
      setRecipe(generatedRecipe);
      toast.success('Recipe generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate recipe');
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
        toast.error('Failed to save recipe');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Generate Recipe
          </h1>
          <p className={styles.subtitle}>
            Enter a dish name and let AI create a detailed recipe for you
          </p>
        </div>

        <div className={styles.inputCard}>
          <div className={styles.inputGroup}>
            <Input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., Chicken Tikka Masala, Chocolate Cake..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Generate
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner />
            <p className={styles.loadingText}>Generating your recipe...</p>
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

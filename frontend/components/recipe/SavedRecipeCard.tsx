'use client';

import { Recipe } from '@/lib/types';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import styles from './SavedRecipeCard.module.css';

interface SavedRecipeCardProps {
  recipe: Recipe;
  onDelete: (id: number) => void;
}

export default function SavedRecipeCard({ recipe, onDelete }: SavedRecipeCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/saved/${recipe.id}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.title}>{recipe.title}</h3>
        <p className={styles.description}>{recipe.description}</p>
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleViewDetails}
          className={styles.viewButton}
        >
          <EyeIcon className={styles.icon} />
          View Details
        </button>
        <button
          onClick={() => onDelete(recipe.id!)}
          className={styles.deleteButton}
        >
          <TrashIcon className={styles.icon} />
          Delete
        </button>
      </div>
    </div>
  );
}

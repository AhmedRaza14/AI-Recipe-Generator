'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import styles from './IngredientInput.module.css';

interface IngredientInputProps {
  onIngredientsChange: (ingredients: string[]) => void;
}

export default function IngredientInput({ onIngredientsChange }: IngredientInputProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim())) {
      const newIngredients = [...ingredients, inputValue.trim()];
      setIngredients(newIngredients);
      onIngredientsChange(newIngredients);
      setInputValue('');
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type an ingredient and press Enter..."
        className={styles.input}
      />

      {ingredients.length > 0 && (
        <div className={styles.tags}>
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className={styles.tag}
            >
              <span className={styles.tagText}>{ingredient}</span>
              <button
                onClick={() => removeIngredient(index)}
                className={styles.removeButton}
              >
                <XMarkIcon className={styles.removeIcon} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Recipe } from '@/lib/types';
import { ClockIcon, FireIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export default function RecipeCard({
  recipe,
  onSave,
  showSaveButton = true
}: RecipeCardProps) {
  // Defensive checks for undefined values
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const tips = recipe.tips || [];
  const nutrition = recipe.nutrition || { calories: '0', protein: '0g', carbs: '0g', fat: '0g' };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          {recipe.title}
        </h2>
        <p className={styles.description}>{recipe.description}</p>
      </div>

      {/* Time Badges */}
      <div className={styles.badges}>
        <div className={`${styles.badge} ${styles.badgePrep}`}>
          <ClockIcon className={`${styles.badgeIcon} ${styles.badgeIconPrep}`} />
          <span className={`${styles.badgeText} ${styles.badgeTextPrep}`}>Prep: {recipe.prep_time}</span>
        </div>
        <div className={`${styles.badge} ${styles.badgeCook}`}>
          <FireIcon className={`${styles.badgeIcon} ${styles.badgeIconCook}`} />
          <span className={`${styles.badgeText} ${styles.badgeTextCook}`}>Cook: {recipe.cook_time}</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoColumn}>
        {/* Ingredients */}
        <div>
          <h3 className={styles.sectionTitle}>Ingredients</h3>
          <div className={styles.ingredientsBox}>
            <ul className={styles.ingredientsList}>
              {ingredients.map((ing, idx) => (
                <li key={idx}>
                  <span className={styles.ingredientBullet}></span>
                  <span><span className={styles.ingredientQuantity}>{ing.quantity}</span> {ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nutrition */}
        <div>
          <h3 className={styles.sectionTitle}>Nutrition</h3>
          <div className={styles.nutritionGrid}>
            <div className={`${styles.nutritionCard} ${styles.nutritionCalories}`}>
              <div className={`${styles.nutritionValue} ${styles.nutritionValueCalories}`}>{nutrition.calories}</div>
              <div className={styles.nutritionLabel}>Calories</div>
            </div>
            <div className={`${styles.nutritionCard} ${styles.nutritionProtein}`}>
              <div className={`${styles.nutritionValue} ${styles.nutritionValueProtein}`}>{nutrition.protein}</div>
              <div className={styles.nutritionLabel}>Protein</div>
            </div>
            <div className={`${styles.nutritionCard} ${styles.nutritionCarbs}`}>
              <div className={`${styles.nutritionValue} ${styles.nutritionValueCarbs}`}>{nutrition.carbs}</div>
              <div className={styles.nutritionLabel}>Carbs</div>
            </div>
            <div className={`${styles.nutritionCard} ${styles.nutritionFat}`}>
              <div className={`${styles.nutritionValue} ${styles.nutritionValueFat}`}>{nutrition.fat}</div>
              <div className={styles.nutritionLabel}>Fat</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        <div className={styles.steps}>
          {steps.map((step, idx) => (
            <div key={idx} className={styles.step}>
              <span className={styles.stepNumber}>
                {idx + 1}
              </span>
              <p className={styles.stepText}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tips</h3>
          <div className={styles.tipsBox}>
            <ul className={styles.tipsList}>
              {tips.map((tip, idx) => (
                <li key={idx}>
                  <span className={styles.tipIcon}>💡</span>
                  <span className={styles.tipText}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Save Button */}
      {showSaveButton && onSave && (
        <button
          onClick={onSave}
          className={styles.saveButton}
        >
          <BookmarkIcon className={styles.saveIcon} />
          Save Recipe
        </button>
      )}
    </div>
  );
}

import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Create Amazing Recipes with <span className={styles.highlight}>AI</span>
            </h1>
            <p className={styles.subtitle}>
              Generate personalized recipes from dish names or your available ingredients.
              Save your favorites and get cooking tips from our AI assistant.
            </p>
            <Link href="/recipe" className={styles.ctaButton}>
              Start Cooking
            </Link>
          </div>

          <div className={styles.mockRecipe}>
            <h3 className={styles.mockTitle}>Creamy Garlic Pasta</h3>
            <div className={styles.mockMeta}>
              <span>⏱️ 20 mins</span>
              <span>👨‍🍳 Easy</span>
              <span>🍽️ 4 servings</span>
            </div>
            <div className={styles.mockIngredients}>
              <h4 className={styles.mockIngredientsTitle}>Ingredients:</h4>
              <ul className={styles.mockIngredientsList}>
                <li>400g pasta</li>
                <li>4 cloves garlic</li>
                <li>200ml heavy cream</li>
                <li>Parmesan cheese</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎯</div>
          <h3 className={styles.featureTitle}>Recipe Generation</h3>
          <p className={styles.featureDescription}>
            Simply enter a dish name and get a complete recipe with ingredients,
            instructions, and cooking tips.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🥗</div>
          <h3 className={styles.featureTitle}>Ingredient-Based</h3>
          <p className={styles.featureDescription}>
            Have ingredients but no idea what to cook? Enter what you have and
            get recipe suggestions.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>💬</div>
          <h3 className={styles.featureTitle}>AI Assistant</h3>
          <p className={styles.featureDescription}>
            Chat with our AI assistant for cooking tips, substitutions, and
            personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}

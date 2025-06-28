import { Recipe } from '../types/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load sample recipes from JSON file
const sampleRecipesJson = JSON.parse(
  readFileSync(join(__dirname, 'sampleRecipes.json'), 'utf-8')
);

// Type assertion to ensure the JSON data matches our Recipe type
export const sampleRecipes: Recipe[] = sampleRecipesJson as Recipe[];

/**
 * Recipe data manager class
 */
export class RecipeDataManager {
  private recipes: Recipe[] = [];

  constructor(initialRecipes: Recipe[] = sampleRecipes) {
    this.recipes = [...initialRecipes];
  }

  /**
   * Get all recipes
   */
  getAllRecipes(): Recipe[] {
    return [...this.recipes];
  }

  /**
   * Get recipe by ID
   */
  getRecipeById(id: string): Recipe | undefined {
    return this.recipes.find(recipe => recipe.id === id);
  }

  /**
   * Get recipes by category
   */
  getRecipesByCategory(category: string): Recipe[] {
    return this.recipes.filter(recipe => recipe.category === category);
  }

  /**
   * Search recipes by name or ingredients
   */
  searchRecipes(query: string): Recipe[] {
    const lowerQuery = query.toLowerCase();
    return this.recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description?.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(lowerQuery)
      ) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add a new recipe
   */
  addRecipe(recipe: Recipe): void {
    // Check if recipe with same ID already exists
    const existingIndex = this.recipes.findIndex(r => r.id === recipe.id);
    if (existingIndex !== -1) {
      throw new Error(`Recipe with ID ${recipe.id} already exists`);
    }
    
    this.recipes.push(recipe);
  }

  /**
   * Update an existing recipe
   */
  updateRecipe(id: string, updatedRecipe: Partial<Recipe>): Recipe | null {
    const index = this.recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) {
      return null;
    }

    this.recipes[index] = {
      ...this.recipes[index]!,
      ...updatedRecipe,
      id, // Ensure ID doesn't change
      lastModified: new Date().toISOString()
    };

    return this.recipes[index]!;
  }

  /**
   * Delete a recipe
   */
  deleteRecipe(id: string): boolean {
    const index = this.recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) {
      return false;
    }

    this.recipes.splice(index, 1);
    return true;
  }

  /**
   * Get recipes by multiple criteria
   */
  getRecipesByCriteria(criteria: {
    categories?: string[];
    difficulty?: string;
    maxPrepTime?: number; // in minutes
    maxCookTime?: number; // in minutes
    tags?: string[];
  }): Recipe[] {
    return this.recipes.filter(recipe => {
      // Filter by categories
      if (criteria.categories && criteria.categories.length > 0) {
        if (!criteria.categories.includes(recipe.category)) {
          return false;
        }
      }

      // Filter by difficulty
      if (criteria.difficulty && recipe.difficulty !== criteria.difficulty) {
        return false;
      }

      // Filter by prep time
      if (criteria.maxPrepTime) {
        const prepMinutes = this.parseTimeInMinutes(recipe.prepTime);
        if (prepMinutes > criteria.maxPrepTime) {
          return false;
        }
      }

      // Filter by cook time
      if (criteria.maxCookTime) {
        const cookMinutes = this.parseTimeInMinutes(recipe.cookTime);
        if (cookMinutes > criteria.maxCookTime) {
          return false;
        }
      }

      // Filter by tags
      if (criteria.tags && criteria.tags.length > 0) {
        if (!recipe.tags || !criteria.tags.some(tag => recipe.tags!.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get recipe statistics
   */
  getStatistics(): {
    totalRecipes: number;
    categoryCounts: Record<string, number>;
    difficultyCounts: Record<string, number>;
    averagePrepTime: number;
    averageCookTime: number;
  } {
    const categoryCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    let totalPrepTime = 0;
    let totalCookTime = 0;

    this.recipes.forEach(recipe => {
      // Count categories
      categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
      
      // Count difficulties
      difficultyCounts[recipe.difficulty] = (difficultyCounts[recipe.difficulty] || 0) + 1;
      
      // Sum times
      totalPrepTime += this.parseTimeInMinutes(recipe.prepTime);
      totalCookTime += this.parseTimeInMinutes(recipe.cookTime);
    });

    return {
      totalRecipes: this.recipes.length,
      categoryCounts,
      difficultyCounts,
      averagePrepTime: Math.round(totalPrepTime / this.recipes.length),
      averageCookTime: Math.round(totalCookTime / this.recipes.length)
    };
  }

  /**
   * Parse time string to minutes
   */
  private parseTimeInMinutes(timeStr: string): number {
    const hourMatch = timeStr.match(/(\d+)小时/);
    const minuteMatch = timeStr.match(/(\d+)分钟/);
    
    let totalMinutes = 0;
    
    if (hourMatch && hourMatch[1]) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }

    if (minuteMatch && minuteMatch[1]) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    return totalMinutes;
  }

  /**
   * Get random recipes
   */
  getRandomRecipes(count: number): Recipe[] {
    const shuffled = [...this.recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.recipes.length));
  }

  /**
   * Get recipes suitable for a number of people
   */
  getRecipesForServings(targetServings: number, tolerance: number = 2): Recipe[] {
    return this.recipes.filter(recipe => 
      Math.abs(recipe.servings - targetServings) <= tolerance
    );
  }
}

// Create a default instance
export const recipeDataManager = new RecipeDataManager();

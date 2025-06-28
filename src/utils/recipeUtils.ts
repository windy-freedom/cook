import { Recipe, RecipeCategory, DifficultyLevel, SearchParams } from '../types/index.js';

/**
 * Filter recipes by category
 */
export function filterRecipesByCategory(recipes: Recipe[], category: RecipeCategory): Recipe[] {
  return recipes.filter(recipe => recipe.category === category);
}

/**
 * Search recipes by query string
 */
export function searchRecipes(recipes: Recipe[], searchParams: SearchParams): Recipe[] {
  let filteredRecipes = [...recipes];

  // Filter by search query (name, description, ingredients)
  if (searchParams.query) {
    const query = searchParams.query.toLowerCase();
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.name.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.ingredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(query)
      ) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Filter by categories
  if (searchParams.categories && searchParams.categories.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      searchParams.categories!.includes(recipe.category)
    );
  }

  // Filter by tags
  if (searchParams.tags && searchParams.tags.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      recipe.tags?.some(tag => searchParams.tags!.includes(tag))
    );
  }

  // Filter by difficulty
  if (searchParams.difficulty) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      recipe.difficulty === searchParams.difficulty
    );
  }

  // Filter by max prep time
  if (searchParams.maxPrepTime) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      parseTimeInMinutes(recipe.prepTime) <= parseTimeInMinutes(searchParams.maxPrepTime!)
    );
  }

  // Filter by max cook time
  if (searchParams.maxCookTime) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      parseTimeInMinutes(recipe.cookTime) <= parseTimeInMinutes(searchParams.maxCookTime!)
    );
  }

  return filteredRecipes;
}

/**
 * Parse time string to minutes (e.g., "30分钟" -> 30, "1小时" -> 60)
 */
export function parseTimeInMinutes(timeStr: string): number {
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
 * Format minutes to Chinese time string
 */
export function formatTimeFromMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${remainingMinutes}分钟`;
}

/**
 * Calculate total cooking time for a recipe
 */
export function calculateTotalTime(prepTime: string, cookTime: string): string {
  const prepMinutes = parseTimeInMinutes(prepTime);
  const cookMinutes = parseTimeInMinutes(cookTime);
  const totalMinutes = prepMinutes + cookMinutes;
  
  return formatTimeFromMinutes(totalMinutes);
}

/**
 * Get recipes suitable for a specific number of people
 */
export function getRecipesForServings(recipes: Recipe[], targetServings: number, tolerance: number = 2): Recipe[] {
  return recipes.filter(recipe => 
    Math.abs(recipe.servings - targetServings) <= tolerance
  );
}

/**
 * Scale recipe ingredients for different serving sizes
 */
export function scaleRecipeIngredients(recipe: Recipe, targetServings: number): Recipe {
  const scaleFactor = targetServings / recipe.servings;
  
  const scaledIngredients = recipe.ingredients.map(ingredient => ({
    ...ingredient,
    amount: scaleIngredientAmount(ingredient.amount, scaleFactor)
  }));

  return {
    ...recipe,
    servings: targetServings,
    ingredients: scaledIngredients
  };
}

/**
 * Scale ingredient amount (handles various Chinese units)
 */
function scaleIngredientAmount(amount: string, scaleFactor: number): string {
  // Handle numeric amounts with units
  const numericMatch = amount.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (numericMatch && numericMatch[1]) {
    const [, numStr, unit] = numericMatch;
    const originalNum = parseFloat(numStr);
    const scaledNum = originalNum * scaleFactor;
    
    // Round to reasonable precision
    const roundedNum = Math.round(scaledNum * 100) / 100;
    
    return `${roundedNum}${unit}`;
  }
  
  // Handle special cases like "适量", "少许", etc.
  const specialCases = ['适量', '少许', '一点', '若干'];
  if (specialCases.some(special => amount.includes(special))) {
    return amount; // Don't scale these
  }
  
  return amount; // Return original if can't parse
}

/**
 * Get recipe difficulty distribution
 */
export function getRecipeDifficultyDistribution(recipes: Recipe[]): Record<DifficultyLevel, number> {
  const distribution: Record<DifficultyLevel, number> = {
    '简单': 0,
    '中等': 0,
    '困难': 0
  };
  
  recipes.forEach(recipe => {
    distribution[recipe.difficulty]++;
  });
  
  return distribution;
}

/**
 * Get recipe category distribution
 */
export function getRecipeCategoryDistribution(recipes: Recipe[]): Record<RecipeCategory, number> {
  const distribution: Record<RecipeCategory, number> = {
    '水产': 0,
    '早餐': 0,
    '调味料': 0,
    '甜品': 0,
    '饮品': 0,
    '荤菜': 0,
    '半成品': 0,
    '汤羹': 0,
    '主食': 0,
    '素菜': 0
  };
  
  recipes.forEach(recipe => {
    distribution[recipe.category]++;
  });
  
  return distribution;
}

/**
 * Validate recipe data
 */
export function validateRecipe(recipe: Recipe): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!recipe.name.trim()) {
    errors.push('Recipe name is required');
  }
  
  if (recipe.ingredients.length === 0) {
    errors.push('Recipe must have at least one ingredient');
  }
  
  if (recipe.steps.length === 0) {
    errors.push('Recipe must have at least one cooking step');
  }
  
  if (recipe.servings <= 0) {
    errors.push('Recipe servings must be greater than 0');
  }
  
  // Validate step numbers are sequential
  const stepNumbers = recipe.steps.map(step => step.stepNumber).sort((a, b) => a - b);
  for (let i = 0; i < stepNumbers.length; i++) {
    if (stepNumbers[i] !== i + 1) {
      errors.push('Recipe steps must be numbered sequentially starting from 1');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

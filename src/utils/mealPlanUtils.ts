import {
  Recipe,
  WeeklyMealPlan,
  DailyMealPlan,
  PlannedMeal,
  MealPlanPreferences,
  DayOfWeek
} from '../types/index.js';

/**
 * Generate a weekly meal plan based on preferences
 */
export function generateWeeklyMealPlan(
  recipes: Recipe[], 
  preferences: MealPlanPreferences,
  startDate?: string
): WeeklyMealPlan {
  const start = startDate ? new Date(startDate) : getNextMonday();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  // Filter recipes based on preferences
  const suitableRecipes = filterRecipesByPreferences(recipes, preferences);
  
  // Generate daily plans
  const dailyPlans: DailyMealPlan[] = [];
  const daysOfWeek: DayOfWeek[] = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    
    const dailyPlan = generateDailyMealPlan(
      suitableRecipes,
      preferences,
      daysOfWeek[i]!,
      currentDate.toISOString().split('T')[0]!
    );
    
    dailyPlans.push(dailyPlan);
  }
  
  return {
    id: generateId(),
    name: `${start.toISOString().split('T')[0]} 周meal计划`,
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
    preferences,
    dailyPlans,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}

/**
 * Generate a daily meal plan
 */
function generateDailyMealPlan(
  recipes: Recipe[],
  preferences: MealPlanPreferences,
  day: DayOfWeek,
  date: string
): DailyMealPlan {
  const meals: PlannedMeal[] = [];
  
  // Generate breakfast
  const breakfastRecipes = recipes.filter(r => 
    r.category === '早餐' || r.tags?.includes('早餐')
  );
  if (breakfastRecipes.length > 0) {
    const breakfastRecipe = selectRandomRecipe(breakfastRecipes);
    meals.push({
      mealType: '早餐',
      recipe: breakfastRecipe,
      servings: preferences.numberOfPeople,
      notes: '营养早餐，开启美好一天'
    });
  }
  
  // Generate lunch
  const lunchRecipes = recipes.filter(r => 
    ['荤菜', '素菜', '主食', '汤羹'].includes(r.category)
  );
  if (lunchRecipes.length > 0) {
    const lunchRecipe = selectRandomRecipe(lunchRecipes);
    meals.push({
      mealType: '午餐',
      recipe: lunchRecipe,
      servings: preferences.numberOfPeople,
      notes: '丰富午餐，补充能量'
    });
  }
  
  // Generate dinner
  const dinnerRecipes = recipes.filter(r => 
    ['荤菜', '素菜', '水产', '汤羹'].includes(r.category)
  );
  if (dinnerRecipes.length > 0) {
    const dinnerRecipe = selectRandomRecipe(dinnerRecipes);
    meals.push({
      mealType: '晚餐',
      recipe: dinnerRecipe,
      servings: preferences.numberOfPeople,
      notes: '营养晚餐，健康生活'
    });
  }
  
  return {
    day,
    date,
    meals,
    totalCalories: calculateDailyCalories(meals),
    notes: `${day}的营养搭配`
  };
}

/**
 * Filter recipes based on meal plan preferences
 */
function filterRecipesByPreferences(recipes: Recipe[], preferences: MealPlanPreferences): Recipe[] {
  let filtered = [...recipes];
  
  // Filter by dietary restrictions
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    filtered = filtered.filter(recipe => {
      // Simple dietary restriction logic - can be enhanced
      const restrictions = preferences.dietaryRestrictions!;
      
      if (restrictions.includes('素食') && recipe.category === '荤菜') {
        return false;
      }
      
      if (restrictions.includes('无海鲜') && recipe.category === '水产') {
        return false;
      }
      
      return true;
    });
  }
  
  // Filter by excluded categories
  if (preferences.excludedCategories && preferences.excludedCategories.length > 0) {
    filtered = filtered.filter(recipe => 
      !preferences.excludedCategories!.includes(recipe.category)
    );
  }
  
  // Filter by preferred categories
  if (preferences.preferredCategories && preferences.preferredCategories.length > 0) {
    const preferred = filtered.filter(recipe => 
      preferences.preferredCategories!.includes(recipe.category)
    );
    
    // If we have preferred recipes, use them; otherwise use all filtered
    if (preferred.length > 0) {
      filtered = preferred;
    }
  }
  
  // Filter by cooking skill level
  if (preferences.cookingSkillLevel) {
    const skillMap = {
      '初学者': ['简单'],
      '中级': ['简单', '中等'],
      '高级': ['简单', '中等', '困难']
    };
    
    const allowedDifficulties = skillMap[preferences.cookingSkillLevel];
    filtered = filtered.filter(recipe => 
      allowedDifficulties.includes(recipe.difficulty)
    );
  }
  
  return filtered;
}

/**
 * Select a random recipe from an array
 */
function selectRandomRecipe(recipes: Recipe[]): Recipe {
  const randomIndex = Math.floor(Math.random() * recipes.length);
  return recipes[randomIndex]!;
}

/**
 * Calculate total calories for daily meals
 */
function calculateDailyCalories(meals: PlannedMeal[]): number {
  return meals.reduce((total, meal) => {
    const recipeCalories = meal.recipe.nutritionalInfo?.calories || 0;
    const scaledCalories = (recipeCalories / meal.recipe.servings) * meal.servings;
    return total + scaledCalories;
  }, 0);
}

/**
 * Get next Monday's date
 */
function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Sunday = 0
  
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  return nextMonday;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `meal_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate meal plan preferences
 */
export function validateMealPlanPreferences(preferences: MealPlanPreferences): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (preferences.numberOfPeople <= 0) {
    errors.push('Number of people must be greater than 0');
  }
  
  if (preferences.numberOfPeople > 20) {
    errors.push('Number of people cannot exceed 20');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate meal plan statistics
 */
export function calculateMealPlanStats(mealPlan: WeeklyMealPlan): {
  totalRecipes: number;
  uniqueRecipes: number;
  categoriesUsed: string[];
  averageCaloriesPerDay: number;
  totalEstimatedCookTime: number;
} {
  const allRecipes = mealPlan.dailyPlans.flatMap(day => 
    day.meals.map(meal => meal.recipe)
  );
  
  const uniqueRecipeIds = new Set(allRecipes.map(recipe => recipe.id));
  const categoriesUsed = [...new Set(allRecipes.map(recipe => recipe.category))];
  
  const totalCalories = mealPlan.dailyPlans.reduce((sum, day) => 
    sum + (day.totalCalories || 0), 0
  );
  
  const averageCaloriesPerDay = totalCalories / mealPlan.dailyPlans.length;
  
  // Estimate total cook time (simplified calculation)
  const totalEstimatedCookTime = allRecipes.reduce((total, recipe) => {
    const prepMinutes = parseTimeInMinutes(recipe.prepTime);
    const cookMinutes = parseTimeInMinutes(recipe.cookTime);
    return total + prepMinutes + cookMinutes;
  }, 0);
  
  return {
    totalRecipes: allRecipes.length,
    uniqueRecipes: uniqueRecipeIds.size,
    categoriesUsed,
    averageCaloriesPerDay,
    totalEstimatedCookTime
  };
}

/**
 * Parse time string to minutes (helper function)
 */
function parseTimeInMinutes(timeStr: string): number {
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

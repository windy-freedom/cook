import {
  Recipe,
  DishCombination,
  RecommendedDish,
  CombinationPreferences,
  CombinationRequest,
  DishRole,
  CombinationType
} from '../types/index.js';

/**
 * Generate dish combination recommendations
 */
export function generateDishCombination(
  recipes: Recipe[], 
  request: CombinationRequest
): DishCombination {
  const { preferences } = request;
  
  // Filter suitable recipes
  const suitableRecipes = filterRecipesByPreferences(recipes, preferences);
  
  // Select dishes for combination
  const selectedDishes = selectDishesForCombination(
    suitableRecipes, 
    preferences, 
    request.maxDishes || 6,
    request.minDishes || 3,
    request.includeRecipeIds,
    request.excludeRecipeIds
  );
  
  // Create recommended dishes with roles
  const recommendedDishes = assignDishRoles(selectedDishes, preferences);
  
  // Calculate combination properties
  const totalPrepTime = calculateTotalPrepTime(recommendedDishes);
  const totalCookTime = calculateTotalCookTime(recommendedDishes);
  const difficulty = calculateOverallDifficulty(recommendedDishes);
  const nutritionalBalance = analyzeNutritionalBalance(recommendedDishes);
  const flavorProfile = analyzeFlavorProfile(recommendedDishes);
  
  return {
    id: generateCombinationId(),
    name: generateCombinationName(recommendedDishes, preferences),
    description: generateCombinationDescription(recommendedDishes, preferences),
    type: determineCombinationType(preferences),
    dishes: recommendedDishes,
    totalPrepTime,
    totalCookTime,
    difficulty,
    servings: preferences.numberOfPeople,
    nutritionalBalance,
    flavorProfile,
    cookingTips: generateCookingTips(recommendedDishes),
    alternatives: generateAlternatives(recommendedDishes, suitableRecipes),
    estimatedCost: estimateCombinationCost(recommendedDishes, preferences.budgetLevel),
    createdAt: new Date().toISOString()
  };
}

/**
 * Filter recipes based on combination preferences
 */
function filterRecipesByPreferences(recipes: Recipe[], preferences: CombinationPreferences): Recipe[] {
  let filtered = [...recipes];

  // Filter by dietary restrictions
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    filtered = filtered.filter(recipe => {
      return !preferences.dietaryRestrictions!.some((restriction: string) => {
        if (restriction === '素食' && recipe.category === '荤菜') return true;
        if (restriction === '无海鲜' && recipe.category === '水产') return true;
        if (restriction === '无坚果' && recipe.ingredients.some(ing =>
          ing.name.includes('花生') || ing.name.includes('核桃') || ing.name.includes('杏仁')
        )) return true;
        return false;
      });
    });
  }

  // Filter by skill level
  if (preferences.skillLevel) {
    const skillMap: Record<string, string[]> = {
      '初学者': ['简单'],
      '中级': ['简单', '中等'],
      '高级': ['简单', '中等', '困难']
    };

    const allowedDifficulties = skillMap[preferences.skillLevel] || ['简单', '中等', '困难'];
    filtered = filtered.filter(recipe =>
      allowedDifficulties.includes(recipe.difficulty)
    );
  }

  // Filter by cooking time constraints
  if (preferences.cookingTime) {
    const maxMinutes = parseTimeInMinutes(preferences.cookingTime);
    filtered = filtered.filter(recipe => {
      const recipeTime = parseTimeInMinutes(recipe.prepTime) + parseTimeInMinutes(recipe.cookTime);
      return recipeTime <= maxMinutes;
    });
  }

  return filtered;
}

/**
 * Select dishes for combination
 */
function selectDishesForCombination(
  recipes: Recipe[],
  _preferences: CombinationPreferences,
  maxDishes: number,
  minDishes: number,
  includeIds?: string[],
  excludeIds?: string[]
): Recipe[] {
  let availableRecipes = [...recipes];
  
  // Exclude specified recipes
  if (excludeIds && excludeIds.length > 0) {
    availableRecipes = availableRecipes.filter(recipe => 
      !excludeIds.includes(recipe.id)
    );
  }
  
  const selectedRecipes: Recipe[] = [];
  
  // Include required recipes
  if (includeIds && includeIds.length > 0) {
    const requiredRecipes = recipes.filter(recipe => includeIds.includes(recipe.id));
    selectedRecipes.push(...requiredRecipes);
    availableRecipes = availableRecipes.filter(recipe => 
      !includeIds.includes(recipe.id)
    );
  }
  
  // Select additional recipes to meet requirements
  const remainingSlots = Math.min(maxDishes - selectedRecipes.length, 
    Math.max(0, minDishes - selectedRecipes.length));
  
  // Prioritize different categories for variety
  const categoryPriority = ['荤菜', '素菜', '汤羹', '主食', '水产'];
  const usedCategories = new Set(selectedRecipes.map(r => r.category));

  for (const category of categoryPriority) {
    if (selectedRecipes.length >= maxDishes) break;
    if (usedCategories.has(category as any)) continue;
    
    const categoryRecipes = availableRecipes.filter(r => r.category === category);
    if (categoryRecipes.length > 0) {
      const selected = selectRandomRecipe(categoryRecipes);
      selectedRecipes.push(selected);
      usedCategories.add(category as any);
      availableRecipes = availableRecipes.filter(r => r.id !== selected.id);
    }
  }
  
  // Fill remaining slots with any suitable recipes
  while (selectedRecipes.length < Math.max(minDishes, remainingSlots) && availableRecipes.length > 0) {
    const selected = selectRandomRecipe(availableRecipes);
    selectedRecipes.push(selected);
    availableRecipes = availableRecipes.filter(r => r.id !== selected.id);
  }
  
  return selectedRecipes;
}

/**
 * Assign roles to dishes in combination
 */
function assignDishRoles(recipes: Recipe[], preferences: CombinationPreferences): RecommendedDish[] {
  const recommendedDishes: RecommendedDish[] = [];
  
  recipes.forEach((recipe, index) => {
    const role = determineDishRole(recipe, index, recipes.length);
    const priority = determineDishPriority(recipe, role, preferences);
    const reason = generateRecommendationReason(recipe, role, preferences);
    
    recommendedDishes.push({
      recipe,
      role,
      priority,
      reason,
      preparationOrder: index + 1,
      servingOrder: getServingOrder(role)
    });
  });
  
  return recommendedDishes.sort((a, b) => a.preparationOrder - b.preparationOrder);
}

/**
 * Determine dish role based on recipe category
 */
function determineDishRole(recipe: Recipe, _index: number, _totalDishes: number): DishRole {
  const categoryRoleMap: Record<string, DishRole> = {
    '荤菜': '主菜',
    '水产': '主菜',
    '素菜': '配菜',
    '汤羹': '汤品',
    '主食': '主食',
    '甜品': '甜品'
  };
  
  return categoryRoleMap[recipe.category] || '配菜';
}

/**
 * Determine dish priority
 */
function determineDishPriority(_recipe: Recipe, role: DishRole, preferences: CombinationPreferences): '必选' | '推荐' | '可选' {
  if (role === '主菜' || role === '主食') return '必选';
  if (role === '汤品' && preferences.numberOfPeople > 2) return '推荐';
  return '可选';
}

/**
 * Generate recommendation reason
 */
function generateRecommendationReason(recipe: Recipe, role: DishRole, _preferences: CombinationPreferences): string {
  const reasons = [
    `作为${role}，${recipe.name}能够为这餐增添丰富的口感`,
    `${recipe.name}的制作难度为${recipe.difficulty}，适合当前的烹饪安排`,
    `这道${recipe.name}能够很好地平衡整餐的营养搭配`
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)]!;
}

/**
 * Get serving order based on dish role
 */
function getServingOrder(role: DishRole): number {
  const orderMap: Record<DishRole, number> = {
    '开胃菜': 1,
    '汤品': 2,
    '主菜': 3,
    '配菜': 4,
    '主食': 5,
    '甜品': 6
  };
  
  return orderMap[role] || 3;
}

/**
 * Calculate total preparation time
 */
function calculateTotalPrepTime(dishes: RecommendedDish[]): string {
  const totalMinutes = dishes.reduce((sum, dish) => {
    return sum + parseTimeInMinutes(dish.recipe.prepTime);
  }, 0);
  
  return formatTimeFromMinutes(totalMinutes);
}

/**
 * Calculate total cooking time (considering parallel cooking)
 */
function calculateTotalCookTime(dishes: RecommendedDish[]): string {
  // Simplified calculation - assumes some parallel cooking
  const cookTimes = dishes.map(dish => parseTimeInMinutes(dish.recipe.cookTime));
  const maxCookTime = Math.max(...cookTimes);
  const totalCookTime = cookTimes.reduce((sum, time) => sum + time, 0);
  
  // Estimate actual time considering parallel cooking (60% of total)
  const estimatedTime = Math.max(maxCookTime, totalCookTime * 0.6);
  
  return formatTimeFromMinutes(Math.round(estimatedTime));
}

/**
 * Calculate overall difficulty
 */
function calculateOverallDifficulty(dishes: RecommendedDish[]): '简单' | '中等' | '困难' {
  const difficultyScores = { '简单': 1, '中等': 2, '困难': 3 };
  const avgScore = dishes.reduce((sum, dish) => 
    sum + difficultyScores[dish.recipe.difficulty], 0
  ) / dishes.length;
  
  if (avgScore <= 1.3) return '简单';
  if (avgScore <= 2.3) return '中等';
  return '困难';
}

/**
 * Analyze nutritional balance
 */
function analyzeNutritionalBalance(dishes: RecommendedDish[]): {
  hasProtein: boolean;
  hasVegetables: boolean;
  hasCarbs: boolean;
  isBalanced: boolean;
} {
  const categories = dishes.map(dish => dish.recipe.category);
  
  const hasProtein = categories.some(cat => ['荤菜', '水产', '蛋奶'].includes(cat));
  const hasVegetables = categories.includes('素菜');
  const hasCarbs = categories.includes('主食');
  const isBalanced = hasProtein && hasVegetables && hasCarbs;
  
  return { hasProtein, hasVegetables, hasCarbs, isBalanced };
}

/**
 * Analyze flavor profile
 */
function analyzeFlavorProfile(dishes: RecommendedDish[]): string[] {
  const flavors = new Set<string>();
  
  dishes.forEach(dish => {
    if (dish.recipe.tags) {
      dish.recipe.tags.forEach(tag => {
        if (['酸', '甜', '苦', '辣', '咸', '鲜', '香', '清淡', '浓郁'].includes(tag)) {
          flavors.add(tag);
        }
      });
    }
    
    // Infer flavors from cooking methods
    if (dish.recipe.cookingMethods) {
      dish.recipe.cookingMethods.forEach(method => {
        if (method === '炒') flavors.add('香');
        if (method === '蒸') flavors.add('清淡');
        if (method === '炖') flavors.add('浓郁');
      });
    }
  });
  
  return Array.from(flavors);
}

/**
 * Generate cooking tips
 */
function generateCookingTips(_dishes: RecommendedDish[]): string[] {
  const tips = [
    '建议按照准备顺序依次处理食材，提高效率',
    '可以同时进行多道菜的准备工作，节省时间',
    '注意火候控制，避免同时操作过多炉灶',
    '提前准备调料和配菜，确保烹饪过程顺畅'
  ];
  
  return tips.slice(0, 2);
}

/**
 * Generate alternatives
 */
function generateAlternatives(dishes: RecommendedDish[], availableRecipes: Recipe[]): string[] {
  const alternatives: string[] = [];
  
  dishes.forEach(dish => {
    const sameCategory = availableRecipes.filter(r => 
      r.category === dish.recipe.category && r.id !== dish.recipe.id
    );
    
    if (sameCategory.length > 0) {
      const alternative = sameCategory[0]!;
      alternatives.push(`${dish.recipe.name} 可以替换为 ${alternative.name}`);
    }
  });
  
  return alternatives.slice(0, 3);
}

/**
 * Estimate combination cost
 */
function estimateCombinationCost(dishes: RecommendedDish[], budgetLevel?: string): string {
  const dishCount = dishes.length;
  
  const costRanges = {
    '经济': [20, 40],
    '中等': [40, 80],
    '高档': [80, 150]
  };

  const range = costRanges[budgetLevel as keyof typeof costRanges] || costRanges['中等'];
  const min = range[0]!;
  const max = range[1]!;
  const estimatedCost = min + (dishCount - 3) * 10;

  return `${Math.max(min, estimatedCost)}-${Math.min(max, estimatedCost + 20)}元`;
}

/**
 * Determine combination type
 */
function determineCombinationType(preferences: CombinationPreferences): CombinationType {
  if (preferences.occasion === '招待客人') return '宴客搭配';
  if (preferences.occasion === '节日') return '节日搭配';
  if (preferences.cookingTime && parseTimeInMinutes(preferences.cookingTime) < 60) return '快手搭配';
  if (preferences.nutritionalBalance) return '营养搭配';
  
  return '家常搭配';
}

/**
 * Generate combination name
 */
function generateCombinationName(dishes: RecommendedDish[], preferences: CombinationPreferences): string {
  const mainDish = dishes.find(d => d.role === '主菜');
  const occasion = preferences.occasion || '家常';
  
  if (mainDish) {
    return `${mainDish.recipe.name}${occasion}套餐`;
  }
  
  return `${occasion}搭配套餐`;
}

/**
 * Generate combination description
 */
function generateCombinationDescription(dishes: RecommendedDish[], preferences: CombinationPreferences): string {
  const dishNames = dishes.map(d => d.recipe.name).join('、');
  return `为${preferences.numberOfPeople}人精心搭配的${preferences.occasion || '家常'}套餐，包含${dishNames}，营养均衡，口感丰富。`;
}

// Helper functions
function selectRandomRecipe(recipes: Recipe[]): Recipe {
  return recipes[Math.floor(Math.random() * recipes.length)]!;
}

function parseTimeInMinutes(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)小时/);
  const minuteMatch = timeStr.match(/(\d+)分钟/);
  
  let totalMinutes = 0;
  if (hourMatch && hourMatch[1]) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minuteMatch && minuteMatch[1]) totalMinutes += parseInt(minuteMatch[1]);
  
  return totalMinutes;
}

function formatTimeFromMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}小时`;
  return `${hours}小时${remainingMinutes}分钟`;
}

function generateCombinationId(): string {
  return `combination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

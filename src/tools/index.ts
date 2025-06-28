// Export all tools for easy importing
export { getAllRecipesTool, handleGetAllRecipes } from './getAllRecipes.js';
export { getRecipesByCategoryTool, handleGetRecipesByCategory } from './getRecipesByCategory.js';
export { getRecipeDetailsTool, handleGetRecipeDetails } from './getRecipeDetails.js';
export { recommendMealPlanTool, handleRecommendMealPlan } from './recommendMealPlan.js';
export { recommendDishCombinationTool, handleRecommendDishCombination } from './recommendDishCombination.js';

// Tool registry for easy access
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getAllRecipesTool } from './getAllRecipes.js';
import { getRecipesByCategoryTool } from './getRecipesByCategory.js';
import { getRecipeDetailsTool } from './getRecipeDetails.js';
import { recommendMealPlanTool } from './recommendMealPlan.js';
import { recommendDishCombinationTool } from './recommendDishCombination.js';

export const allTools: Tool[] = [
  getAllRecipesTool,
  getRecipesByCategoryTool,
  getRecipeDetailsTool,
  recommendMealPlanTool,
  recommendDishCombinationTool
];

// Tool handler registry
export const toolHandlers = {
  'get_all_recipes': async (input: any) => {
    const { handleGetAllRecipes } = await import('./getAllRecipes.js');
    return handleGetAllRecipes(input);
  },
  'get_recipes_by_category': async (input: any) => {
    const { handleGetRecipesByCategory } = await import('./getRecipesByCategory.js');
    return handleGetRecipesByCategory(input);
  },
  'get_recipe_details': async (input: any) => {
    const { handleGetRecipeDetails } = await import('./getRecipeDetails.js');
    return handleGetRecipeDetails(input);
  },
  'recommend_meal_plan': async (input: any) => {
    const { handleRecommendMealPlan } = await import('./recommendMealPlan.js');
    return handleRecommendMealPlan(input);
  },
  'recommend_dish_combination': async (input: any) => {
    const { handleRecommendDishCombination } = await import('./recommendDishCombination.js');
    return handleRecommendDishCombination(input);
  }
};

// Tool information for help and documentation
export const toolInfo = {
  'get_all_recipes': {
    name: 'get_all_recipes',
    description: 'Retrieve all available recipes with pagination and sorting options',
    category: 'Recipe Management',
    examples: [
      { description: 'Get first 10 recipes', input: { limit: 10 } },
      { description: 'Get recipes sorted by difficulty', input: { sortBy: 'difficulty' } }
    ]
  },
  'get_recipes_by_category': {
    name: 'get_recipes_by_category',
    description: 'Filter recipes by category (水产, 早餐, 调味料, 甜品, 饮品, 荤菜, 半成品, 汤羹, 主食, 素菜)',
    category: 'Recipe Management',
    examples: [
      { description: 'Get all meat dishes', input: { category: '荤菜' } },
      { description: 'Get vegetarian recipes with stats', input: { category: '素菜', includeStats: true } }
    ]
  },
  'get_recipe_details': {
    name: 'get_recipe_details',
    description: 'Get complete recipe information including ingredients, steps, and nutritional data',
    category: 'Recipe Management',
    examples: [
      { description: 'Get recipe by ID', input: { identifier: 'recipe_001' } },
      { description: 'Scale recipe for 6 people', input: { identifier: 'recipe_001', scaleServings: 6 } }
    ]
  },
  'recommend_meal_plan': {
    name: 'recommend_meal_plan',
    description: 'Generate intelligent weekly meal plans with shopping lists',
    category: 'Meal Planning',
    examples: [
      { description: 'Basic meal plan for 4 people', input: { preferences: { numberOfPeople: 4 } } },
      { description: 'Vegetarian meal plan', input: { preferences: { numberOfPeople: 2, dietaryRestrictions: ['素食'] } } }
    ]
  },
  'recommend_dish_combination': {
    name: 'recommend_dish_combination',
    description: 'Suggest balanced dish combinations for meals',
    category: 'Meal Planning',
    examples: [
      { description: 'Dinner for 6 people', input: { preferences: { numberOfPeople: 6, occasion: '聚餐' } } },
      { description: 'Quick meal combination', input: { preferences: { numberOfPeople: 2, cookingTime: '1小时' } } }
    ]
  }
};

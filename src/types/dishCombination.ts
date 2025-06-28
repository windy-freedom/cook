import { z } from 'zod';
import { Recipe } from './recipe.js';

// Meal combination types
export const CombinationType = z.enum([
  '家常搭配', // home-style combination
  '宴客搭配', // entertaining guests
  '节日搭配', // holiday combination
  '快手搭配', // quick meal combination
  '营养搭配', // nutritional combination
  '季节搭配', // seasonal combination
]);

export type CombinationType = z.infer<typeof CombinationType>;

// Dish role in a meal
export const DishRole = z.enum([
  '主菜', // main dish
  '配菜', // side dish
  '汤品', // soup
  '主食', // staple
  '开胃菜', // appetizer
  '甜品', // dessert
]);

export type DishRole = z.infer<typeof DishRole>;

// Combination preferences
export const CombinationPreferences = z.object({
  numberOfPeople: z.number().min(1).describe('Number of diners'),
  occasion: z.enum(['日常', '聚餐', '节日', '招待客人', '特殊场合']).optional().describe('Dining occasion'),
  budgetLevel: z.enum(['经济', '中等', '高档']).optional().describe('Budget preference'),
  dietaryRestrictions: z.array(z.string()).optional().describe('Dietary restrictions'),
  preferredFlavors: z.array(z.string()).optional().describe('Preferred flavor profiles'),
  cookingTime: z.string().optional().describe('Available cooking time'),
  skillLevel: z.enum(['初学者', '中级', '高级']).optional().describe('Cooking skill level'),
  seasonalPreference: z.boolean().optional().describe('Prefer seasonal ingredients'),
  nutritionalBalance: z.boolean().optional().describe('Focus on nutritional balance'),
});

export type CombinationPreferences = z.infer<typeof CombinationPreferences>;

// Recommended dish in a combination
export const RecommendedDish = z.object({
  recipe: Recipe.describe('The recommended recipe'),
  role: DishRole.describe('Role of this dish in the meal'),
  priority: z.enum(['必选', '推荐', '可选']).describe('Priority level of this dish'),
  reason: z.string().describe('Reason for recommending this dish'),
  preparationOrder: z.number().describe('Suggested preparation order (1 = prepare first)'),
  servingOrder: z.number().describe('Suggested serving order (1 = serve first)'),
});

export type RecommendedDish = z.infer<typeof RecommendedDish>;

// Dish combination recommendation
export const DishCombination = z.object({
  id: z.string().describe('Unique combination identifier'),
  name: z.string().describe('Name of the combination'),
  description: z.string().describe('Description of the combination'),
  type: CombinationType.describe('Type of combination'),
  dishes: z.array(RecommendedDish).describe('Recommended dishes in this combination'),
  totalPrepTime: z.string().describe('Total preparation time'),
  totalCookTime: z.string().describe('Total cooking time'),
  difficulty: z.enum(['简单', '中等', '困难']).describe('Overall difficulty level'),
  servings: z.number().describe('Number of people this combination serves'),
  nutritionalBalance: z.object({
    hasProtein: z.boolean().describe('Contains adequate protein'),
    hasVegetables: z.boolean().describe('Contains vegetables'),
    hasCarbs: z.boolean().describe('Contains carbohydrates'),
    isBalanced: z.boolean().describe('Overall nutritional balance'),
  }).describe('Nutritional balance analysis'),
  flavorProfile: z.array(z.string()).describe('Flavor characteristics of the combination'),
  cookingTips: z.array(z.string()).optional().describe('Tips for preparing this combination'),
  alternatives: z.array(z.string()).optional().describe('Alternative dishes that can be substituted'),
  estimatedCost: z.string().optional().describe('Estimated cost range'),
  createdAt: z.string().describe('Creation timestamp'),
});

export type DishCombination = z.infer<typeof DishCombination>;

// Combination request
export const CombinationRequest = z.object({
  preferences: CombinationPreferences.describe('User preferences for dish combination'),
  excludeRecipeIds: z.array(z.string()).optional().describe('Recipe IDs to exclude from recommendations'),
  includeRecipeIds: z.array(z.string()).optional().describe('Recipe IDs that must be included'),
  maxDishes: z.number().optional().default(6).describe('Maximum number of dishes in combination'),
  minDishes: z.number().optional().default(3).describe('Minimum number of dishes in combination'),
});

export type CombinationRequest = z.infer<typeof CombinationRequest>;

// Combination analysis
export const CombinationAnalysis = z.object({
  nutritionalScore: z.number().min(0).max(10).describe('Nutritional balance score (0-10)'),
  flavorHarmony: z.number().min(0).max(10).describe('Flavor harmony score (0-10)'),
  difficultyBalance: z.number().min(0).max(10).describe('Cooking difficulty balance score (0-10)'),
  timeEfficiency: z.number().min(0).max(10).describe('Time efficiency score (0-10)'),
  overallScore: z.number().min(0).max(10).describe('Overall combination score (0-10)'),
  strengths: z.array(z.string()).describe('Strengths of this combination'),
  improvements: z.array(z.string()).describe('Suggested improvements'),
});

export type CombinationAnalysis = z.infer<typeof CombinationAnalysis>;

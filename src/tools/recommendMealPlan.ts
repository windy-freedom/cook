import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { recipeDataManager } from '../data/recipeData.js';
import {
  WeeklyMealPlan,
  MealPlanPreferences,
  type MCPResponse
} from '../types/index.js';
import { generateWeeklyMealPlan, validateMealPlanPreferences, calculateMealPlanStats } from '../utils/mealPlanUtils.js';
import { generateShoppingListFromMealPlan } from '../utils/shoppingListUtils.js';

// Input schema for recommend_meal_plan tool
const RecommendMealPlanInput = z.object({
  preferences: z.object({
    numberOfPeople: z.number().min(1).max(20).describe('Number of people to cook for'),
    dietaryRestrictions: z.array(z.enum(['素食', '纯素食', '无麸质', '低盐', '低糖', '低脂', '高蛋白', '无坚果', '无海鲜', '无乳制品'])).optional().describe('Dietary restrictions to consider'),
    allergies: z.array(z.string()).optional().describe('Specific food allergies'),
    preferredCategories: z.array(z.string()).optional().describe('Preferred recipe categories'),
    excludedCategories: z.array(z.string()).optional().describe('Categories to exclude'),
    budgetLevel: z.enum(['经济', '中等', '高档']).optional().describe('Budget preference'),
    cookingSkillLevel: z.enum(['初学者', '中级', '高级']).optional().describe('Cooking skill level'),
    timeConstraints: z.object({
      maxPrepTime: z.string().optional().describe('Maximum prep time per meal'),
      maxCookTime: z.string().optional().describe('Maximum cooking time per meal'),
    }).optional(),
    nutritionalGoals: z.object({
      targetCalories: z.number().optional().describe('Target calories per day'),
      highProtein: z.boolean().optional().describe('Focus on high protein meals'),
      lowCarb: z.boolean().optional().describe('Focus on low carb meals'),
      balanced: z.boolean().optional().describe('Focus on balanced nutrition'),
    }).optional(),
  }).describe('User preferences for meal planning'),
  startDate: z.string().optional().describe('Start date for the meal plan (YYYY-MM-DD format, defaults to next Monday)'),
  planDuration: z.number().min(1).max(14).default(7).optional().describe('Number of days to plan (default: 7)'),
  includeShoppingList: z.boolean().default(true).optional().describe('Whether to generate a shopping list'),
  consolidateIngredients: z.boolean().default(true).optional().describe('Whether to consolidate duplicate ingredients in shopping list')
});

type RecommendMealPlanInput = z.infer<typeof RecommendMealPlanInput>;

// Response type for meal plan recommendation
const MealPlanResponse = z.object({
  mealPlan: z.any().describe('The generated weekly meal plan'),
  shoppingList: z.any().optional().describe('Generated shopping list if requested'),
  statistics: z.object({
    totalRecipes: z.number().describe('Total number of recipes in the plan'),
    uniqueRecipes: z.number().describe('Number of unique recipes'),
    categoriesUsed: z.array(z.string()).describe('Recipe categories used in the plan'),
    averageCaloriesPerDay: z.number().describe('Average calories per day'),
    totalEstimatedCookTime: z.number().describe('Total estimated cooking time in minutes'),
    budgetEstimate: z.string().describe('Estimated budget range for the meal plan')
  }).describe('Meal plan statistics and analysis'),
  recommendations: z.object({
    cookingTips: z.array(z.string()).describe('General cooking tips for the meal plan'),
    prepAdvice: z.array(z.string()).describe('Meal prep advice'),
    substitutions: z.array(z.string()).describe('Possible ingredient substitutions'),
    timeManagement: z.array(z.string()).describe('Time management suggestions')
  }).describe('Additional recommendations and tips')
});

/**
 * Tool definition for recommending meal plans
 */
export const recommendMealPlanTool: Tool = {
  name: 'recommend_meal_plan',
  description: 'Generate intelligent weekly meal plans based on dietary restrictions, allergies, number of people, cooking skill level, and nutritional goals. Includes automatic shopping list generation with consolidated ingredients. Provides personalized recommendations considering budget, time constraints, and food preferences.',
  inputSchema: {
    type: 'object',
    properties: {
      preferences: {
        type: 'object',
        properties: {
          numberOfPeople: { type: 'number', minimum: 1, maximum: 20 },
          dietaryRestrictions: { type: 'array', items: { type: 'string' } },
          allergies: { type: 'array', items: { type: 'string' } },
          preferredCategories: { type: 'array', items: { type: 'string' } },
          excludedCategories: { type: 'array', items: { type: 'string' } },
          budgetLevel: { type: 'string', enum: ['经济', '中等', '高档'] },
          cookingSkillLevel: { type: 'string', enum: ['初学者', '中级', '高级'] }
        },
        required: ['numberOfPeople']
      },
      startDate: { type: 'string' },
      planDuration: { type: 'number', minimum: 1, maximum: 14, default: 7 },
      includeShoppingList: { type: 'boolean', default: true },
      consolidateIngredients: { type: 'boolean', default: true }
    },
    required: ['preferences']
  }
};

/**
 * Handler for recommend_meal_plan tool
 */
export async function handleRecommendMealPlan(input: RecommendMealPlanInput): Promise<MCPResponse<z.infer<typeof MealPlanResponse>>> {
  try {
    // Validate input
    const validatedInput = RecommendMealPlanInput.parse(input);
    const { preferences, startDate, planDuration = 7, includeShoppingList = true, consolidateIngredients = true } = validatedInput;

    // Validate meal plan preferences
    const validation = validateMealPlanPreferences(preferences);
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Invalid meal plan preferences',
        details: validation.errors.join(', ')
      };
    }

    // Get all available recipes
    const allRecipes = recipeDataManager.getAllRecipes();
    
    if (allRecipes.length === 0) {
      return {
        success: false,
        error: 'No recipes available',
        details: 'Recipe database is empty'
      };
    }

    // Generate meal plan
    const mealPlan = generateWeeklyMealPlan(allRecipes, preferences, startDate);
    
    // Calculate statistics
    const statistics = calculateMealPlanStats(mealPlan);
    
    // Add budget estimate
    const budgetEstimate = estimateMealPlanBudget(mealPlan, preferences.budgetLevel);

    // Prepare response
    const response: z.infer<typeof MealPlanResponse> = {
      mealPlan,
      statistics: {
        ...statistics,
        budgetEstimate
      },
      recommendations: generateMealPlanRecommendations(mealPlan, preferences)
    };

    // Generate shopping list if requested
    if (includeShoppingList) {
      const shoppingListRequest = {
        numberOfPeople: preferences.numberOfPeople,
        consolidateItems: consolidateIngredients,
        includePriceEstimates: preferences.budgetLevel !== undefined
      };
      
      response.shoppingList = generateShoppingListFromMealPlan(mealPlan, shoppingListRequest);
    }

    return {
      success: true,
      message: `Generated ${planDuration}-day meal plan for ${preferences.numberOfPeople} people with ${statistics.totalRecipes} meals`,
      data: response
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate meal plan',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Estimate meal plan budget
 */
function estimateMealPlanBudget(mealPlan: WeeklyMealPlan, budgetLevel?: string): string {
  const totalMeals = mealPlan.dailyPlans.reduce((sum, day) => sum + day.meals.length, 0);
  const numberOfPeople = mealPlan.preferences.numberOfPeople;

  // Base cost per meal per person
  const baseCosts = {
    '经济': 8,
    '中等': 15,
    '高档': 25
  };

  const baseCost = baseCosts[budgetLevel as keyof typeof baseCosts] || baseCosts['中等'];
  const totalEstimate = totalMeals * numberOfPeople * baseCost;

  const weeklyEstimate = Math.round(totalEstimate * 0.85); // 15% discount for bulk planning

  return `${weeklyEstimate - 50}-${weeklyEstimate + 50}元/周`;
}

/**
 * Generate meal plan recommendations
 */
function generateMealPlanRecommendations(_mealPlan: WeeklyMealPlan, preferences: MealPlanPreferences): {
  cookingTips: string[];
  prepAdvice: string[];
  substitutions: string[];
  timeManagement: string[];
} {
  const cookingTips = [
    '建议提前一天准备第二天的食材，提高烹饪效率',
    '可以批量处理相同的食材，如一次性切好几天的蔬菜',
    '善用调料搭配，同样的食材可以做出不同口味'
  ];

  const prepAdvice = [
    '周末可以提前准备一些半成品，工作日快速完成',
    '汤类可以一次多做一些，分几餐食用',
    '干货类食材建议提前浸泡处理'
  ];

  const substitutions = [
    '如果某种蔬菜买不到，可以用同类蔬菜替代',
    '肉类可以根据价格和喜好灵活调整',
    '调料不足时可以用基础调料组合替代'
  ];

  const timeManagement = [
    '建议按照烹饪时间长短安排制作顺序',
    '可以同时进行多道菜的准备工作',
    '利用等待时间处理其他食材'
  ];

  // Add skill-level specific tips
  if (preferences.cookingSkillLevel === '初学者') {
    cookingTips.push('建议从简单菜品开始，逐步提高难度');
    timeManagement.push('初期可以专注做好一道菜，熟练后再同时制作多道');
  }

  return {
    cookingTips,
    prepAdvice,
    substitutions,
    timeManagement
  };
}

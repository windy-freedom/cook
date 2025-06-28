import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { recipeDataManager } from '../data/recipeData.js';
import {
  DishCombination,
  CombinationRequest,
  CombinationAnalysis,
  type MCPResponse
} from '../types/index.js';
import { generateDishCombination } from '../utils/dishCombinationUtils.js';

// Input schema for recommend_dish_combination tool
const RecommendDishCombinationInput = z.object({
  preferences: z.object({
    numberOfPeople: z.number().min(1).max(20).describe('Number of diners'),
    occasion: z.enum(['日常', '聚餐', '节日', '招待客人', '特殊场合']).optional().describe('Dining occasion'),
    budgetLevel: z.enum(['经济', '中等', '高档']).optional().describe('Budget preference'),
    dietaryRestrictions: z.array(z.string()).optional().describe('Dietary restrictions'),
    preferredFlavors: z.array(z.string()).optional().describe('Preferred flavor profiles (酸甜苦辣咸鲜香)'),
    cookingTime: z.string().optional().describe('Available cooking time (e.g., "2小时")'),
    skillLevel: z.enum(['初学者', '中级', '高级']).optional().describe('Cooking skill level'),
    seasonalPreference: z.boolean().optional().describe('Prefer seasonal ingredients'),
    nutritionalBalance: z.boolean().optional().describe('Focus on nutritional balance'),
  }).describe('User preferences for dish combination'),
  excludeRecipeIds: z.array(z.string()).optional().describe('Recipe IDs to exclude from recommendations'),
  includeRecipeIds: z.array(z.string()).optional().describe('Recipe IDs that must be included'),
  maxDishes: z.number().min(2).max(10).default(6).optional().describe('Maximum number of dishes in combination'),
  minDishes: z.number().min(2).max(8).default(3).optional().describe('Minimum number of dishes in combination'),
  includeAnalysis: z.boolean().default(true).optional().describe('Whether to include detailed combination analysis'),
  includeAlternatives: z.boolean().default(true).optional().describe('Whether to suggest alternative combinations')
});

type RecommendDishCombinationInput = z.infer<typeof RecommendDishCombinationInput>;

// Response type for dish combination recommendation
const DishCombinationResponse = z.object({
  combination: z.any().describe('The recommended dish combination'),
  analysis: z.object({
    nutritionalScore: z.number().min(0).max(10).describe('Nutritional balance score (0-10)'),
    flavorHarmony: z.number().min(0).max(10).describe('Flavor harmony score (0-10)'),
    difficultyBalance: z.number().min(0).max(10).describe('Cooking difficulty balance score (0-10)'),
    timeEfficiency: z.number().min(0).max(10).describe('Time efficiency score (0-10)'),
    overallScore: z.number().min(0).max(10).describe('Overall combination score (0-10)'),
    strengths: z.array(z.string()).describe('Strengths of this combination'),
    improvements: z.array(z.string()).describe('Suggested improvements')
  }).optional().describe('Detailed analysis of the combination'),
  alternatives: z.array(z.object({
    name: z.string().describe('Alternative combination name'),
    description: z.string().describe('Brief description'),
    keyDifferences: z.array(z.string()).describe('Key differences from main recommendation')
  })).optional().describe('Alternative combination suggestions'),
  cookingPlan: z.object({
    preparationOrder: z.array(z.string()).describe('Suggested order of preparation'),
    timelineEstimate: z.string().describe('Estimated total cooking timeline'),
    parallelTasks: z.array(z.string()).describe('Tasks that can be done in parallel'),
    criticalTiming: z.array(z.string()).describe('Critical timing points to watch')
  }).describe('Detailed cooking plan and timeline')
});

/**
 * Tool definition for recommending dish combinations
 */
export const recommendDishCombinationTool: Tool = {
  name: 'recommend_dish_combination',
  description: 'Suggest suitable dish combinations based on number of diners, occasion, dietary restrictions, and cooking preferences. Provides balanced meal combinations with nutritional analysis, flavor harmony assessment, and detailed cooking plans. Considers skill level, time constraints, and budget to create optimal dining experiences.',
  inputSchema: {
    type: 'object',
    properties: {
      preferences: {
        type: 'object',
        properties: {
          numberOfPeople: { type: 'number', minimum: 1, maximum: 20 },
          occasion: { type: 'string', enum: ['日常', '聚餐', '节日', '招待客人', '特殊场合'] },
          budgetLevel: { type: 'string', enum: ['经济', '中等', '高档'] },
          dietaryRestrictions: { type: 'array', items: { type: 'string' } },
          cookingTime: { type: 'string' },
          skillLevel: { type: 'string', enum: ['初学者', '中级', '高级'] }
        },
        required: ['numberOfPeople']
      },
      maxDishes: { type: 'number', minimum: 2, maximum: 10, default: 6 },
      minDishes: { type: 'number', minimum: 2, maximum: 8, default: 3 },
      includeAnalysis: { type: 'boolean', default: true }
    },
    required: ['preferences']
  }
};

/**
 * Handler for recommend_dish_combination tool
 */
export async function handleRecommendDishCombination(input: RecommendDishCombinationInput): Promise<MCPResponse<z.infer<typeof DishCombinationResponse>>> {
  try {
    // Validate input
    const validatedInput = RecommendDishCombinationInput.parse(input);
    const { 
      preferences, 
      excludeRecipeIds, 
      includeRecipeIds, 
      maxDishes = 6, 
      minDishes = 3,
      includeAnalysis = true,
      includeAlternatives = true
    } = validatedInput;

    // Validate dish count constraints
    if (minDishes > maxDishes) {
      return {
        success: false,
        error: 'Invalid dish count constraints',
        details: 'Minimum dishes cannot be greater than maximum dishes'
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

    // Create combination request
    const combinationRequest: CombinationRequest = {
      preferences,
      excludeRecipeIds,
      includeRecipeIds,
      maxDishes,
      minDishes
    };

    // Generate dish combination
    const combination = generateDishCombination(allRecipes, combinationRequest);
    
    // Prepare response
    const response: z.infer<typeof DishCombinationResponse> = {
      combination,
      cookingPlan: generateCookingPlan(combination)
    };

    // Add analysis if requested
    if (includeAnalysis) {
      response.analysis = analyzeCombination(combination);
    }

    // Add alternatives if requested
    if (includeAlternatives) {
      response.alternatives = generateAlternativeCombinations(allRecipes, combinationRequest, combination);
    }

    return {
      success: true,
      message: `Generated ${combination.dishes.length}-dish combination for ${preferences.numberOfPeople} people`,
      data: response
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate dish combination',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate detailed cooking plan
 */
function generateCookingPlan(combination: DishCombination): {
  preparationOrder: string[];
  timelineEstimate: string;
  parallelTasks: string[];
  criticalTiming: string[];
} {
  // Sort dishes by preparation order
  const sortedDishes = [...combination.dishes].sort((a, b) => a.preparationOrder - b.preparationOrder);

  const preparationOrder = sortedDishes.map(dish =>
    `${dish.preparationOrder}. ${dish.recipe.name} (${dish.role})`
  );

  // Calculate timeline
  const totalPrepTime = parseTimeInMinutes(combination.totalPrepTime);
  const totalCookTime = parseTimeInMinutes(combination.totalCookTime);
  const timelineEstimate = `总计约${formatTimeFromMinutes(totalPrepTime + totalCookTime)}，其中准备${combination.totalPrepTime}，烹饪${combination.totalCookTime}`;

  // Generate parallel tasks
  const parallelTasks = [
    '可以同时处理多种蔬菜的清洗和切配',
    '汤类可以先开始炖煮，同时准备其他菜品',
    '利用蒸煮时间处理其他食材'
  ];

  // Generate critical timing points
  const criticalTiming = [
    '注意掌握各道菜的最佳出锅时间',
    '热菜要最后制作，确保上桌时的温度',
    '汤品可以提前完成，保温即可'
  ];

  // Add specific timing based on dishes
  const hasStirFry = sortedDishes.some(dish =>
    dish.recipe.cookingMethods?.includes('炒')
  );
  if (hasStirFry) {
    criticalTiming.push('炒菜要大火快炒，掌握好火候');
  }

  const hasSoup = sortedDishes.some(dish => dish.role === '汤品');
  if (hasSoup) {
    parallelTasks.push('汤品可以最先开始制作，慢炖出味');
  }

  return {
    preparationOrder,
    timelineEstimate,
    parallelTasks,
    criticalTiming
  };
}

/**
 * Analyze combination quality
 */
function analyzeCombination(combination: DishCombination): CombinationAnalysis {
  const { dishes, nutritionalBalance, flavorProfile } = combination;

  // Calculate nutritional score
  let nutritionalScore = 0;
  if (nutritionalBalance.hasProtein) nutritionalScore += 3;
  if (nutritionalBalance.hasVegetables) nutritionalScore += 3;
  if (nutritionalBalance.hasCarbs) nutritionalScore += 2;
  if (nutritionalBalance.isBalanced) nutritionalScore += 2;

  // Calculate flavor harmony (based on variety and balance)
  const flavorHarmony = Math.min(10, flavorProfile.length * 2);

  // Calculate difficulty balance
  const difficulties = dishes.map(d => d.recipe.difficulty);
  const difficultyVariety = new Set(difficulties).size;
  const difficultyBalance = Math.max(1, 11 - difficultyVariety * 2);

  // Calculate time efficiency
  const avgCookTime = dishes.reduce((sum, dish) =>
    sum + parseTimeInMinutes(dish.recipe.cookTime), 0
  ) / dishes.length;
  const timeEfficiency = Math.max(1, Math.min(10, 10 - avgCookTime / 10));

  // Overall score
  const overallScore = Math.round(
    (nutritionalScore + flavorHarmony + difficultyBalance + timeEfficiency) / 4
  );

  // Generate strengths and improvements
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (nutritionalBalance.isBalanced) {
    strengths.push('营养搭配均衡，包含蛋白质、蔬菜和主食');
  } else {
    improvements.push('建议增加缺失的营养成分以达到更好的平衡');
  }

  if (flavorProfile.length >= 3) {
    strengths.push('口味丰富多样，层次分明');
  } else {
    improvements.push('可以考虑增加不同口味的菜品以丰富整体体验');
  }

  if (difficultyVariety <= 2) {
    strengths.push('制作难度适中，便于掌控');
  }

  return {
    nutritionalScore,
    flavorHarmony,
    difficultyBalance,
    timeEfficiency,
    overallScore,
    strengths,
    improvements
  };
}

/**
 * Generate alternative combinations
 */
function generateAlternativeCombinations(
  _allRecipes: any[],
  originalRequest: CombinationRequest,
  _originalCombination: DishCombination
): Array<{
  name: string;
  description: string;
  keyDifferences: string[];
}> {
  const alternatives = [];

  // Budget-conscious alternative
  if (originalRequest.preferences.budgetLevel !== '经济') {
    alternatives.push({
      name: '经济实惠版',
      description: '使用更经济的食材，保持营养和口味平衡',
      keyDifferences: ['选用价格更亲民的食材', '简化部分制作工艺', '保持营养均衡']
    });
  }

  // Quick version
  alternatives.push({
    name: '快手版',
    description: '缩短制作时间，适合忙碌时准备',
    keyDifferences: ['选择制作时间更短的菜品', '简化准备步骤', '保持口味丰富']
  });

  // Seasonal alternative
  alternatives.push({
    name: '时令版',
    description: '根据当季食材调整搭配',
    keyDifferences: ['使用当季新鲜食材', '调整菜品组合', '突出季节特色']
  });

  return alternatives.slice(0, 3);
}

// Helper functions
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

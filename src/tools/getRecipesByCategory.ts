import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { recipeDataManager } from '../data/recipeData.js';
import { Recipe, RecipeCategory, type MCPResponse } from '../types/index.js';

// Input schema for get_recipes_by_category tool
const GetRecipesByCategoryInput = z.object({
  category: RecipeCategory.describe('Recipe category to filter by'),
  limit: z.number().min(1).max(100).default(50).optional().describe('Maximum number of recipes to return'),
  sortBy: z.enum(['name', 'difficulty', 'prepTime', 'cookTime', 'dateAdded']).default('name').optional().describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional().describe('Sort order'),
  includeStats: z.boolean().default(false).optional().describe('Whether to include category statistics')
});

type GetRecipesByCategoryInput = z.infer<typeof GetRecipesByCategoryInput>;

// Response type for category recipes
const CategoryRecipesResponse = z.object({
  category: RecipeCategory.describe('The requested category'),
  recipes: z.array(z.any()).describe('List of recipes in this category'),
  totalCount: z.number().describe('Total number of recipes in this category'),
  statistics: z.object({
    difficultyDistribution: z.record(z.number()).describe('Distribution of recipes by difficulty'),
    averagePrepTime: z.string().describe('Average preparation time'),
    averageCookTime: z.string().describe('Average cooking time'),
    averageServings: z.number().describe('Average number of servings'),
    commonTags: z.array(z.string()).describe('Most common tags in this category')
  }).optional().describe('Category statistics if requested')
});

/**
 * Tool definition for getting recipes by category
 */
export const getRecipesByCategoryTool: Tool = {
  name: 'get_recipes_by_category',
  description: 'Filter and retrieve recipes by category. Categories include: 水产 (seafood), 早餐 (breakfast), 调味料 (seasonings), 甜品 (desserts), 饮品 (beverages), 荤菜 (meat dishes), 半成品 (semi-prepared), 汤羹 (soups), 主食 (staples), 素菜 (vegetarian). Returns recipes with complete details and optional category statistics.',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', enum: ['水产', '早餐', '调味料', '甜品', '饮品', '荤菜', '半成品', '汤羹', '主食', '素菜'] },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
      sortBy: { type: 'string', enum: ['name', 'difficulty', 'prepTime', 'cookTime', 'dateAdded'], default: 'name' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
      includeStats: { type: 'boolean', default: false }
    },
    required: ['category']
  }
};

/**
 * Handler for get_recipes_by_category tool
 */
export async function handleGetRecipesByCategory(input: GetRecipesByCategoryInput): Promise<MCPResponse<z.infer<typeof CategoryRecipesResponse>>> {
  try {
    // Validate input
    const validatedInput = GetRecipesByCategoryInput.parse(input);
    const { category, limit = 50, sortBy = 'name', sortOrder = 'asc', includeStats = false } = validatedInput;

    // Get recipes by category
    let recipes = recipeDataManager.getRecipesByCategory(category);

    // Sort recipes
    recipes = sortRecipes(recipes, sortBy, sortOrder);

    // Apply limit
    const limitedRecipes = recipes.slice(0, limit);

    // Prepare response
    const response: z.infer<typeof CategoryRecipesResponse> = {
      category,
      recipes: limitedRecipes,
      totalCount: recipes.length
    };

    // Add statistics if requested
    if (includeStats && recipes.length > 0) {
      response.statistics = calculateCategoryStatistics(recipes);
    }

    return {
      success: true,
      message: `Found ${limitedRecipes.length} recipes in category "${category}" (showing ${Math.min(limit, recipes.length)} of ${recipes.length})`,
      data: response
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve recipes by category',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Sort recipes by specified field and order
 */
function sortRecipes(recipes: Recipe[], sortBy: string, sortOrder: 'asc' | 'desc'): Recipe[] {
  const sorted = [...recipes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'zh-CN');
        break;
      case 'difficulty':
        const difficultyOrder = { '简单': 1, '中等': 2, '困难': 3 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        break;
      case 'prepTime':
        comparison = parseTimeInMinutes(a.prepTime) - parseTimeInMinutes(b.prepTime);
        break;
      case 'cookTime':
        comparison = parseTimeInMinutes(a.cookTime) - parseTimeInMinutes(b.cookTime);
        break;
      case 'dateAdded':
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
      default:
        comparison = a.name.localeCompare(b.name, 'zh-CN');
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Calculate statistics for a category
 */
function calculateCategoryStatistics(recipes: Recipe[]): {
  difficultyDistribution: Record<string, number>;
  averagePrepTime: string;
  averageCookTime: string;
  averageServings: number;
  commonTags: string[];
} {
  // Difficulty distribution
  const difficultyDistribution: Record<string, number> = {
    '简单': 0,
    '中等': 0,
    '困难': 0
  };

  let totalPrepTime = 0;
  let totalCookTime = 0;
  let totalServings = 0;
  const tagCounts: Record<string, number> = {};

  recipes.forEach(recipe => {
    // Count difficulties
    if (recipe.difficulty && recipe.difficulty in difficultyDistribution) {
      (difficultyDistribution as any)[recipe.difficulty]++;
    }

    // Sum times and servings
    totalPrepTime += parseTimeInMinutes(recipe.prepTime);
    totalCookTime += parseTimeInMinutes(recipe.cookTime);
    totalServings += recipe.servings;

    // Count tags
    if (recipe.tags) {
      recipe.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Calculate averages
  const averagePrepTime = formatTimeFromMinutes(Math.round(totalPrepTime / recipes.length));
  const averageCookTime = formatTimeFromMinutes(Math.round(totalCookTime / recipes.length));
  const averageServings = Math.round((totalServings / recipes.length) * 10) / 10; // Round to 1 decimal

  // Get most common tags (top 5)
  const commonTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    difficultyDistribution,
    averagePrepTime,
    averageCookTime,
    averageServings,
    commonTags
  };
}

/**
 * Parse time string to minutes
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

/**
 * Format minutes to Chinese time string
 */
function formatTimeFromMinutes(minutes: number): string {
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
 * Get available categories with counts
 */
export function getAvailableCategories(): Array<{ category: RecipeCategory; count: number }> {
  const stats = recipeDataManager.getStatistics();
  
  return Object.entries(stats.categoryCounts).map(([category, count]) => ({
    category: category as RecipeCategory,
    count
  }));
}

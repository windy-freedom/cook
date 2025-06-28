import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { recipeDataManager } from '../data/recipeData.js';
import { Recipe, PaginatedResponse, type MCPResponse } from '../types/index.js';

// Input schema for get_all_recipes tool
const GetAllRecipesInput = z.object({
  page: z.number().min(1).default(1).optional().describe('Page number (1-based)'),
  limit: z.number().min(1).max(100).default(20).optional().describe('Number of recipes per page'),
  sortBy: z.enum(['name', 'category', 'difficulty', 'prepTime', 'cookTime', 'dateAdded']).default('name').optional().describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional().describe('Sort order'),
  includeDetails: z.boolean().default(true).optional().describe('Whether to include full recipe details')
});

type GetAllRecipesInput = z.infer<typeof GetAllRecipesInput>;

/**
 * Tool definition for getting all recipes
 */
export const getAllRecipesTool: Tool = {
  name: 'get_all_recipes',
  description: 'Retrieve all available recipes with optional pagination and sorting. Returns a paginated list of recipes with their complete information including ingredients, cooking steps, and nutritional data.',
  inputSchema: {
    type: 'object',
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      sortBy: { type: 'string', enum: ['name', 'category', 'difficulty', 'prepTime', 'cookTime', 'dateAdded'], default: 'name' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
      includeDetails: { type: 'boolean', default: true }
    }
  }
};

/**
 * Handler for get_all_recipes tool
 */
export async function handleGetAllRecipes(input: GetAllRecipesInput): Promise<MCPResponse<PaginatedResponse<Recipe>>> {
  try {
    // Validate input
    const validatedInput = GetAllRecipesInput.parse(input);
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', includeDetails = true } = validatedInput;

    // Get all recipes
    let recipes = recipeDataManager.getAllRecipes();

    // Sort recipes
    recipes = sortRecipes(recipes, sortBy, sortOrder);

    // Calculate pagination
    const totalCount = recipes.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated results
    const paginatedRecipes = recipes.slice(startIndex, endIndex);

    // Optionally filter out detailed information for performance
    const resultRecipes = includeDetails 
      ? paginatedRecipes 
      : paginatedRecipes.map(recipe => ({
          ...recipe,
          steps: [], // Remove detailed steps for summary view
          ingredients: recipe.ingredients.slice(0, 3) // Show only first 3 ingredients
        }));

    const response: PaginatedResponse<Recipe> = {
      items: resultRecipes,
      totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return {
      success: true,
      message: `Retrieved ${resultRecipes.length} recipes (page ${page} of ${totalPages})`,
      data: response
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve recipes',
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
      case 'category':
        comparison = a.category.localeCompare(b.category, 'zh-CN');
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
 * Parse time string to minutes for sorting
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
 * Get recipe statistics for summary
 */
export function getRecipesSummary(): {
  totalRecipes: number;
  categories: string[];
  difficulties: string[];
  averagePrepTime: string;
  averageCookTime: string;
} {
  const stats = recipeDataManager.getStatistics();
  
  return {
    totalRecipes: stats.totalRecipes,
    categories: Object.keys(stats.categoryCounts),
    difficulties: Object.keys(stats.difficultyCounts),
    averagePrepTime: formatTimeFromMinutes(stats.averagePrepTime),
    averageCookTime: formatTimeFromMinutes(stats.averageCookTime)
  };
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

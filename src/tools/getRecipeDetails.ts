import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { recipeDataManager } from '../data/recipeData.js';
import { Recipe, type MCPResponse } from '../types/index.js';

// Input schema for get_recipe_details tool
const GetRecipeDetailsInput = z.object({
  identifier: z.string().describe('Recipe ID or exact recipe name to search for'),
  searchBy: z.enum(['id', 'name']).default('id').optional().describe('Whether to search by ID or name'),
  includeRelated: z.boolean().default(false).optional().describe('Whether to include related recipes from the same category'),
  includeNutrition: z.boolean().default(true).optional().describe('Whether to include detailed nutritional information'),
  scaleServings: z.number().min(1).max(20).optional().describe('Scale recipe ingredients for different number of servings')
});

type GetRecipeDetailsInput = z.infer<typeof GetRecipeDetailsInput>;

// Response type for recipe details
const RecipeDetailsResponse = z.object({
  recipe: z.any().describe('The requested recipe with full details'),
  scaledForServings: z.number().optional().describe('Number of servings the recipe has been scaled for'),
  relatedRecipes: z.array(z.any()).optional().describe('Related recipes from the same category'),
  nutritionalAnalysis: z.object({
    caloriesPerServing: z.number().optional(),
    macronutrients: z.object({
      protein: z.string().optional(),
      carbs: z.string().optional(),
      fat: z.string().optional()
    }).optional(),
    dietaryInfo: z.array(z.string()).optional().describe('Dietary classifications (vegetarian, low-carb, etc.)')
  }).optional().describe('Detailed nutritional analysis'),
  cookingAnalysis: z.object({
    totalActiveTime: z.string().describe('Total active cooking time'),
    difficultyReason: z.string().describe('Explanation of difficulty rating'),
    skillsRequired: z.array(z.string()).describe('Cooking skills required'),
    equipmentNeeded: z.array(z.string()).describe('Kitchen equipment needed')
  }).describe('Cooking analysis and requirements')
});

/**
 * Tool definition for getting recipe details
 */
export const getRecipeDetailsTool: Tool = {
  name: 'get_recipe_details',
  description: 'Retrieve complete recipe information by ID or name, including ingredients, detailed cooking steps, nutritional information, and cooking analysis. Can scale ingredients for different serving sizes and provide related recipe suggestions.',
  inputSchema: {
    type: 'object',
    properties: {
      identifier: { type: 'string' },
      searchBy: { type: 'string', enum: ['id', 'name'], default: 'id' },
      includeRelated: { type: 'boolean', default: false },
      includeNutrition: { type: 'boolean', default: true },
      scaleServings: { type: 'number', minimum: 1, maximum: 20 }
    },
    required: ['identifier']
  }
};

/**
 * Handler for get_recipe_details tool
 */
export async function handleGetRecipeDetails(input: GetRecipeDetailsInput): Promise<MCPResponse<z.infer<typeof RecipeDetailsResponse>>> {
  try {
    // Validate input
    const validatedInput = GetRecipeDetailsInput.parse(input);
    const { identifier, searchBy = 'id', includeRelated = false, includeNutrition = true, scaleServings } = validatedInput;

    // Find the recipe
    let recipe: Recipe | undefined;
    
    if (searchBy === 'id') {
      recipe = recipeDataManager.getRecipeById(identifier);
    } else {
      // Search by name (exact match first, then partial match)
      const allRecipes = recipeDataManager.getAllRecipes();
      recipe = allRecipes.find(r => r.name === identifier) || 
               allRecipes.find(r => r.name.toLowerCase().includes(identifier.toLowerCase()));
    }

    if (!recipe) {
      return {
        success: false,
        error: 'Recipe not found',
        details: `No recipe found with ${searchBy} "${identifier}"`
      };
    }

    // Scale recipe if requested
    let finalRecipe = recipe;
    let scaledForServings: number | undefined;
    
    if (scaleServings && scaleServings !== recipe.servings) {
      finalRecipe = scaleRecipeIngredients(recipe, scaleServings);
      scaledForServings = scaleServings;
    }

    // Prepare response
    const response: z.infer<typeof RecipeDetailsResponse> = {
      recipe: finalRecipe,
      cookingAnalysis: analyzeCookingRequirements(finalRecipe)
    };

    // Add scaled servings info
    if (scaledForServings) {
      response.scaledForServings = scaledForServings;
    }

    // Add related recipes if requested
    if (includeRelated) {
      response.relatedRecipes = getRelatedRecipes(recipe, 3);
    }

    // Add nutritional analysis if requested
    if (includeNutrition) {
      response.nutritionalAnalysis = analyzeNutrition(finalRecipe);
    }

    return {
      success: true,
      message: `Retrieved details for recipe "${finalRecipe.name}"${scaledForServings ? ` (scaled for ${scaledForServings} servings)` : ''}`,
      data: response
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve recipe details',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Scale recipe ingredients for different serving sizes
 */
function scaleRecipeIngredients(recipe: Recipe, targetServings: number): Recipe {
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
 * Scale ingredient amount
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
 * Get related recipes from the same category
 */
function getRelatedRecipes(recipe: Recipe, limit: number): Recipe[] {
  const categoryRecipes = recipeDataManager.getRecipesByCategory(recipe.category);
  
  // Filter out the current recipe and get random related ones
  const otherRecipes = categoryRecipes.filter(r => r.id !== recipe.id);
  
  // Shuffle and take the requested number
  const shuffled = otherRecipes.sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, limit).map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    difficulty: r.difficulty,
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    servings: r.servings
  })) as Recipe[];
}

/**
 * Analyze nutritional information
 */
function analyzeNutrition(recipe: Recipe): {
  caloriesPerServing?: number;
  macronutrients?: {
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  dietaryInfo?: string[];
} {
  const analysis: any = {};

  // Calculate calories per serving
  if (recipe.nutritionalInfo?.calories) {
    analysis.caloriesPerServing = Math.round(recipe.nutritionalInfo.calories / recipe.servings);
  }

  // Add macronutrients if available
  if (recipe.nutritionalInfo) {
    const { protein, carbs, fat } = recipe.nutritionalInfo;
    if (protein || carbs || fat) {
      analysis.macronutrients = { protein, carbs, fat };
    }
  }

  // Determine dietary classifications
  const dietaryInfo: string[] = [];
  
  if (recipe.category === '素菜') {
    dietaryInfo.push('素食友好');
  }
  
  if (recipe.category === '水产') {
    dietaryInfo.push('富含蛋白质');
  }
  
  if (recipe.tags?.includes('清淡')) {
    dietaryInfo.push('清淡饮食');
  }
  
  if (recipe.tags?.includes('营养')) {
    dietaryInfo.push('营养丰富');
  }

  // Check for low cooking time (quick meals)
  const totalTime = parseTimeInMinutes(recipe.prepTime) + parseTimeInMinutes(recipe.cookTime);
  if (totalTime <= 30) {
    dietaryInfo.push('快手菜');
  }

  if (dietaryInfo.length > 0) {
    analysis.dietaryInfo = dietaryInfo;
  }

  return analysis;
}

/**
 * Analyze cooking requirements
 */
function analyzeCookingRequirements(recipe: Recipe): {
  totalActiveTime: string;
  difficultyReason: string;
  skillsRequired: string[];
  equipmentNeeded: string[];
} {
  const prepMinutes = parseTimeInMinutes(recipe.prepTime);
  const cookMinutes = parseTimeInMinutes(recipe.cookTime);
  const totalMinutes = prepMinutes + cookMinutes;

  // Determine skills required based on cooking methods and difficulty
  const skillsRequired: string[] = [];
  
  if (recipe.cookingMethods?.includes('炒')) {
    skillsRequired.push('炒菜技巧');
  }
  if (recipe.cookingMethods?.includes('蒸')) {
    skillsRequired.push('蒸制技巧');
  }
  if (recipe.cookingMethods?.includes('炖')) {
    skillsRequired.push('火候控制');
  }
  if (recipe.difficulty === '困难') {
    skillsRequired.push('高级烹饪技巧');
  }

  // Determine equipment needed
  const equipmentNeeded: string[] = ['基本厨具'];
  
  if (recipe.cookingMethods?.includes('蒸')) {
    equipmentNeeded.push('蒸锅');
  }
  if (recipe.cookingMethods?.includes('烤')) {
    equipmentNeeded.push('烤箱');
  }
  if (recipe.category === '汤羹') {
    equipmentNeeded.push('汤锅');
  }

  // Generate difficulty reason
  let difficultyReason = '';
  switch (recipe.difficulty) {
    case '简单':
      difficultyReason = '制作步骤简单，适合初学者，用料常见易得';
      break;
    case '中等':
      difficultyReason = '需要一定烹饪经验，涉及多个烹饪技巧，时间控制较重要';
      break;
    case '困难':
      difficultyReason = '需要丰富烹饪经验，技巧要求高，时间和火候控制精确';
      break;
  }

  return {
    totalActiveTime: formatTimeFromMinutes(totalMinutes),
    difficultyReason,
    skillsRequired,
    equipmentNeeded
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

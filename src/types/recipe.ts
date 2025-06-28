import { z } from 'zod';

// Recipe categories based on HowToCook structure
export const RecipeCategory = z.enum([
  '水产', // seafood
  '早餐', // breakfast
  '调味料', // seasonings
  '甜品', // desserts
  '饮品', // beverages
  '荤菜', // meat dishes
  '半成品', // semi-prepared
  '汤羹', // soups
  '主食', // staples
  '素菜', // vegetarian
]);

export type RecipeCategory = z.infer<typeof RecipeCategory>;

// Difficulty levels
export const DifficultyLevel = z.enum(['简单', '中等', '困难']);
export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

// Cooking methods
export const CookingMethod = z.enum([
  '炒', '煮', '蒸', '烤', '炸', '焖', '炖', '煎', '拌', '腌', '烧', '卤'
]);
export type CookingMethod = z.infer<typeof CookingMethod>;

// Ingredient schema
export const Ingredient = z.object({
  name: z.string().describe('Ingredient name'),
  amount: z.string().describe('Amount needed (e.g., "200g", "2个", "适量")'),
  notes: z.string().optional().describe('Additional notes about the ingredient'),
});

export type Ingredient = z.infer<typeof Ingredient>;

// Cooking step schema
export const CookingStep = z.object({
  stepNumber: z.number().describe('Step number in sequence'),
  instruction: z.string().describe('Detailed cooking instruction'),
  duration: z.string().optional().describe('Time needed for this step'),
  temperature: z.string().optional().describe('Temperature setting if applicable'),
  tips: z.string().optional().describe('Additional tips for this step'),
});

export type CookingStep = z.infer<typeof CookingStep>;

// Nutritional information
export const NutritionalInfo = z.object({
  calories: z.number().optional().describe('Calories per serving'),
  protein: z.string().optional().describe('Protein content'),
  carbs: z.string().optional().describe('Carbohydrate content'),
  fat: z.string().optional().describe('Fat content'),
  fiber: z.string().optional().describe('Fiber content'),
});

export type NutritionalInfo = z.infer<typeof NutritionalInfo>;

// Main recipe schema
export const Recipe = z.object({
  id: z.string().describe('Unique recipe identifier'),
  name: z.string().describe('Recipe name'),
  description: z.string().optional().describe('Brief description of the dish'),
  category: RecipeCategory.describe('Recipe category'),
  difficulty: DifficultyLevel.describe('Cooking difficulty level'),
  servings: z.number().describe('Number of servings this recipe makes'),
  prepTime: z.string().describe('Preparation time (e.g., "15分钟")'),
  cookTime: z.string().describe('Cooking time (e.g., "30分钟")'),
  totalTime: z.string().describe('Total time needed'),
  ingredients: z.array(Ingredient).describe('List of ingredients needed'),
  steps: z.array(CookingStep).describe('Cooking instructions in order'),
  tags: z.array(z.string()).optional().describe('Additional tags for categorization'),
  cookingMethods: z.array(CookingMethod).optional().describe('Cooking methods used'),
  nutritionalInfo: NutritionalInfo.optional().describe('Nutritional information'),
  tips: z.array(z.string()).optional().describe('General cooking tips'),
  variations: z.array(z.string()).optional().describe('Recipe variations'),
  imageUrl: z.string().optional().describe('URL to recipe image'),
  source: z.string().optional().describe('Recipe source or author'),
  dateAdded: z.string().describe('Date when recipe was added (ISO format)'),
  lastModified: z.string().describe('Last modification date (ISO format)'),
});

export type Recipe = z.infer<typeof Recipe>;

// Recipe collection schema
export const RecipeCollection = z.object({
  recipes: z.array(Recipe),
  totalCount: z.number(),
  categories: z.array(RecipeCategory),
});

export type RecipeCollection = z.infer<typeof RecipeCollection>;

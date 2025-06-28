import { z } from 'zod';

// Shopping list item categories
export const ShoppingCategory = z.enum([
  '蔬菜', // vegetables
  '水果', // fruits
  '肉类', // meat
  '海鲜', // seafood
  '蛋奶', // eggs and dairy
  '调料', // seasonings
  '主食', // staples
  '零食', // snacks
  '饮品', // beverages
  '冷冻食品', // frozen foods
  '罐头', // canned goods
  '其他', // others
]);

export type ShoppingCategory = z.infer<typeof ShoppingCategory>;

// Individual shopping list item
export const ShoppingItem = z.object({
  id: z.string().describe('Unique item identifier'),
  name: z.string().describe('Item name'),
  category: ShoppingCategory.describe('Item category'),
  quantity: z.string().describe('Quantity needed (e.g., "500g", "3个", "1瓶")'),
  unit: z.string().optional().describe('Unit of measurement'),
  estimatedPrice: z.number().optional().describe('Estimated price in yuan'),
  priority: z.enum(['高', '中', '低']).optional().default('中').describe('Shopping priority'),
  notes: z.string().optional().describe('Additional notes about the item'),
  recipeIds: z.array(z.string()).describe('Recipe IDs that require this ingredient'),
  recipeNames: z.array(z.string()).describe('Recipe names that require this ingredient'),
  isPurchased: z.boolean().default(false).describe('Whether the item has been purchased'),
  alternatives: z.array(z.string()).optional().describe('Alternative ingredients that can be substituted'),
});

export type ShoppingItem = z.infer<typeof ShoppingItem>;

// Shopping list section by category
export const ShoppingSection = z.object({
  category: ShoppingCategory.describe('Category name'),
  items: z.array(ShoppingItem).describe('Items in this category'),
  totalEstimatedCost: z.number().optional().describe('Total estimated cost for this category'),
});

export type ShoppingSection = z.infer<typeof ShoppingSection>;

// Complete shopping list
export const ShoppingList = z.object({
  id: z.string().describe('Unique shopping list identifier'),
  name: z.string().describe('Shopping list name'),
  description: z.string().optional().describe('Description of the shopping list'),
  mealPlanId: z.string().optional().describe('Associated meal plan ID if applicable'),
  sections: z.array(ShoppingSection).describe('Shopping sections organized by category'),
  totalItems: z.number().describe('Total number of items'),
  totalEstimatedCost: z.number().optional().describe('Total estimated cost'),
  createdAt: z.string().describe('Creation timestamp'),
  lastModified: z.string().describe('Last modification timestamp'),
  completedAt: z.string().optional().describe('Completion timestamp if shopping is done'),
  notes: z.string().optional().describe('General notes for the shopping trip'),
});

export type ShoppingList = z.infer<typeof ShoppingList>;

// Shopping list generation request
export const ShoppingListRequest = z.object({
  recipeIds: z.array(z.string()).optional().describe('Specific recipe IDs to generate shopping list for'),
  mealPlanId: z.string().optional().describe('Meal plan ID to generate shopping list for'),
  numberOfPeople: z.number().min(1).describe('Number of people to shop for'),
  consolidateItems: z.boolean().optional().default(true).describe('Whether to consolidate duplicate items'),
  includePriceEstimates: z.boolean().optional().default(false).describe('Whether to include price estimates'),
  excludeCategories: z.array(ShoppingCategory).optional().describe('Categories to exclude from the list'),
});

export type ShoppingListRequest = z.infer<typeof ShoppingListRequest>;

// Shopping list summary
export const ShoppingListSummary = z.object({
  totalItems: z.number().describe('Total number of items'),
  completedItems: z.number().describe('Number of completed items'),
  totalEstimatedCost: z.number().optional().describe('Total estimated cost'),
  categoriesCount: z.number().describe('Number of different categories'),
  highPriorityItems: z.number().describe('Number of high priority items'),
});

export type ShoppingListSummary = z.infer<typeof ShoppingListSummary>;

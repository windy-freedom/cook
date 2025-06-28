import { 
  Recipe, 
  ShoppingList, 
  ShoppingItem, 
  ShoppingSection, 
  ShoppingCategory,
  ShoppingListRequest,
  WeeklyMealPlan 
} from '../types/index.js';

/**
 * Generate shopping list from recipes
 */
export function generateShoppingListFromRecipes(
  recipes: Recipe[], 
  request: ShoppingListRequest
): ShoppingList {
  const consolidatedItems = consolidateIngredients(recipes, request.numberOfPeople, request.consolidateItems);
  const sections = groupItemsByCategory(consolidatedItems);
  
  // Filter out excluded categories
  const filteredSections = request.excludeCategories 
    ? sections.filter(section => !request.excludeCategories!.includes(section.category))
    : sections;
  
  const totalItems = filteredSections.reduce((sum, section) => sum + section.items.length, 0);
  const totalEstimatedCost = request.includePriceEstimates 
    ? calculateTotalCost(filteredSections)
    : undefined;
  
  return {
    id: generateShoppingListId(),
    name: `购物清单 - ${new Date().toLocaleDateString('zh-CN')}`,
    description: `为 ${request.numberOfPeople} 人准备的食材清单`,
    sections: filteredSections,
    totalItems,
    totalEstimatedCost,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    notes: '请根据实际需要调整购买数量'
  };
}

/**
 * Generate shopping list from meal plan
 */
export function generateShoppingListFromMealPlan(
  mealPlan: WeeklyMealPlan,
  request: Omit<ShoppingListRequest, 'recipeIds'>
): ShoppingList {
  const allRecipes = mealPlan.dailyPlans.flatMap(day => 
    day.meals.map(meal => meal.recipe)
  );
  
  return generateShoppingListFromRecipes(allRecipes, {
    ...request,
    mealPlanId: mealPlan.id
  });
}

/**
 * Consolidate ingredients from multiple recipes
 */
function consolidateIngredients(
  recipes: Recipe[], 
  numberOfPeople: number, 
  shouldConsolidate: boolean = true
): ShoppingItem[] {
  const ingredientMap = new Map<string, ShoppingItem>();
  
  recipes.forEach(recipe => {
    const scaleFactor = numberOfPeople / recipe.servings;
    
    recipe.ingredients.forEach(ingredient => {
      const scaledAmount = scaleIngredientAmount(ingredient.amount, scaleFactor);
      const category = categorizeIngredient(ingredient.name);
      
      const key = shouldConsolidate ? ingredient.name : `${ingredient.name}_${recipe.id}`;
      
      if (ingredientMap.has(key)) {
        const existingItem = ingredientMap.get(key)!;
        existingItem.quantity = shouldConsolidate 
          ? combineQuantities(existingItem.quantity, scaledAmount)
          : scaledAmount;
        existingItem.recipeIds.push(recipe.id);
        existingItem.recipeNames.push(recipe.name);
      } else {
        const shoppingItem: ShoppingItem = {
          id: generateItemId(),
          name: ingredient.name,
          category,
          quantity: scaledAmount,
          estimatedPrice: estimatePrice(ingredient.name, category),
          priority: determinePriority(ingredient.name, category),
          notes: ingredient.notes,
          recipeIds: [recipe.id],
          recipeNames: [recipe.name],
          isPurchased: false,
          alternatives: getAlternatives(ingredient.name)
        };
        
        ingredientMap.set(key, shoppingItem);
      }
    });
  });
  
  return Array.from(ingredientMap.values());
}

/**
 * Group shopping items by category
 */
function groupItemsByCategory(items: ShoppingItem[]): ShoppingSection[] {
  const categoryMap = new Map<ShoppingCategory, ShoppingItem[]>();
  
  items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, []);
    }
    categoryMap.get(item.category)!.push(item);
  });
  
  const sections: ShoppingSection[] = [];
  
  categoryMap.forEach((items, category) => {
    const totalEstimatedCost = items.reduce((sum, item) => 
      sum + (item.estimatedPrice || 0), 0
    );
    
    sections.push({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
      totalEstimatedCost
    });
  });
  
  // Sort sections by category priority
  const categoryOrder: ShoppingCategory[] = [
    '蔬菜', '水果', '肉类', '海鲜', '蛋奶', '主食', '调料', '冷冻食品', '罐头', '饮品', '零食', '其他'
  ];
  
  return sections.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);
    return aIndex - bIndex;
  });
}

/**
 * Categorize ingredient by name
 */
function categorizeIngredient(ingredientName: string): ShoppingCategory {
  const categoryKeywords: Record<ShoppingCategory, string[]> = {
    '蔬菜': ['白菜', '萝卜', '土豆', '番茄', '黄瓜', '茄子', '豆角', '菠菜', '韭菜', '芹菜', '洋葱', '大蒜', '生姜'],
    '水果': ['苹果', '香蕉', '橙子', '梨', '葡萄', '草莓', '西瓜', '柠檬'],
    '肉类': ['猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '排骨', '肉丝', '肉片'],
    '海鲜': ['鱼', '虾', '蟹', '贝', '鱿鱼', '带鱼', '黄鱼', '鲈鱼'],
    '蛋奶': ['鸡蛋', '鸭蛋', '牛奶', '酸奶', '奶酪', '黄油'],
    '主食': ['大米', '面粉', '面条', '馒头', '面包', '土豆'],
    '调料': ['盐', '糖', '醋', '酱油', '料酒', '胡椒', '八角', '桂皮', '花椒', '辣椒'],
    '冷冻食品': ['冷冻', '速冻'],
    '罐头': ['罐装', '罐头'],
    '饮品': ['茶', '咖啡', '果汁', '汽水'],
    '零食': ['饼干', '薯片', '坚果'],
    '其他': []
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => ingredientName.includes(keyword))) {
      return category as ShoppingCategory;
    }
  }
  
  return '其他';
}

/**
 * Scale ingredient amount
 */
function scaleIngredientAmount(amount: string, scaleFactor: number): string {
  const numericMatch = amount.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (numericMatch && numericMatch[1]) {
    const [, numStr, unit] = numericMatch;
    const originalNum = parseFloat(numStr);
    const scaledNum = originalNum * scaleFactor;
    const roundedNum = Math.round(scaledNum * 100) / 100;
    
    return `${roundedNum}${unit}`;
  }
  
  return amount;
}

/**
 * Combine quantities (simplified - assumes same units)
 */
function combineQuantities(qty1: string, qty2: string): string {
  const num1Match = qty1.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const num2Match = qty2.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (num1Match && num2Match && num1Match[1] && num2Match[1] && num1Match[2] === num2Match[2]) {
    const sum = parseFloat(num1Match[1]) + parseFloat(num2Match[1]);
    return `${Math.round(sum * 100) / 100}${num1Match[2]}`;
  }
  
  return `${qty1} + ${qty2}`;
}

/**
 * Estimate price for ingredient
 */
function estimatePrice(_ingredientName: string, category: ShoppingCategory): number | undefined {
  // Simplified price estimation - in real implementation, this could use a price database
  const priceRanges: Record<ShoppingCategory, [number, number]> = {
    '蔬菜': [2, 8],
    '水果': [5, 15],
    '肉类': [15, 40],
    '海鲜': [20, 60],
    '蛋奶': [3, 12],
    '主食': [2, 10],
    '调料': [1, 8],
    '冷冻食品': [8, 25],
    '罐头': [5, 15],
    '饮品': [3, 12],
    '零食': [5, 20],
    '其他': [2, 15]
  };
  
  const [min, max] = priceRanges[category];
  return Math.round((min + max) / 2);
}

/**
 * Determine shopping priority
 */
function determinePriority(ingredientName: string, category: ShoppingCategory): '高' | '中' | '低' {
  const highPriorityItems = ['盐', '油', '米', '面', '蛋', '奶'];
  
  if (highPriorityItems.some(item => ingredientName.includes(item))) {
    return '高';
  }
  
  if (category === '零食' || category === '饮品') {
    return '低';
  }
  
  return '中';
}

/**
 * Get alternative ingredients
 */
function getAlternatives(ingredientName: string): string[] {
  const alternatives: Record<string, string[]> = {
    '猪肉': ['牛肉', '鸡肉'],
    '牛肉': ['猪肉', '羊肉'],
    '鸡肉': ['鸭肉', '猪肉'],
    '白菜': ['菠菜', '小白菜'],
    '土豆': ['红薯', '山药'],
    '番茄': ['西红柿'],
    '生抽': ['老抽', '酱油'],
    '料酒': ['黄酒', '白酒']
  };
  
  return alternatives[ingredientName] || [];
}

/**
 * Calculate total estimated cost
 */
function calculateTotalCost(sections: ShoppingSection[]): number {
  return sections.reduce((total, section) => 
    total + (section.totalEstimatedCost || 0), 0
  );
}

/**
 * Generate shopping list ID
 */
function generateShoppingListId(): string {
  return `shopping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate shopping item ID
 */
function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

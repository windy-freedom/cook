# HowToCook MCP Server Usage Guide

This guide provides detailed examples and best practices for using the HowToCook MCP Server.

## Quick Start

1. **Install and Build**
   ```bash
   npm install
   npm run build
   npm start
   ```

2. **Test Connection**
   The server communicates via stdio. Test with a simple tool list request.

## Tool Reference

### 1. get_all_recipes

Retrieve all recipes with pagination and sorting options.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (name, category, difficulty, prepTime, cookTime, dateAdded)
- `sortOrder` (optional): Sort order (asc, desc)
- `includeDetails` (optional): Include full recipe details (default: true)

**Examples:**

```json
// Get first 10 recipes
{
  "tool": "get_all_recipes",
  "arguments": {
    "limit": 10
  }
}

// Get recipes sorted by difficulty (easiest first)
{
  "tool": "get_all_recipes",
  "arguments": {
    "sortBy": "difficulty",
    "sortOrder": "asc",
    "limit": 20
  }
}

// Get recipe summaries only (faster for large datasets)
{
  "tool": "get_all_recipes",
  "arguments": {
    "includeDetails": false,
    "limit": 50
  }
}
```

### 2. get_recipes_by_category

Filter recipes by specific categories.

**Parameters:**
- `category` (required): Recipe category
- `limit` (optional): Maximum recipes to return (default: 50)
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order
- `includeStats` (optional): Include category statistics

**Valid Categories:**
- 水产 (Seafood)
- 早餐 (Breakfast)
- 调味料 (Seasonings)
- 甜品 (Desserts)
- 饮品 (Beverages)
- 荤菜 (Meat Dishes)
- 半成品 (Semi-prepared)
- 汤羹 (Soups)
- 主食 (Staples)
- 素菜 (Vegetarian)

**Examples:**

```json
// Get all seafood recipes
{
  "tool": "get_recipes_by_category",
  "arguments": {
    "category": "水产"
  }
}

// Get vegetarian recipes with statistics
{
  "tool": "get_recipes_by_category",
  "arguments": {
    "category": "素菜",
    "includeStats": true,
    "sortBy": "prepTime"
  }
}
```

### 3. get_recipe_details

Get complete information for a specific recipe.

**Parameters:**
- `identifier` (required): Recipe ID or name
- `searchBy` (optional): Search method (id, name)
- `includeRelated` (optional): Include related recipes
- `includeNutrition` (optional): Include nutritional analysis
- `scaleServings` (optional): Scale for different serving size

**Examples:**

```json
// Get recipe by ID
{
  "tool": "get_recipe_details",
  "arguments": {
    "identifier": "recipe_001"
  }
}

// Scale recipe for 8 people with related recipes
{
  "tool": "get_recipe_details",
  "arguments": {
    "identifier": "红烧肉",
    "searchBy": "name",
    "scaleServings": 8,
    "includeRelated": true
  }
}
```

### 4. recommend_meal_plan

Generate intelligent weekly meal plans.

**Parameters:**
- `preferences` (required): Meal planning preferences
  - `numberOfPeople` (required): 1-20 people
  - `dietaryRestrictions` (optional): Array of restrictions
  - `allergies` (optional): Specific allergies
  - `cookingSkillLevel` (optional): 初学者, 中级, 高级
  - `budgetLevel` (optional): 经济, 中等, 高档
  - `nutritionalGoals` (optional): Nutrition preferences
- `startDate` (optional): Plan start date (YYYY-MM-DD)
- `includeShoppingList` (optional): Generate shopping list

**Examples:**

```json
// Basic family meal plan
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 4,
      "cookingSkillLevel": "中级",
      "budgetLevel": "中等"
    }
  }
}

// Vegetarian meal plan with nutritional goals
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 2,
      "dietaryRestrictions": ["素食"],
      "nutritionalGoals": {
        "balanced": true,
        "targetCalories": 1800
      }
    },
    "includeShoppingList": true,
    "startDate": "2024-01-15"
  }
}

// Beginner-friendly meal plan
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 1,
      "cookingSkillLevel": "初学者",
      "timeConstraints": {
        "maxPrepTime": "20分钟",
        "maxCookTime": "30分钟"
      }
    }
  }
}
```

### 5. recommend_dish_combination

Suggest balanced dish combinations for meals.

**Parameters:**
- `preferences` (required): Combination preferences
  - `numberOfPeople` (required): Number of diners
  - `occasion` (optional): 日常, 聚餐, 节日, 招待客人, 特殊场合
  - `budgetLevel` (optional): Budget preference
  - `cookingTime` (optional): Available cooking time
- `maxDishes` (optional): Maximum dishes (default: 6)
- `minDishes` (optional): Minimum dishes (default: 3)
- `includeAnalysis` (optional): Include detailed analysis

**Examples:**

```json
// Dinner party for 8 people
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 8,
      "occasion": "聚餐",
      "budgetLevel": "高档",
      "nutritionalBalance": true
    },
    "maxDishes": 8,
    "includeAnalysis": true
  }
}

// Quick weeknight dinner
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 3,
      "occasion": "日常",
      "cookingTime": "1小时",
      "skillLevel": "中级"
    },
    "maxDishes": 4
  }
}

// Holiday feast
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 12,
      "occasion": "节日",
      "preferredFlavors": ["鲜", "香", "甜"],
      "seasonalPreference": true
    },
    "minDishes": 6,
    "maxDishes": 10
  }
}
```

## Best Practices

### 1. Error Handling

Always check the `success` field in responses:

```javascript
const response = await callTool('get_recipe_details', { identifier: 'recipe_001' });

if (response.success) {
  // Use response.data
  console.log(response.data.recipe.name);
} else {
  // Handle error
  console.error(response.error);
  console.log('Troubleshooting:', response.troubleshooting);
}
```

### 2. Pagination

For large datasets, use pagination:

```json
// Get all recipes in batches
{
  "tool": "get_all_recipes",
  "arguments": {
    "page": 1,
    "limit": 50
  }
}
```

### 3. Performance Optimization

- Use `includeDetails: false` for recipe lists when full details aren't needed
- Limit results with appropriate `limit` values
- Use specific categories instead of getting all recipes

### 4. Meal Planning Tips

- Start with basic preferences and add constraints gradually
- Use `cookingSkillLevel` to get appropriate recipe difficulty
- Set realistic `timeConstraints` for busy schedules
- Include `budgetLevel` for cost-conscious planning

### 5. Recipe Scaling

When scaling recipes:
- Be aware that some ingredients (like spices) don't scale linearly
- Check the scaled amounts for reasonableness
- Consider cooking time adjustments for larger quantities

## Common Use Cases

### 1. Recipe Discovery
```json
// Find all quick breakfast options
{
  "tool": "get_recipes_by_category",
  "arguments": {
    "category": "早餐",
    "sortBy": "prepTime",
    "limit": 10
  }
}
```

### 2. Meal Planning for Dietary Restrictions
```json
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 2,
      "dietaryRestrictions": ["无海鲜", "低盐"],
      "allergies": ["花生"]
    }
  }
}
```

### 3. Entertaining Guests
```json
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 6,
      "occasion": "招待客人",
      "budgetLevel": "高档"
    },
    "includeAnalysis": true
  }
}
```

### 4. Learning to Cook
```json
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 1,
      "cookingSkillLevel": "初学者",
      "preferredCategories": ["主食", "素菜"]
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Recipe not found"**
   - Check spelling of recipe names
   - Use exact category names
   - Try searching by ID instead of name

2. **"Invalid parameters"**
   - Verify required parameters are provided
   - Check parameter types (numbers vs strings)
   - Ensure enum values are from valid lists

3. **"Empty results"**
   - Try broader search criteria
   - Check if category names are correct
   - Reduce filtering constraints

### Getting Help

Error responses include troubleshooting tips specific to each tool and error type. Always check the `troubleshooting` array in error responses for guidance.

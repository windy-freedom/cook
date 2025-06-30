# cook-mcp-windy

HowToCook MCP Server - Intelligent Chinese recipe management and meal planning for AI assistants

## 🚀 Quick Start

### For Claude Desktop (MCP Client)
```json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["cook-mcp-windy", "mcp"]
    }
  }
}
```

### CLI Tools (Optional)
```bash
# Show available tools and features
npx cook-mcp-windy info

# Test the server
npx cook-mcp-windy test

# Generate MCP configuration
npx cook-mcp-windy config
```

### MCP Client Configuration

**IMPORTANT**: Use the MCP command for Claude Desktop:

```json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["cook-mcp-windy", "mcp"]
    }
  }
}
```

## 🍳 Features

- **5 MCP Tools** for comprehensive recipe management and meal planning
- **Chinese Cuisine Focus** with 10 traditional recipe categories
- **Intelligent Meal Planning** considering dietary restrictions and preferences
- **Automatic Shopping Lists** with ingredient consolidation and categorization
- **Recipe Scaling** for different serving sizes with smart ingredient adjustment
- **Nutritional Analysis** and detailed cooking guidance

## 📋 Available MCP Tools

1. **`get_all_recipes`** - Retrieve all recipes with pagination and sorting
2. **`get_recipes_by_category`** - Filter by category (水产, 早餐, 荤菜, etc.)
3. **`get_recipe_details`** - Get detailed recipe information with scaling options
4. **`recommend_meal_plan`** - Generate intelligent weekly meal plans
5. **`recommend_dish_combination`** - Suggest balanced dish combinations

### Recipe Categories

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

### Advanced Features

- **Intelligent Meal Planning**: Considers dietary restrictions, allergies, skill level, and nutritional goals
- **Shopping List Generation**: Automatically consolidates ingredients with price estimates
- **Recipe Scaling**: Adjust ingredient quantities for different serving sizes
- **Nutritional Analysis**: Provides detailed nutritional information and dietary classifications
- **Dish Combination Analysis**: Evaluates flavor harmony, nutritional balance, and cooking efficiency
- **Time Management**: Provides cooking timelines and parallel task suggestions

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd howtocook-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Clean build directory
npm run clean
```

## Usage

### Basic Recipe Retrieval

```json
{
  "tool": "get_all_recipes",
  "arguments": {
    "limit": 10,
    "sortBy": "name",
    "includeDetails": true
  }
}
```

### Category-based Filtering

```json
{
  "tool": "get_recipes_by_category",
  "arguments": {
    "category": "荤菜",
    "limit": 20,
    "includeStats": true
  }
}
```

### Detailed Recipe Information

```json
{
  "tool": "get_recipe_details",
  "arguments": {
    "identifier": "recipe_001",
    "scaleServings": 6,
    "includeRelated": true,
    "includeNutrition": true
  }
}
```

### Meal Plan Generation

```json
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 4,
      "dietaryRestrictions": ["素食"],
      "cookingSkillLevel": "中级",
      "budgetLevel": "中等",
      "nutritionalGoals": {
        "balanced": true,
        "targetCalories": 2000
      }
    },
    "includeShoppingList": true,
    "planDuration": 7
  }
}
```

### Dish Combination Recommendations

```json
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 6,
      "occasion": "聚餐",
      "budgetLevel": "高档",
      "cookingTime": "2小时",
      "nutritionalBalance": true
    },
    "maxDishes": 6,
    "includeAnalysis": true
  }
}
```

## Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)

### Recipe Data

The server uses JSON-based recipe storage located in `src/data/`. You can:

- Add new recipes to `sampleRecipes.json`
- Extend the `RecipeDataManager` class for database integration
- Implement custom recipe sources

## API Response Format

All tools return responses in the following format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Tool-specific data */ },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "toolCategory": "Recipe Management",
    "dataType": "array",
    "recordCount": 10
  }
}
```

Error responses include troubleshooting information:

```json
{
  "success": false,
  "error": "Recipe not found",
  "details": "No recipe found with ID 'invalid_id'",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "troubleshooting": [
    "Check if the identifier exists in the database",
    "Try using a different search method (ID vs name)"
  ]
}
```

## Architecture

```
src/
├── data/           # Recipe data and data management
├── tools/          # MCP tool implementations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Main server entry point
```

### Key Components

- **RecipeDataManager**: Handles recipe storage and retrieval
- **MCP Tools**: Individual tool implementations with validation
- **Utility Functions**: Recipe processing, meal planning, and analysis
- **Type System**: Comprehensive TypeScript types for all data structures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting information in error responses
- Review the tool documentation and examples
- Ensure all required parameters are provided with correct types

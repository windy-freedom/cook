# HowToCook MCP Server 使用指南

## 🎉 项目完成！

恭喜！HowToCook MCP服务器已经成功创建并可以使用了。这是一个功能完整的Model Context Protocol服务器，专门用于中式菜谱管理和智能meal计划。

## 📁 项目结构

```
HowToCook-mcp/
├── src/
│   ├── data/           # 食谱数据和数据管理
│   │   ├── sampleRecipes.json    # 示例食谱数据
│   │   └── recipeData.ts         # 数据管理器
│   ├── tools/          # MCP工具实现
│   │   ├── getAllRecipes.ts      # 获取所有食谱
│   │   ├── getRecipesByCategory.ts # 按类别获取食谱
│   │   ├── getRecipeDetails.ts   # 获取食谱详情
│   │   ├── recommendMealPlan.ts  # 推荐meal计划
│   │   ├── recommendDishCombination.ts # 推荐菜品搭配
│   │   └── index.ts              # 工具注册
│   ├── types/          # TypeScript类型定义
│   │   ├── recipe.ts             # 食谱相关类型
│   │   ├── mealPlan.ts           # meal计划类型
│   │   ├── shoppingList.ts       # 购物清单类型
│   │   ├── dishCombination.ts    # 菜品搭配类型
│   │   └── index.ts              # 类型导出
│   ├── utils/          # 工具函数
│   │   ├── recipeUtils.ts        # 食谱处理工具
│   │   ├── mealPlanUtils.ts      # meal计划工具
│   │   ├── shoppingListUtils.ts  # 购物清单工具
│   │   ├── dishCombinationUtils.ts # 菜品搭配工具
│   │   └── index.ts              # 工具导出
│   └── index.ts        # 主服务器入口
├── dist/               # 编译输出
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
├── README.md           # 项目说明
├── USAGE.md            # 详细使用指南
└── test-mcp.js         # 测试脚本
```

## 🚀 快速开始

### 1. 安装依赖（已完成）
```bash
npm install
```

### 2. 构建项目（已完成）
```bash
npm run build
```

### 3. 启动服务器
```bash
npm start
```

### 4. 测试服务器
```bash
node test-mcp.js
```

## 🛠️ 核心功能

### 5个MCP工具

1. **`get_all_recipes`** - 获取所有食谱
   - 支持分页和排序
   - 可选择包含完整详情或摘要

2. **`get_recipes_by_category`** - 按类别筛选食谱
   - 支持10个中式菜谱类别
   - 可包含类别统计信息

3. **`get_recipe_details`** - 获取详细食谱信息
   - 支持按ID或名称搜索
   - 可调整份量大小
   - 包含营养分析和烹饪要求

4. **`recommend_meal_plan`** - 智能meal计划推荐
   - 考虑饮食限制和过敏
   - 自动生成购物清单
   - 提供烹饪建议

5. **`recommend_dish_combination`** - 菜品搭配推荐
   - 营养平衡分析
   - 口味和谐度评估
   - 详细烹饪时间安排

## 📋 支持的食谱类别

- 🐟 水产 (Seafood)
- 🍳 早餐 (Breakfast)  
- 🧂 调味料 (Seasonings)
- 🍰 甜品 (Desserts)
- 🥤 饮品 (Beverages)
- 🥩 荤菜 (Meat Dishes)
- 🥘 半成品 (Semi-prepared)
- 🍲 汤羹 (Soups)
- 🍚 主食 (Staples)
- 🥬 素菜 (Vegetarian)

## 💡 使用示例

### 基础食谱查询
```json
{
  "tool": "get_all_recipes",
  "arguments": {
    "limit": 10,
    "sortBy": "name"
  }
}
```

### 按类别查询
```json
{
  "tool": "get_recipes_by_category", 
  "arguments": {
    "category": "荤菜",
    "includeStats": true
  }
}
```

### 生成meal计划
```json
{
  "tool": "recommend_meal_plan",
  "arguments": {
    "preferences": {
      "numberOfPeople": 4,
      "dietaryRestrictions": ["素食"],
      "cookingSkillLevel": "中级"
    },
    "includeShoppingList": true
  }
}
```

### 菜品搭配推荐
```json
{
  "tool": "recommend_dish_combination",
  "arguments": {
    "preferences": {
      "numberOfPeople": 6,
      "occasion": "聚餐",
      "budgetLevel": "中等"
    },
    "includeAnalysis": true
  }
}
```

## 🔧 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 修复代码格式
npm run lint:fix

# 清理构建文件
npm run clean

# 重新构建
npm run rebuild
```

## 🧪 测试

项目包含一个简单的测试脚本来验证所有MCP工具：

```bash
node test-mcp.js
```

测试将验证：
- 工具列表获取
- 所有5个MCP工具的基本功能
- 错误处理
- 响应格式

## 📖 详细文档

- **README.md** - 项目概述和技术文档
- **USAGE.md** - 详细的API使用指南和示例
- **HOW_TO_USE.md** - 本文件，快速使用指南

## 🎯 主要特性

### 智能功能
- **营养分析** - 自动计算卡路里和营养成分
- **份量调整** - 智能调整食材用量
- **购物清单** - 自动合并和分类食材
- **时间管理** - 提供并行烹饪建议
- **口味平衡** - 分析菜品搭配和谐度

### 技术特性
- **TypeScript** - 完整的类型安全
- **MCP协议** - 标准的Model Context Protocol实现
- **模块化设计** - 易于扩展和维护
- **错误处理** - 详细的错误信息和故障排除
- **性能优化** - 分页、缓存和懒加载

## 🔌 集成使用

这个MCP服务器可以与任何支持MCP协议的AI助手集成，如：

1. **Claude Desktop** - 通过MCP配置
2. **自定义AI应用** - 通过MCP SDK
3. **开发工具** - 作为代码助手的上下文

### MCP配置示例
```json
{
  "mcpServers": {
    "howtocook": {
      "command": "node",
      "args": ["path/to/howtocook-mcp/dist/index.js"]
    }
  }
}
```

## 🎊 恭喜！

你现在拥有一个功能完整的中式菜谱MCP服务器！

- ✅ 5个核心MCP工具全部实现
- ✅ 完整的TypeScript类型系统
- ✅ 智能meal计划和菜品搭配
- ✅ 自动购物清单生成
- ✅ 营养分析和烹饪建议
- ✅ 详细的文档和示例
- ✅ 测试脚本验证功能

开始使用你的HowToCook MCP服务器，享受智能烹饪规划吧！🍳👨‍🍳

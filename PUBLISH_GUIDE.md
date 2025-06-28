# 📦 HowToCook MCP Server 发布指南

## 🎉 项目已准备就绪！

你的HowToCook MCP服务器现在已经完全配置为npx包，可以发布到npm并通过GitHub进行管理。

## 📋 发布前检查清单

### ✅ 已完成的配置

1. **NPM包配置** ✅
   - 包名: `@windy-freedom/cook`
   - CLI命令: `cook-mcp`, `howtocook-mcp`
   - 正确的bin配置和依赖

2. **CLI工具** ✅
   - `npx @windy-freedom/cook start` - 启动MCP服务器
   - `npx @windy-freedom/cook info` - 显示工具信息
   - `npx @windy-freedom/cook test` - 测试功能
   - `npx @windy-freedom/cook config` - 生成MCP配置

3. **GitHub Actions** ✅
   - 自动测试工作流
   - 自动发布到NPM
   - 多平台测试 (Ubuntu, Windows, macOS)

4. **文档** ✅
   - README.md (npm友好)
   - 使用指南和示例
   - MCP配置说明

## 🚀 发布步骤

### 1. 准备GitHub仓库

```bash
# 初始化git仓库
git init
git add .
git commit -m "Initial commit: HowToCook MCP Server"

# 添加远程仓库
git remote add origin https://github.com/windy-freedom/cook.git
git branch -M main
git push -u origin main
```

### 2. 设置NPM发布

在GitHub仓库设置中添加以下Secrets：

- `NPM_TOKEN`: 你的NPM访问令牌
  1. 登录 [npmjs.com](https://www.npmjs.com)
  2. 进入 Account Settings > Access Tokens
  3. 创建新的 Automation token
  4. 复制token到GitHub Secrets

### 3. 本地测试

```bash
# 构建项目
npm run build

# 测试CLI
node dist/cli.js --help
node dist/cli.js info
node dist/cli.js test

# 测试包打包
npm pack
```

### 4. 发布到NPM

#### 方法1: 自动发布 (推荐)
```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions会自动发布到NPM
```

#### 方法2: 手动发布
```bash
# 登录NPM
npm login

# 发布包
npm publish
```

## 🔧 使用方式

### 用户安装和使用

```bash
# 直接使用 (推荐)
npx @windy-freedom/cook start

# 或者全局安装
npm install -g @windy-freedom/cook
cook-mcp start
```

### MCP客户端配置

用户需要在Claude Desktop或其他MCP客户端中添加：

```json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["@windy-freedom/cook", "start"]
    }
  }
}
```

## 📊 功能验证

### CLI命令测试
```bash
# 显示帮助
npx @windy-freedom/cook --help

# 显示工具信息
npx @windy-freedom/cook info

# 生成MCP配置
npx @windy-freedom/cook config

# 测试所有工具
npx @windy-freedom/cook test

# 启动服务器
npx @windy-freedom/cook start
```

### MCP工具测试
所有5个MCP工具都已实现并测试：

1. ✅ `get_all_recipes` - 获取所有食谱
2. ✅ `get_recipes_by_category` - 按类别筛选
3. ✅ `get_recipe_details` - 获取详细信息
4. ✅ `recommend_meal_plan` - 智能meal计划
5. ✅ `recommend_dish_combination` - 菜品搭配推荐

## 🎯 核心特性

### 智能功能
- **营养分析** - 自动计算营养成分
- **份量调整** - 智能调整食材用量
- **购物清单** - 自动生成和分类
- **meal计划** - 考虑饮食限制和偏好
- **菜品搭配** - 营养平衡和口味和谐

### 技术特性
- **TypeScript** - 完整类型安全
- **MCP协议** - 标准实现
- **CLI工具** - 易于使用
- **跨平台** - Windows/macOS/Linux
- **NPX支持** - 无需安装即可使用

## 📈 版本管理

### 版本号规则
- `1.0.0` - 初始发布版本
- `1.0.x` - Bug修复
- `1.x.0` - 新功能
- `x.0.0` - 重大更改

### 发布新版本
```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 推送标签触发自动发布
git push origin --tags
```

## 🔍 监控和维护

### NPM包状态
- 检查下载量: [npmjs.com/package/@windy-freedom/cook](https://www.npmjs.com/package/@windy-freedom/cook)
- 监控问题: GitHub Issues
- 用户反馈: GitHub Discussions

### 持续改进
- 添加更多食谱数据
- 增强AI推荐算法
- 支持更多饮食文化
- 优化性能和用户体验

## 🎊 恭喜！

你现在拥有一个完全可发布的NPM包：

- ✅ 完整的MCP服务器实现
- ✅ 用户友好的CLI工具
- ✅ 自动化CI/CD流程
- ✅ 详细的文档和示例
- ✅ 跨平台兼容性
- ✅ NPX即用即走体验

用户现在可以通过简单的命令开始使用：
```bash
npx @windy-freedom/cook start
```

开始发布你的HowToCook MCP服务器，让全世界的AI助手都能帮助用户进行智能烹饪规划！🍳🚀

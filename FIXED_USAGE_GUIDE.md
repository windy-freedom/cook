# 🔧 HowToCook MCP服务器 - 修复后使用指南

## ✅ 问题已修复！

根据日志文件中的错误，我已经修复了以下问题：

### 🐛 修复的问题

1. **包名错误** - 更新了所有配置中的包名从 `@windy-freedom/cook` 到 `cook-mcp-windy`
2. **CLI输出干扰** - 创建了专门的MCP服务器入口点，避免console输出干扰JSON-RPC通信
3. **配置文件错误** - 提供了正确的Claude Desktop配置

### 📦 最新版本信息

- **包名**: `cook-mcp-windy`
- **版本**: `1.0.2`
- **NPM链接**: https://www.npmjs.com/package/cook-mcp-windy

## 🚀 正确的使用方法

### 1. Claude Desktop配置

请使用以下**正确的配置**替换你的Claude Desktop MCP设置：

```json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["cook-mcp-windy", "start"]
    }
  }
}
```

### 2. 配置文件位置

Claude Desktop的配置文件通常位于：

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 3. 快速配置

我已经为你创建了一个配置文件 `claude-desktop-config.json`，你可以：

1. 复制这个文件的内容
2. 粘贴到你的Claude Desktop配置文件中
3. 重启Claude Desktop

### 4. 验证安装

你可以通过以下命令验证包是否正常工作：

```bash
# 测试CLI工具
npx cook-mcp-windy info

# 测试MCP工具
npx cook-mcp-windy test

# 生成配置
npx cook-mcp-windy config
```

## 🔍 故障排除

### 如果仍然有问题：

1. **清除NPM缓存**:
   ```bash
   npm cache clean --force
   ```

2. **使用最新版本**:
   ```bash
   npx cook-mcp-windy@latest start
   ```

3. **检查Claude Desktop日志**:
   - 重启Claude Desktop
   - 查看是否还有错误信息

4. **手动测试MCP服务器**:
   ```bash
   # 启动服务器（会在stdio模式下运行）
   npx cook-mcp-windy start
   ```

## 📋 可用的MCP工具

一旦配置正确，Claude将可以使用以下5个工具：

1. **`get_all_recipes`** - 获取所有食谱
2. **`get_recipes_by_category`** - 按类别筛选食谱
3. **`get_recipe_details`** - 获取详细食谱信息
4. **`recommend_meal_plan`** - 生成智能meal计划
5. **`recommend_dish_combination`** - 推荐菜品搭配

## 🎯 测试示例

配置完成后，你可以在Claude中尝试以下对话：

```
"帮我推荐一个4人份的中式晚餐搭配"
"给我看看所有的荤菜食谱"
"为我制定一周的meal计划，我是素食主义者"
"红烧肉的详细做法是什么？"
```

## 📞 如果还有问题

如果按照以上步骤操作后仍然有问题，请：

1. 检查网络连接
2. 确保使用的是最新版本的Claude Desktop
3. 重启Claude Desktop应用
4. 查看新的日志文件是否还有错误

## ✨ 新功能

修复版本还包含：

- **纯净的MCP服务器** - 专门的入口点，无console输出干扰
- **改进的错误处理** - 更好的错误信息和故障排除
- **正确的包名配置** - 所有引用都已更新

现在你的HowToCook MCP服务器应该可以正常工作了！🍳👨‍🍳

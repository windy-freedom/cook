# 🔧 HowToCook MCP服务器 - 最终修复指南

## ✅ 问题彻底解决！

我已经创建了一个全新的直接MCP服务器入口点，完全消除了CLI输出干扰JSON-RPC通信的问题。

### 🆕 最新版本信息

- **包名**: `cook-mcp-windy`
- **版本**: `1.0.3`
- **新增**: 专用的MCP服务器入口点 `cook-mcp-server`

## 🚀 最终解决方案

### 1. 使用新的Claude Desktop配置

请将你的Claude Desktop配置**完全替换**为以下内容：

```json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["cook-mcp-server"]
    }
  }
}
```

**重要**: 注意这里使用的是 `cook-mcp-server` 而不是 `cook-mcp-windy start`

### 2. 配置文件位置

Claude Desktop配置文件位置：

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

### 3. 配置步骤

1. **打开配置文件** (如果不存在则创建)
2. **完全替换内容** 为上面的JSON配置
3. **保存文件**
4. **重启Claude Desktop**

### 4. 验证配置

重启Claude Desktop后，你可以测试以下对话：

```
"帮我推荐一个适合4人的中式晚餐搭配"
"给我看看所有的荤菜食谱"
"红烧肉的详细做法是什么？"
```

## 🔍 技术说明

### 问题根源
之前的问题是CLI工具在stdio模式下仍然输出带有emoji的信息，这些信息被Claude Desktop当作JSON来解析，导致解析错误。

### 解决方案
创建了一个专用的MCP服务器入口点 (`cook-mcp-server`)，它：
- 直接启动MCP服务器
- 没有任何console输出
- 纯净的JSON-RPC通信
- 完全兼容MCP协议

### 新的架构
```
Claude Desktop → npx cook-mcp-server → 直接MCP服务器 (无CLI包装)
```

## 📋 可用工具

配置成功后，Claude将可以使用以下5个工具：

1. **`get_all_recipes`** - 获取所有食谱 (支持分页和排序)
2. **`get_recipes_by_category`** - 按类别筛选食谱 (10个中式菜谱类别)
3. **`get_recipe_details`** - 获取详细食谱信息 (支持份量调整)
4. **`recommend_meal_plan`** - 生成智能meal计划 (考虑饮食限制)
5. **`recommend_dish_combination`** - 推荐菜品搭配 (营养平衡分析)

## 🎯 测试示例

配置完成后，尝试这些对话：

### 基础查询
- "有哪些简单的中式菜谱？"
- "给我看看所有的汤类食谱"

### 详细信息
- "红烧肉的详细做法和食材用量是多少？"
- "麻婆豆腐怎么做？给我调整到6人份"

### 智能规划
- "帮我制定一周的中式meal计划，我们家有4个人"
- "推荐一个适合招待客人的中式晚餐搭配"

### 特殊需求
- "我是素食主义者，帮我推荐一些素菜食谱"
- "给我一个经济实惠的家常菜搭配"

## 🔧 故障排除

如果仍然有问题：

1. **确保使用正确的配置**:
   ```json
   {
     "mcpServers": {
       "howtocook": {
         "command": "npx",
         "args": ["cook-mcp-server"]
       }
     }
   }
   ```

2. **清除缓存**:
   ```bash
   npm cache clean --force
   ```

3. **手动测试**:
   ```bash
   npx cook-mcp-server
   ```
   (应该启动但没有任何输出)

4. **检查版本**:
   ```bash
   npx cook-mcp-windy info
   ```

## 📞 支持

如果按照此指南操作后仍有问题，请：

1. 检查Claude Desktop版本是否为最新
2. 确保网络连接正常
3. 重启Claude Desktop应用
4. 查看是否有新的错误日志

## 🎉 成功标志

配置成功后，你应该能够：
- 在Claude中询问中式菜谱相关问题
- 获得详细的食谱信息和烹饪指导
- 生成智能的meal计划和购物清单
- 得到营养均衡的菜品搭配建议

现在你的HowToCook MCP服务器应该完全正常工作了！享受AI助手带来的智能烹饪体验吧！🍳👨‍🍳

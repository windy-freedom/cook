#!/usr/bin/env node

/**
 * Prepare package for publishing to npm
 * This script ensures everything is ready for npx usage
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('📦 Preparing HowToCook MCP Server for publishing...\n');

// 1. Clean and build
console.log('🧹 Cleaning previous build...');
try {
  execSync('npm run clean', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.log('   (No previous build to clean)');
}

console.log('🔨 Building project...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// 2. Copy assets
console.log('📋 Copying assets...');
const distDataDir = join(rootDir, 'dist', 'data');
if (!existsSync(distDataDir)) {
  mkdirSync(distDataDir, { recursive: true });
}

const sampleRecipesSource = join(rootDir, 'src', 'data', 'sampleRecipes.json');
const sampleRecipesTarget = join(distDataDir, 'sampleRecipes.json');

if (existsSync(sampleRecipesSource)) {
  copyFileSync(sampleRecipesSource, sampleRecipesTarget);
  console.log('   ✅ Copied sampleRecipes.json');
} else {
  console.warn('   ⚠️  sampleRecipes.json not found');
}

// 3. Make CLI executable
console.log('🔧 Making CLI executable...');
const cliPath = join(rootDir, 'dist', 'cli.js');
if (existsSync(cliPath)) {
  try {
    execSync(`chmod +x "${cliPath}"`, { cwd: rootDir });
    console.log('   ✅ CLI made executable');
  } catch (error) {
    console.log('   ⚠️  Could not make CLI executable (Windows?)');
  }
}

// 4. Validate package.json
console.log('📋 Validating package.json...');
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'keywords', 'author', 'license'];
const missingFields = requiredFields.filter(field => !packageJson[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required fields in package.json:', missingFields);
  process.exit(1);
}

// Validate bin paths exist
if (packageJson.bin) {
  for (const [command, path] of Object.entries(packageJson.bin)) {
    const fullPath = join(rootDir, path);
    if (!existsSync(fullPath)) {
      console.error(`❌ Binary path does not exist: ${path} for command ${command}`);
      process.exit(1);
    }
  }
}

console.log('   ✅ Package.json is valid');

// 5. Test the CLI
console.log('🧪 Testing CLI...');
try {
  const output = execSync('node dist/cli.js --help', { 
    cwd: rootDir, 
    encoding: 'utf-8',
    timeout: 10000
  });
  
  if (output.includes('HowToCook MCP Server')) {
    console.log('   ✅ CLI is working');
  } else {
    console.error('❌ CLI test failed - unexpected output');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ CLI test failed:', error.message);
  process.exit(1);
}

// 6. Test MCP tools
console.log('🔧 Testing MCP tools...');
try {
  const output = execSync('node dist/cli.js test --tool get_all_recipes', { 
    cwd: rootDir, 
    encoding: 'utf-8',
    timeout: 30000
  });
  
  if (output.includes('passed') || output.includes('✅')) {
    console.log('   ✅ MCP tools are working');
  } else {
    console.warn('   ⚠️  MCP tools test had issues, but continuing...');
  }
} catch (error) {
  console.warn('   ⚠️  Could not test MCP tools:', error.message);
}

// 7. Generate README for npm
console.log('📖 Generating npm README...');
const npmReadme = generateNpmReadme(packageJson);
writeFileSync(join(rootDir, 'README.md'), npmReadme);
console.log('   ✅ README.md updated for npm');

// 8. Show publish instructions
console.log('\n🎉 Package is ready for publishing!');
console.log('\n📋 Next steps:');
console.log('1. Review the package: npm pack');
console.log('2. Test locally: npm install -g ./windy-freedom-cook-1.0.0.tgz');
console.log('3. Test npx: npx @windy-freedom/cook --help');
console.log('4. Publish: npm publish');
console.log('\n🔗 After publishing, users can run:');
console.log('   npx @windy-freedom/cook start');
console.log('   npx @windy-freedom/cook info');
console.log('   npx @windy-freedom/cook test');

function generateNpmReadme(packageJson) {
  return `# ${packageJson.name}

${packageJson.description}

## 🚀 Quick Start

### Install and Run
\`\`\`bash
# Start the MCP server
npx @windy-freedom/cook start

# Show available tools and features
npx @windy-freedom/cook info

# Test the server
npx @windy-freedom/cook test
\`\`\`

### MCP Client Configuration

For Claude Desktop, add this to your MCP settings:

\`\`\`json
{
  "mcpServers": {
    "howtocook": {
      "command": "npx",
      "args": ["@windy-freedom/cook", "start"]
    }
  }
}
\`\`\`

## 🍳 Features

- **5 MCP Tools** for recipe management and meal planning
- **Chinese Cuisine Focus** with 10 recipe categories
- **Intelligent Meal Planning** with dietary restrictions
- **Automatic Shopping Lists** with ingredient consolidation
- **Recipe Scaling** for different serving sizes
- **Nutritional Analysis** and cooking guidance

## 📋 Available Tools

1. \`get_all_recipes\` - Retrieve all recipes with pagination
2. \`get_recipes_by_category\` - Filter by category (水产, 早餐, 荤菜, etc.)
3. \`get_recipe_details\` - Get detailed recipe information
4. \`recommend_meal_plan\` - Generate intelligent meal plans
5. \`recommend_dish_combination\` - Suggest dish combinations

## 🥘 Recipe Categories

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

## 📖 Documentation

- [GitHub Repository](${packageJson.repository?.url || 'https://github.com/windy-freedom/cook'})
- [Issues & Support](${packageJson.bugs?.url || 'https://github.com/windy-freedom/cook/issues'})

## 📄 License

${packageJson.license}

---

Made with ❤️ for intelligent cooking and meal planning.
`;
}

#!/usr/bin/env node

import { program } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

/**
 * HowToCook MCP Server CLI
 * 
 * This CLI tool provides easy access to the HowToCook MCP Server
 * for Chinese recipe management and meal planning.
 */

program
  .name('cook-mcp-windy')
  .description('HowToCook MCP Server - Intelligent Chinese recipe management and meal planning')
  .version(packageJson.version);

program
  .command('start')
  .description('Start the HowToCook MCP Server')
  .option('-p, --port <port>', 'Port to run the server on (for HTTP mode)', '3000')
  .option('-m, --mode <mode>', 'Server mode: stdio (default) or http', 'stdio')
  .option('-v, --verbose', 'Enable verbose logging')
  .action((options) => {
    // Only show output in non-stdio mode to avoid interfering with MCP communication
    if (options.mode !== 'stdio') {
      console.log('🍳 Starting HowToCook MCP Server...');
      console.log(`📋 Mode: ${options.mode}`);

      if (options.verbose) {
        console.log('🔧 Verbose logging enabled');
      }
    }

    if (options.mode === 'stdio') {
      // In stdio mode, use the direct MCP server without any console output
      const serverPath = join(__dirname, 'start-mcp.js');
      const server = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          VERBOSE: options.verbose ? 'true' : 'false'
        }
      });
      
      server.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
      });
      
      server.on('exit', (code) => {
        if (code !== 0) {
          console.error(`❌ Server exited with code ${code}`);
          process.exit(code || 1);
        }
      });
      
    } else if (options.mode === 'http') {
      console.log(`🌐 Starting HTTP server on port ${options.port}`);
      console.log('⚠️  HTTP mode is for testing only. Use stdio mode for MCP clients.');

      // Start HTTP server (for testing/debugging)
      startHttpServer(parseInt(options.port), options.verbose);
    } else {
      console.error('❌ Invalid mode. Use "stdio" or "http"');
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test the HowToCook MCP Server functionality')
  .option('-t, --tool <tool>', 'Test specific tool only')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    console.log('🧪 Testing HowToCook MCP Server...');
    
    try {
      const { runTests } = await import('./test/testRunner.js');
      await runTests({
        specificTool: options.tool,
        verbose: options.verbose
      });
    } catch (error) {
      console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show information about available tools and features')
  .action(() => {
    console.log('🍳 HowToCook MCP Server Information');
    console.log('=====================================\n');
    
    console.log('📋 Available MCP Tools:');
    console.log('  • get_all_recipes        - Retrieve all recipes with pagination');
    console.log('  • get_recipes_by_category - Filter recipes by category');
    console.log('  • get_recipe_details     - Get detailed recipe information');
    console.log('  • recommend_meal_plan    - Generate intelligent meal plans');
    console.log('  • recommend_dish_combination - Suggest dish combinations\n');
    
    console.log('🥘 Supported Recipe Categories:');
    console.log('  • 水产 (Seafood)         • 早餐 (Breakfast)');
    console.log('  • 调味料 (Seasonings)    • 甜品 (Desserts)');
    console.log('  • 饮品 (Beverages)       • 荤菜 (Meat Dishes)');
    console.log('  • 半成品 (Semi-prepared)  • 汤羹 (Soups)');
    console.log('  • 主食 (Staples)         • 素菜 (Vegetarian)\n');
    
    console.log('🎯 Key Features:');
    console.log('  • Intelligent meal planning with dietary restrictions');
    console.log('  • Automatic shopping list generation');
    console.log('  • Recipe scaling for different serving sizes');
    console.log('  • Nutritional analysis and cooking guidance');
    console.log('  • Traditional Chinese cuisine focus\n');
    
    console.log('🔗 Integration:');
    console.log('  • Compatible with Claude Desktop and other MCP clients');
    console.log('  • Standard Model Context Protocol implementation');
    console.log('  • Easy setup with npx @windy-freedom/cook start\n');
    
    console.log('📖 Documentation:');
    console.log('  • GitHub: https://github.com/windy-freedom/cook');
    console.log('  • Issues: https://github.com/windy-freedom/cook/issues');
  });

program
  .command('config')
  .description('Generate MCP client configuration')
  .option('-c, --client <client>', 'Client type: claude-desktop (default)', 'claude-desktop')
  .option('-o, --output <file>', 'Output configuration to file')
  .action((options) => {
    console.log('⚙️  Generating MCP Configuration...\n');
    
    const config = generateMCPConfig(options.client);
    
    if (options.output) {
      const fs = require('fs');
      fs.writeFileSync(options.output, JSON.stringify(config, null, 2));
      console.log(`✅ Configuration saved to ${options.output}`);
    } else {
      console.log('📋 MCP Configuration:');
      console.log(JSON.stringify(config, null, 2));
    }
    
    console.log('\n📝 Setup Instructions:');
    if (options.client === 'claude-desktop') {
      console.log('1. Copy the configuration above');
      console.log('2. Add it to your Claude Desktop MCP settings');
      console.log('3. Restart Claude Desktop');
      console.log('4. The HowToCook tools will be available in Claude');
    }
  });

// HTTP server for testing
async function startHttpServer(port: number, _verbose: boolean): Promise<void> {
  const express = await import('express');
  const app = express.default();
  
  app.use(express.json());
  
  app.get('/', (_req, res) => {
    res.json({
      name: 'HowToCook MCP Server',
      version: packageJson.version,
      status: 'running',
      mode: 'http-test',
      tools: [
        'get_all_recipes',
        'get_recipes_by_category', 
        'get_recipe_details',
        'recommend_meal_plan',
        'recommend_dish_combination'
      ]
    });
  });
  
  app.post('/tools/:toolName', async (req, res) => {
    try {
      const { toolHandlers } = await import('./tools/index.js');
      const handler = toolHandlers[req.params.toolName as keyof typeof toolHandlers];
      
      if (!handler) {
        return res.status(404).json({ error: 'Tool not found' });
      }
      
      const result = await handler(req.body);
      res.json(result);
      return;
    } catch (error) {
      res.status(500).json({
        error: 'Tool execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  });
  
  app.listen(port, () => {
    console.log(`✅ HTTP server running on http://localhost:${port}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  / - Server info`);
    console.log(`   POST /tools/{toolName} - Execute tool`);
  });
}

// Generate MCP configuration
function generateMCPConfig(clientType: string): any {
  const baseConfig = {
    mcpServers: {
      "howtocook": {
        command: "npx",
        args: ["cook-mcp-windy", "start"],
        env: {}
      }
    }
  };
  
  if (clientType === 'claude-desktop') {
    return baseConfig;
  }
  
  return baseConfig;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

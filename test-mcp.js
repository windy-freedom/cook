#!/usr/bin/env node

/**
 * Simple test script for HowToCook MCP Server
 * This script demonstrates how to interact with the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPTester {
  constructor() {
    this.server = null;
  }

  async startServer() {
    console.log('🚀 Starting HowToCook MCP Server...');
    
    this.server = spawn('node', [join(__dirname, 'dist/index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString());
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      this.server.stdout.on('data', (data) => {
        response += data.toString();
        try {
          const parsed = JSON.parse(response);
          clearTimeout(timeout);
          resolve(parsed);
        } catch (e) {
          // Continue reading if JSON is incomplete
        }
      });

      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testListTools() {
    console.log('\n📋 Testing: List Tools');
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Tools available:', response.result?.tools?.map(t => t.name) || []);
      return true;
    } catch (error) {
      console.error('❌ Failed to list tools:', error.message);
      return false;
    }
  }

  async testGetAllRecipes() {
    console.log('\n🍳 Testing: Get All Recipes');
    
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_all_recipes',
        arguments: {
          limit: 3,
          includeDetails: false
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Retrieved recipes successfully');
      console.log('   Sample response:', JSON.stringify(response, null, 2).substring(0, 200) + '...');
      return true;
    } catch (error) {
      console.error('❌ Failed to get recipes:', error.message);
      return false;
    }
  }

  async testGetRecipesByCategory() {
    console.log('\n🥘 Testing: Get Recipes by Category');
    
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_recipes_by_category',
        arguments: {
          category: '荤菜',
          limit: 2
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Retrieved recipes by category successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to get recipes by category:', error.message);
      return false;
    }
  }

  async testGetRecipeDetails() {
    console.log('\n📖 Testing: Get Recipe Details');
    
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_recipe_details',
        arguments: {
          identifier: 'recipe_001',
          scaleServings: 6
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Retrieved recipe details successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to get recipe details:', error.message);
      return false;
    }
  }

  async testRecommendMealPlan() {
    console.log('\n📅 Testing: Recommend Meal Plan');
    
    const request = {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'recommend_meal_plan',
        arguments: {
          preferences: {
            numberOfPeople: 4,
            cookingSkillLevel: '中级',
            budgetLevel: '中等'
          },
          planDuration: 3,
          includeShoppingList: true
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Generated meal plan successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to generate meal plan:', error.message);
      return false;
    }
  }

  async testRecommendDishCombination() {
    console.log('\n🍽️ Testing: Recommend Dish Combination');
    
    const request = {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'recommend_dish_combination',
        arguments: {
          preferences: {
            numberOfPeople: 6,
            occasion: '聚餐',
            budgetLevel: '中等'
          },
          maxDishes: 4,
          includeAnalysis: true
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Generated dish combination successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to generate dish combination:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 HowToCook MCP Server Test Suite');
    console.log('=====================================');

    await this.startServer();

    const tests = [
      () => this.testListTools(),
      () => this.testGetAllRecipes(),
      () => this.testGetRecipesByCategory(),
      () => this.testGetRecipeDetails(),
      () => this.testRecommendMealPlan(),
      () => this.testRecommendDishCombination()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        failed++;
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

    this.cleanup();
  }

  cleanup() {
    if (this.server) {
      this.server.kill();
      console.log('\n🛑 Server stopped');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPTester();
  
  process.on('SIGINT', () => {
    console.log('\n⚠️ Test interrupted');
    tester.cleanup();
    process.exit(0);
  });

  tester.runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    tester.cleanup();
    process.exit(1);
  });
}

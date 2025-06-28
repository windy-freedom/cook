import { toolHandlers } from '../tools/index.js';

interface TestOptions {
  specificTool?: string;
  verbose?: boolean;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

/**
 * Test runner for HowToCook MCP Server tools
 */
export async function runTests(options: TestOptions = {}): Promise<void> {
  console.log('🧪 HowToCook MCP Server Test Suite');
  console.log('===================================\n');

  const tests = options.specificTool 
    ? [options.specificTool]
    : Object.keys(toolHandlers);

  const results: TestResult[] = [];

  for (const toolName of tests) {
    if (options.verbose) {
      console.log(`🔍 Testing tool: ${toolName}`);
    }

    const result = await runToolTest(toolName, options.verbose || false);
    results.push(result);

    if (result.passed) {
      console.log(`✅ ${result.name} - ${result.duration}ms`);
    } else {
      console.log(`❌ ${result.name} - ${result.error}`);
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📈 Success rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

async function runToolTest(toolName: string, verbose: boolean): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const handler = toolHandlers[toolName as keyof typeof toolHandlers];
    if (!handler) {
      throw new Error(`Tool handler not found: ${toolName}`);
    }

    // Get test data for the tool
    const testData = getTestData(toolName);
    
    if (verbose) {
      console.log(`   Input: ${JSON.stringify(testData, null, 2)}`);
    }

    // Execute the tool
    const result = await handler(testData);
    
    if (verbose) {
      console.log(`   Output: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
    }

    // Validate result
    if (!result || typeof result.success !== 'boolean') {
      throw new Error('Invalid response format');
    }

    if (!result.success) {
      throw new Error(result.error || 'Tool returned failure');
    }

    return {
      name: toolName,
      passed: true,
      duration: Date.now() - startTime
    };

  } catch (error) {
    return {
      name: toolName,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

function getTestData(toolName: string): any {
  const testCases: Record<string, any> = {
    'get_all_recipes': {
      limit: 3,
      includeDetails: false
    },
    'get_recipes_by_category': {
      category: '荤菜',
      limit: 2
    },
    'get_recipe_details': {
      identifier: 'recipe_001',
      includeNutrition: true
    },
    'recommend_meal_plan': {
      preferences: {
        numberOfPeople: 2,
        cookingSkillLevel: '中级',
        budgetLevel: '中等'
      },
      planDuration: 3,
      includeShoppingList: false
    },
    'recommend_dish_combination': {
      preferences: {
        numberOfPeople: 4,
        occasion: '日常',
        budgetLevel: '中等'
      },
      maxDishes: 3,
      includeAnalysis: false
    }
  };

  return testCases[toolName] || {};
}

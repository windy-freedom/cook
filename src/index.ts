#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolHandlers, toolInfo } from './tools/index.js';
import type { MCPResponse } from './types/index.js';

/**
 * HowToCook MCP Server
 * 
 * A Model Context Protocol server for recipe management and meal planning.
 * Provides tools for recipe retrieval, meal planning, and dish combination recommendations.
 */
class HowToCookMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'howtocook-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Set up tool handlers
   */
  private setupToolHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: allTools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Validate tool exists
        if (!toolHandlers[name as keyof typeof toolHandlers]) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Call the appropriate tool handler
        const handler = toolHandlers[name as keyof typeof toolHandlers];
        const result = await handler(args || {});

        // Format response for MCP
        return {
          content: [
            {
              type: 'text',
              text: this.formatToolResponse(name, result),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Tool execution failed: ${errorMessage}`,
                tool: name,
                timestamp: new Date().toISOString()
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Format tool response for MCP client
   */
  private formatToolResponse(toolName: string, response: MCPResponse): string {
    const timestamp = new Date().toISOString();
    
    if (response.success) {
      return JSON.stringify({
        success: true,
        tool: toolName,
        message: response.message,
        data: response.data,
        timestamp,
        // Add helpful metadata
        metadata: {
          toolCategory: this.getToolCategory(toolName),
          dataType: this.getDataType(response.data),
          recordCount: this.getRecordCount(response.data)
        }
      }, null, 2);
    } else {
      return JSON.stringify({
        success: false,
        tool: toolName,
        error: response.error,
        details: response.details,
        timestamp,
        // Add troubleshooting info
        troubleshooting: this.getTroubleshootingInfo(toolName, response.error)
      }, null, 2);
    }
  }

  /**
   * Get tool category for metadata
   */
  private getToolCategory(toolName: string): string {
    const info = toolInfo[toolName as keyof typeof toolInfo];
    return info?.category || 'Unknown';
  }

  /**
   * Get data type for metadata
   */
  private getDataType(data: any): string {
    if (!data) return 'none';
    if (Array.isArray(data)) return 'array';
    if (data.items && Array.isArray(data.items)) return 'paginated';
    if (data.recipe) return 'recipe';
    if (data.mealPlan) return 'meal_plan';
    if (data.combination) return 'dish_combination';
    return 'object';
  }

  /**
   * Get record count for metadata
   */
  private getRecordCount(data: any): number {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (data.items && Array.isArray(data.items)) return data.items.length;
    if (data.totalCount) return data.totalCount;
    return 1;
  }

  /**
   * Get troubleshooting information
   */
  private getTroubleshootingInfo(toolName: string, error: string): string[] {
    const tips: string[] = [];
    
    if (error.includes('not found')) {
      tips.push('Check if the identifier exists in the database');
      tips.push('Try using a different search method (ID vs name)');
    }
    
    if (error.includes('validation')) {
      tips.push('Verify all required parameters are provided');
      tips.push('Check parameter types and value ranges');
    }
    
    if (error.includes('empty')) {
      tips.push('Ensure the recipe database is properly loaded');
      tips.push('Try with different filter criteria');
    }
    
    // Tool-specific tips
    switch (toolName) {
      case 'get_recipes_by_category':
        tips.push('Valid categories: 水产, 早餐, 调味料, 甜品, 饮品, 荤菜, 半成品, 汤羹, 主食, 素菜');
        break;
      case 'recommend_meal_plan':
        tips.push('Ensure numberOfPeople is between 1 and 20');
        tips.push('Check dietary restrictions are from the valid list');
        break;
      case 'recommend_dish_combination':
        tips.push('Ensure minDishes <= maxDishes');
        tips.push('Check that occasion is from the valid list');
        break;
    }
    
    return tips;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('HowToCook MCP Server started successfully');
    console.error(`Available tools: ${allTools.map(t => t.name).join(', ')}`);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const server = new HowToCookMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start HowToCook MCP Server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

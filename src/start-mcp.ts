#!/usr/bin/env node

/**
 * Direct MCP Server Starter
 * 
 * This script directly starts the MCP server without any CLI wrapper
 * to avoid any console output that could interfere with JSON-RPC communication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolHandlers } from './tools/index.js';
import type { MCPResponse } from './types/index.js';

class DirectMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'howtocook-mcp',
        version: '1.0.2',
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

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: allTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!toolHandlers[name as keyof typeof toolHandlers]) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const handler = toolHandlers[name as keyof typeof toolHandlers];
        const result = await handler(args || {});

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

  private setupErrorHandling(): void {
    // Silent error handling
    this.server.onerror = () => {};

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private formatToolResponse(toolName: string, response: MCPResponse): string {
    const timestamp = new Date().toISOString();
    
    if (response.success) {
      return JSON.stringify({
        success: true,
        tool: toolName,
        message: response.message,
        data: response.data,
        timestamp,
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
        timestamp
      }, null, 2);
    }
  }

  private getToolCategory(toolName: string): string {
    const categories: Record<string, string> = {
      'get_all_recipes': 'Recipe Management',
      'get_recipes_by_category': 'Recipe Management',
      'get_recipe_details': 'Recipe Management',
      'recommend_meal_plan': 'Meal Planning',
      'recommend_dish_combination': 'Meal Planning'
    };
    return categories[toolName] || 'Unknown';
  }

  private getDataType(data: any): string {
    if (!data) return 'none';
    if (Array.isArray(data)) return 'array';
    if (data.items && Array.isArray(data.items)) return 'paginated';
    if (data.recipe) return 'recipe';
    if (data.mealPlan) return 'meal_plan';
    if (data.combination) return 'dish_combination';
    return 'object';
  }

  private getRecordCount(data: any): number {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (data.items && Array.isArray(data.items)) return data.items.length;
    if (data.totalCount) return data.totalCount;
    return 1;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Silent error handling
process.on('uncaughtException', () => {
  process.exit(1);
});

process.on('unhandledRejection', () => {
  process.exit(1);
});

// Start the server immediately
async function main(): Promise<void> {
  try {
    const server = new DirectMCPServer();
    await server.start();
  } catch (error) {
    process.exit(1);
  }
}

main().catch(() => {
  process.exit(1);
});

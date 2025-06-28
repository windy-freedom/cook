#!/usr/bin/env node

/**
 * Pure MCP Server Entry Point
 * 
 * This file is specifically for MCP clients and contains no console output
 * that could interfere with the JSON-RPC communication protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolHandlers } from './tools/index.js';
import type { MCPResponse } from './types/index.js';

/**
 * Pure MCP Server - No console output, only JSON-RPC communication
 */
class PureMCPServer {
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

  private setupErrorHandling(): void {
    // Silent error handling - no console output
    this.server.onerror = () => {
      // Errors are handled silently in MCP mode
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
    // No console output in MCP mode
  }
}

// Handle uncaught errors silently
process.on('uncaughtException', () => {
  process.exit(1);
});

process.on('unhandledRejection', () => {
  process.exit(1);
});

// Start the pure MCP server
async function main(): Promise<void> {
  try {
    const server = new PureMCPServer();
    await server.start();
  } catch (error) {
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(() => {
    process.exit(1);
  });
}

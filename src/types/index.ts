// Export all types for easy importing
export * from './recipe.js';
export * from './mealPlan.js';
export * from './shoppingList.js';
export * from './dishCombination.js';

// Common response types for MCP tools
import { z } from 'zod';

// Generic success response
export const SuccessResponse = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  data: z.any().optional(),
});

export type SuccessResponse<T = any> = {
  success: true;
  message?: string;
  data?: T;
};

// Generic error response
export const ErrorResponse = z.object({
  success: z.boolean().default(false),
  error: z.string(),
  details: z.string().optional(),
});

export type ErrorResponse = {
  success: false;
  error: string;
  details?: string;
};

// MCP tool response type
export type MCPResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Pagination parameters
export const PaginationParams = z.object({
  page: z.number().min(1).default(1).describe('Page number (1-based)'),
  limit: z.number().min(1).max(100).default(20).describe('Number of items per page'),
  sortBy: z.string().optional().describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
});

export type PaginationParams = z.infer<typeof PaginationParams>;

// Paginated response
export const PaginatedResponse = z.object({
  items: z.array(z.any()),
  totalCount: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export type PaginatedResponse<T = any> = {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// Search parameters
export const SearchParams = z.object({
  query: z.string().describe('Search query'),
  categories: z.array(z.string()).optional().describe('Categories to search in'),
  tags: z.array(z.string()).optional().describe('Tags to filter by'),
  difficulty: z.string().optional().describe('Difficulty level filter'),
  maxPrepTime: z.string().optional().describe('Maximum preparation time'),
  maxCookTime: z.string().optional().describe('Maximum cooking time'),
});

export type SearchParams = z.infer<typeof SearchParams>;

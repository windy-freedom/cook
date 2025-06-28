import { z } from 'zod';
import { Recipe } from './recipe.js';

// Meal types
export const MealType = z.enum(['早餐', '午餐', '晚餐', '加餐', '夜宵']);
export type MealType = z.infer<typeof MealType>;

// Days of the week
export const DayOfWeek = z.enum([
  '周一', '周二', '周三', '周四', '周五', '周六', '周日'
]);
export type DayOfWeek = z.infer<typeof DayOfWeek>;

// Dietary restrictions
export const DietaryRestriction = z.enum([
  '素食', '纯素食', '无麸质', '低盐', '低糖', '低脂', '高蛋白', '无坚果', '无海鲜', '无乳制品'
]);
export type DietaryRestriction = z.infer<typeof DietaryRestriction>;

// Meal plan preferences
export const MealPlanPreferences = z.object({
  numberOfPeople: z.number().min(1).describe('Number of people to cook for'),
  dietaryRestrictions: z.array(DietaryRestriction).optional().describe('Dietary restrictions to consider'),
  allergies: z.array(z.string()).optional().describe('Specific food allergies'),
  preferredCategories: z.array(z.string()).optional().describe('Preferred recipe categories'),
  excludedCategories: z.array(z.string()).optional().describe('Categories to exclude'),
  budgetLevel: z.enum(['经济', '中等', '高档']).optional().describe('Budget preference'),
  cookingSkillLevel: z.enum(['初学者', '中级', '高级']).optional().describe('Cooking skill level'),
  timeConstraints: z.object({
    maxPrepTime: z.string().optional().describe('Maximum prep time per meal'),
    maxCookTime: z.string().optional().describe('Maximum cooking time per meal'),
  }).optional(),
  nutritionalGoals: z.object({
    targetCalories: z.number().optional().describe('Target calories per day'),
    highProtein: z.boolean().optional().describe('Focus on high protein meals'),
    lowCarb: z.boolean().optional().describe('Focus on low carb meals'),
    balanced: z.boolean().optional().describe('Focus on balanced nutrition'),
  }).optional(),
});

export type MealPlanPreferences = z.infer<typeof MealPlanPreferences>;

// Single meal in a meal plan
export const PlannedMeal = z.object({
  mealType: MealType.describe('Type of meal'),
  recipe: Recipe.describe('Recipe for this meal'),
  servings: z.number().describe('Number of servings to prepare'),
  notes: z.string().optional().describe('Additional notes for this meal'),
});

export type PlannedMeal = z.infer<typeof PlannedMeal>;

// Daily meal plan
export const DailyMealPlan = z.object({
  day: DayOfWeek.describe('Day of the week'),
  date: z.string().describe('Date in ISO format'),
  meals: z.array(PlannedMeal).describe('Meals planned for this day'),
  totalCalories: z.number().optional().describe('Total estimated calories for the day'),
  notes: z.string().optional().describe('Notes for the day'),
});

export type DailyMealPlan = z.infer<typeof DailyMealPlan>;

// Weekly meal plan
export const WeeklyMealPlan = z.object({
  id: z.string().describe('Unique meal plan identifier'),
  name: z.string().describe('Name of the meal plan'),
  startDate: z.string().describe('Start date of the week (ISO format)'),
  endDate: z.string().describe('End date of the week (ISO format)'),
  preferences: MealPlanPreferences.describe('Preferences used to generate this plan'),
  dailyPlans: z.array(DailyMealPlan).describe('Daily meal plans for the week'),
  createdAt: z.string().describe('Creation timestamp'),
  lastModified: z.string().describe('Last modification timestamp'),
});

export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlan>;

// Meal plan generation request
export const MealPlanRequest = z.object({
  preferences: MealPlanPreferences.describe('User preferences for meal planning'),
  startDate: z.string().optional().describe('Start date for the meal plan (defaults to next Monday)'),
  planDuration: z.number().optional().default(7).describe('Number of days to plan (default: 7)'),
});

export type MealPlanRequest = z.infer<typeof MealPlanRequest>;

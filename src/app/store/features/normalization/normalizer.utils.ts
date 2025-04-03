import { createEntitySchema, EntitySchemaMap } from './schema';

/**
 * Type alias for normalized entity collections
 */
export type NormalizedEntities<T> = Record<string, T>;

/**
 * Interface for normalized data structure with more precise typing
 */
export interface NormalizedData {
  result: string | string[];
  entities: Record<string, Record<string, unknown>>;
}

/**
 * Helper type to extract normalized entity type from schema
 */
export type EntityType<T extends EntitySchemaMap, K extends keyof T> = 
  T[K] extends ReturnType<typeof createEntitySchema<infer U>> ? U : never;

/**
 * Generate typed normalized data structure based on schema map
 */
export interface TypedNormalizedData<T extends EntitySchemaMap> {
  result: string | string[];
  entities: {
    [K in keyof T]: Record<string, EntityType<T, K>>;
  };
}

/**
 * Get type-safe access to normalized data structure
 * 
 * @param schemaMap The schema map definition
 * @param data The normalized data
 * @returns Typed normalized data structure
 */
export function getTypedNormalizedData<T extends EntitySchemaMap>(
  schemaMap: T, 
  data: NormalizedData
): TypedNormalizedData<T> {
  return data as TypedNormalizedData<T>;
} 
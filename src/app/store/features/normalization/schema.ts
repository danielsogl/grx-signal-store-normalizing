import { Type } from '@angular/core';

/**
 * Represents an entity ID, which can be a string or a number
 */
export type EntityId = string | number;

/**
 * Represents a map of entities where the key is the entity ID
 */
export type EntityMap<T> = Record<EntityId, T>;

/**
 * Represents the normalized data structure
 */
export interface NormalizedData {
  entities: Record<string, EntityMap<unknown>>;
  result: EntityId | EntityId[] | Record<string, EntityId | EntityId[]>;
}

/**
 * Defines a one-to-one relationship between entities
 */
export interface HasOne<T extends string> {
  type: T;
  isArray: false;
}

/**
 * Defines a one-to-many relationship between entities
 */
export interface HasMany<T extends string> {
  type: T;
  isArray: true;
}

/**
 * Defines a relationship between entities
 */
export type RelationshipConfig = HasOne<string> | HasMany<string>;

/**
 * Creates a one-to-one relationship configuration
 */
export function hasOne<T extends string>(entityType: T): HasOne<T> {
  return { type: entityType, isArray: false };
}

/**
 * Creates a one-to-many relationship configuration
 */
export function hasMany<T extends string>(entityType: T): HasMany<T> {
  return { type: entityType, isArray: true };
}

/**
 * Configuration for an entity schema
 */
export interface EntitySchema<T> {
  /**
   * The entity type
   */
  entity: Type<T>;
  
  /**
   * The property used as ID (defaults to 'id')
   */
  idKey?: string;
  
  /**
   * Relationships with other entities
   */
  relationships?: Record<string, RelationshipConfig>;
}

/**
 * A map of entity schemas
 */
export type EntitySchemaMap = Record<string, EntitySchema<unknown>>;

/**
 * Creates an entity schema with the specified ID key and relationships
 */
export function createEntitySchema<T>(
  idKey = 'id',
  relationships: Record<string, RelationshipConfig> = {}
): EntitySchema<T> {
  return {
    entity: {} as Type<T>,
    idKey,
    relationships
  };
}

/**
 * Type for a normalized entity where references are replaced with IDs
 */
export type NormalizedEntity<T> = 
  T & { id: EntityId };

/**
 * Options for the normalization process
 */
export interface NormalizationOptions {
  /**
   * Whether to merge the normalized data with existing data
   */
  merge?: boolean;
}

/**
 * Result of an operation that may succeed or fail
 */
export type OperationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Type for a selector that returns an entity by ID
 */
export type EntityByIdSelector<T> = (id: EntityId) => T | null;

/**
 * Type for a selector that returns all entities of a type
 */
export type EntityListSelector<T> = () => T[];

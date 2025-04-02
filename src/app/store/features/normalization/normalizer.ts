import { EntityId, EntityMap, EntitySchema, EntitySchemaMap, NormalizedData } from './schema';

/**
 * Normalizes an object or array of objects according to the schema
 * 
 * @param input The input data to normalize
 * @param schema The schema to use for normalization
 * @param schemaMap The complete schema map for resolving relationships
 * @returns Normalized data structure
 */
export function normalize<T>(
  input: T | T[],
  schemaKey: string,
  schemaMap: EntitySchemaMap
): NormalizedData {
  // Initialize the normalized data structure
  const normalizedData: NormalizedData = {
    entities: {},
    result: Array.isArray(input) ? [] : undefined as unknown as EntityId
  };

  // Get the schema for the current entity type
  const schema = schemaMap[schemaKey];
  if (!schema) {
    throw new Error(`Schema not found for key: ${schemaKey}`);
  }

  // Process the input data
  if (Array.isArray(input)) {
    // Handle array of entities
    (normalizedData.result as EntityId[]) = input.map(item => 
      processEntity(item, schemaKey, schema, schemaMap, normalizedData)
    );
  } else if (input) {
    // Handle single entity
    normalizedData.result = processEntity(input, schemaKey, schema, schemaMap, normalizedData);
  }

  return normalizedData;
}

/**
 * Processes a single entity, extracting its ID and relationships
 * 
 * @param entity The entity to process
 * @param entityType The type of the entity
 * @param schema The schema for this entity type
 * @param schemaMap The complete schema map
 * @param normalizedData The normalized data being built
 * @returns The ID of the processed entity
 */
function processEntity<T>(
  entity: T,
  entityType: string,
  schema: EntitySchema<T>,
  schemaMap: EntitySchemaMap,
  normalizedData: NormalizedData
): EntityId {
  // Get the ID key for this entity type (default to 'id')
  const idKey = schema.idKey || 'id';
  
  // Extract the entity ID
  const entityId = (entity as unknown as Record<string, EntityId>)[idKey];
  if (entityId === undefined) {
    throw new Error(`Entity ID not found using key '${idKey}' for type '${entityType}'`);
  }

  // Initialize the entity collection if it doesn't exist
  if (!normalizedData.entities[entityType]) {
    normalizedData.entities[entityType] = {};
  }

  // Create a copy of the entity to avoid modifying the original
  const processedEntity = { ...entity as object } as Record<string, unknown>;

  // Process relationships if they exist
  if (schema.relationships) {
    for (const [key, relationshipConfig] of Object.entries(schema.relationships)) {
      const value = processedEntity[key];
      
      if (value !== undefined) {
        if (relationshipConfig.isArray && Array.isArray(value)) {
          // Handle array of related entities
          processedEntity[key] = value.map(item => 
            processEntity(
              item, 
              relationshipConfig.type, 
              schemaMap[relationshipConfig.type], 
              schemaMap, 
              normalizedData
            )
          );
        } else if (!relationshipConfig.isArray && value !== null) {
          // Handle single related entity
          processedEntity[key] = processEntity(
            value as object, 
            relationshipConfig.type, 
            schemaMap[relationshipConfig.type], 
            schemaMap, 
            normalizedData
          );
        }
      }
    }
  }

  // Store the processed entity
  normalizedData.entities[entityType][entityId] = processedEntity;

  return entityId;
}

/**
 * Denormalizes data based on the schema
 * 
 * @param entityId The ID of the entity to denormalize
 * @param entityType The type of the entity
 * @param entities The normalized entities
 * @param schemaMap The schema map
 * @returns The denormalized entity
 */
export function denormalize<T>(
  entityId: EntityId | EntityId[],
  entityType: string,
  entities: Record<string, EntityMap<unknown>>,
  schemaMap: EntitySchemaMap
): T | T[] | null {
  // Handle array of IDs
  if (Array.isArray(entityId)) {
    return entityId.map(id => 
      denormalizeSingle(id, entityType, entities, schemaMap)
    ).filter(Boolean) as T[];
  }
  
  // Handle single ID
  return denormalizeSingle(entityId, entityType, entities, schemaMap) as T;
}

/**
 * Denormalizes a single entity
 * 
 * @param entityId The ID of the entity to denormalize
 * @param entityType The type of the entity
 * @param entities The normalized entities
 * @param schemaMap The schema map
 * @returns The denormalized entity
 */
function denormalizeSingle<T>(
  entityId: EntityId,
  entityType: string,
  entities: Record<string, EntityMap<unknown>>,
  schemaMap: EntitySchemaMap
): T | null {
  // Check if the entity exists
  if (!entities[entityType] || !entities[entityType][entityId]) {
    return null;
  }

  // Get the entity and schema
  const entity = entities[entityType][entityId] as Record<string, unknown>;
  const schema = schemaMap[entityType];

  // Create a copy of the entity to avoid modifying the original
  const denormalizedEntity = { ...entity };

  // Process relationships if they exist
  if (schema.relationships) {
    for (const [key, relationshipConfig] of Object.entries(schema.relationships)) {
      const value = denormalizedEntity[key];
      
      if (value !== undefined) {
        if (relationshipConfig.isArray && Array.isArray(value)) {
          // Handle array of related entities
          denormalizedEntity[key] = value.map(id => 
            denormalizeSingle(
              id as EntityId, 
              relationshipConfig.type, 
              entities, 
              schemaMap
            )
          ).filter(Boolean);
        } else if (!relationshipConfig.isArray && value !== null) {
          // Handle single related entity
          denormalizedEntity[key] = denormalizeSingle(
            value as EntityId, 
            relationshipConfig.type, 
            entities, 
            schemaMap
          );
        }
      }
    }
  }

  return denormalizedEntity as T;
}

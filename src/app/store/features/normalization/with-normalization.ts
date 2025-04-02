import { computed, Signal } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  EntityId,
  EntityMap,
  EntitySchemaMap,
  OperationResult,
} from './schema';
import { denormalize, normalize } from './normalizer';

/**
 * State interface for the normalization feature
 */
export interface NormalizationState {
  /**
   * Map of entity collections
   */
  entities: Record<string, EntityMap<unknown>>;

  /**
   * Loading state for each entity type
   */
  loading: Record<string, boolean>;
}

/**
 * Creates a custom signal store feature for normalizing data
 *
 * @param schemas Map of entity schemas
 * @returns A signal store feature for normalizing data
 */
export function withNormalization<T extends EntitySchemaMap>(schemas: T) {
  // Get the entity types from the schema map
  const entityTypes = Object.keys(schemas);

  // Create the initial state
  const initialEntities: Record<string, EntityMap<unknown>> = {};
  const initialLoading: Record<string, boolean> = {};

  // Initialize the state for each entity type
  entityTypes.forEach((entityType) => {
    initialEntities[entityType] = {};
    initialLoading[entityType] = false;
  });

  return signalStoreFeature(
    // Add state for entities and loading
    withState<NormalizationState>({
      entities: initialEntities,
      loading: initialLoading,
    }),

    // Add computed properties
    withComputed((state) => {
      // Create a computed property for each entity type
      const entitySelectors: Record<string, Signal<unknown>> = {};

      entityTypes.forEach((entityType) => {
        // Create a selector for all entities of this type
        entitySelectors[`${entityType}List`] = computed(() => {
          const entityMap = state.entities()[entityType] || {};
          return Object.values(entityMap);
        });

        // Create a selector for the loading state of this type
        entitySelectors[`${entityType}Loading`] = computed(() => {
          return state.loading()[entityType] || false;
        });
      });

      return entitySelectors;
    }),

    // Add methods
    withMethods((store) => {
      // Create a method to get an entity by ID
      function getEntityById<E>(entityType: string, id: EntityId): E | null {
        const entities = store.entities();
        if (!entities[entityType] || !entities[entityType][id]) {
          return null;
        }
        return entities[entityType][id] as E;
      }

      // Create a method to get a denormalized entity as a signal
      function getDenormalizedEntity<E>(
        entityType: string,
        id: EntityId
      ): Signal<E | null> {
        return computed(() => {
          const result = denormalize<E>(
            id,
            entityType,
            store.entities(),
            schemas
          );
          // Since we're passing a single ID, we know the result will be a single entity or null
          return result as E | null;
        });
      }

      // Create a method to get all denormalized entities of a type as a signal
      function getDenormalizedEntities<E>(entityType: string): Signal<E[]> {
        return computed(() => {
          const entities = store.entities();
          if (!entities[entityType]) {
            return [];
          }

          const ids = Object.keys(entities[entityType]);
          return denormalize<E>(
            ids as EntityId[],
            entityType,
            entities,
            schemas
          ) as E[];
        });
      }

      // Create a method to normalize and add data
      function addNormalizedData<E>(data: E | E[], entityType: string): void {
        // Set loading state
        const loadingState = { ...store.loading() };
        loadingState[entityType] = true;
        patchState(store, { loading: loadingState });

        try {
          // Normalize the data
          const normalizedData = normalize(data, entityType, schemas);

          // Update the entities
          const updatedEntities = { ...store.entities() };

          // Merge the normalized entities into the store
          Object.entries(normalizedData.entities).forEach(
            ([type, entities]) => {
              updatedEntities[type] = {
                ...updatedEntities[type],
                ...entities,
              };
            }
          );

          // Update the store
          patchState(store, { entities: updatedEntities });
        } finally {
          // Reset loading state
          const loadingState = { ...store.loading() };
          loadingState[entityType] = false;
          patchState(store, { loading: loadingState });
        }
      }

      // Create a method to remove an entity
      function removeEntity(entityType: string, id: EntityId): void {
        const entities = { ...store.entities() };
        if (!entities[entityType] || !entities[entityType][id]) {
          return;
        }

        // Create a copy of the entity map without the entity to remove
        const entityMap = { ...entities[entityType] };
        delete entityMap[id];

        // Update the entities
        entities[entityType] = entityMap;

        // Update the store
        patchState(store, { entities });
      }

      // Create a method to update an entity
      function updateEntity<E>(
        entityType: string,
        id: EntityId,
        changes: Partial<E>
      ): OperationResult<E> {
        const entities = { ...store.entities() };
        if (!entities[entityType] || !entities[entityType][id]) {
          return {
            success: false,
            error: `Entity with ID ${id} not found in collection ${entityType}`,
          };
        }

        try {
          // Create a copy of the entity map
          const entityMap = { ...entities[entityType] };

          // Update the entity
          entityMap[id] = {
            ...(entityMap[id] as object),
            ...changes,
          };

          // Update the entities
          entities[entityType] = entityMap;

          // Update the store
          patchState(store, { entities });

          return {
            success: true,
            data: entityMap[id] as E,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unknown error updating entity',
          };
        }
      }

      // Create a selector method for denormalized data signals
      function selectDenormalized<E>(entityType: string): Signal<E[]>;
      function selectDenormalized<E>(
        entityType: string,
        id: EntityId
      ): Signal<E | null>;
      function selectDenormalized<E>(
        entityType: string,
        id?: EntityId
      ): Signal<E[] | E | null> {
        if (id === undefined) {
          // Return signal for all entities of the type
          return getDenormalizedEntities<E>(entityType);
        } else {
          // Return signal for a single entity
          return getDenormalizedEntity<E>(entityType, id);
        }
      }

      return {
        getEntityById,
        getDenormalizedEntity,
        getDenormalizedEntities,
        selectDenormalized,
        addNormalizedData,
        removeEntity,
        updateEntity,
      };
    })
  );
}

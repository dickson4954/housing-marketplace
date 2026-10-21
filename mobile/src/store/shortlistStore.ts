import { useSyncExternalStore } from 'react';

/**
 * ================================================================
 * SHORTLIST STORE
 * ================================================================
 *
 * Temporary frontend store for saved properties.
 *
 * IMPORTANT:
 * - Customers can save/unsave properties.
 * - Admin does NOT control this store directly.
 * - Admin controls the actual property listings from the admin
 *   dashboard/backend.
 * - Later, this store will be connected to the backend so each
 *   customer has their own persistent shortlist.
 * ================================================================
 */

/**
 * Start with an empty shortlist.
 *
 * We do not hardcode properties here because properties will
 * eventually be created and managed by the admin.
 */
const INITIAL_SHORTLIST: string[] = [];

let shortlistedIds: string[] = [
  ...INITIAL_SHORTLIST,
];

/**
 * Components subscribed to the store.
 */
const listeners = new Set<() => void>();

/**
 * Subscribe a component to shortlist changes.
 */
const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Return the current shortlist.
 *
 * The same array reference is returned until the shortlist
 * actually changes. This works correctly with
 * useSyncExternalStore.
 */
const getSnapshot = () => shortlistedIds;

/**
 * Notify all screens using the shortlist store.
 */
const emit = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * ================================================================
 * TOGGLE SHORTLIST
 * ================================================================
 *
 * If the property is already saved:
 *   → remove it
 *
 * If it is not saved:
 *   → add it
 */
export const toggleShortlist = (
  propertyId: string,
) => {
  const alreadyShortlisted =
    shortlistedIds.includes(propertyId);

  if (alreadyShortlisted) {
    shortlistedIds = shortlistedIds.filter(
      (id) => id !== propertyId,
    );
  } else {
    shortlistedIds = [
      ...shortlistedIds,
      propertyId,
    ];
  }

  emit();
};

/**
 * ================================================================
 * REMOVE ONE PROPERTY
 * ================================================================
 */
export const removeFromShortlist = (
  propertyId: string,
) => {
  const updatedIds = shortlistedIds.filter(
    (id) => id !== propertyId,
  );

  if (
    updatedIds.length ===
    shortlistedIds.length
  ) {
    return;
  }

  shortlistedIds = updatedIds;

  emit();
};

/**
 * ================================================================
 * CLEAR ALL
 * ================================================================
 */
export const clearShortlist = () => {
  if (shortlistedIds.length === 0) {
    return;
  }

  shortlistedIds = [];

  emit();
};

/**
 * ================================================================
 * CHECK WHETHER A PROPERTY IS SAVED
 * ================================================================
 */
export const isPropertyShortlisted = (
  propertyId: string,
) => {
  return shortlistedIds.includes(propertyId);
};

/**
 * ================================================================
 * GET CURRENT SHORTLIST
 * ================================================================
 *
 * Useful later when we connect this to the backend.
 */
export const getShortlistedIds = () => {
  return shortlistedIds;
};

/**
 * ================================================================
 * REPLACE SHORTLIST
 * ================================================================
 *
 * This will be useful later when loading a customer's shortlist
 * from the backend after login.
 */
export const setShortlistedIds = (
  propertyIds: string[],
) => {
  shortlistedIds = [...propertyIds];

  emit();
};

/**
 * ================================================================
 * REACT HOOK
 * ================================================================
 */
export const useShortlist = () => {
  const ids = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  return {
    shortlistedIds: ids,

    isShortlisted: (
      propertyId: string,
    ) => ids.includes(propertyId),

    toggleShortlist,

    removeFromShortlist,

    clearShortlist,

    getShortlistedIds,

    setShortlistedIds,
  };
};
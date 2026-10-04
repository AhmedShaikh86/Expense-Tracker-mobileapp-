import * as Crypto from 'expo-crypto';

/** Generates a random unique id (UUID v4) for new rows. */
export function newId(): string {
  return Crypto.randomUUID();
}

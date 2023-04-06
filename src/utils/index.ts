/**
 * Removess *all* instances of key from a provided object (including children)
 * @param obj The object to modify
 * @param key The key to remove
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeKey(obj: any, key: string) {
  for (const prop in obj) {
    if (prop === key) delete obj[prop];
    else if (typeof obj[prop] === 'object') removeKey(obj[prop], key);
  }
}

export default {
  removeKey,
};

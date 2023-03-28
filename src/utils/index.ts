export function removeKey(obj: any, key: string) {
    for(const prop in obj) {
      if (prop === key)
        delete obj[prop];
      else if (typeof obj[prop] === 'object')
        removeKey(obj[prop], key);
    }
  }

export default {
    removeKey,
}
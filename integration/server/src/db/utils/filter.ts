export const applyFilters = <T, K extends keyof T>(filter: Partial<Record<K, any>>): (item: T) => boolean => {
  const filters = (Object.keys(filter) as Array<K>).filter(key => filter[key] !== undefined);
  return (item: T) => filters.every(field => filter[field] === item[field]);
};

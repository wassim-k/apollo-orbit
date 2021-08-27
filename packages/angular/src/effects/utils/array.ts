export function flatten<T>(array: Array<Array<T>>): Array<T> {
  return ([] as Array<T>).concat(...array);
}

export function partition<T>(array: ReadonlyArray<T>, condition: (item: T) => boolean): [Array<T>, Array<T>] {
  return array.reduce<[Array<T>, Array<T>]>(
    (result: [Array<T>, Array<T>], item: T) => condition(item)
      ? [[...result[0], item], result[1]]
      : [result[0], [...result[1], item]],
    [[], []]
  );
}

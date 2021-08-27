export function createSymbol(description: string): symbol {
    return typeof Symbol === 'function'
        ? Symbol(description)
        : `@@${description}_${Math.random()}` as any;
}

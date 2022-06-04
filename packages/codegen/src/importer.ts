const alphabetically = (a: string, b: string): number => a.localeCompare(b);

const unique = <T>(array: Array<T>, key: (item: T) => string): Array<T> => {
    return Object.values(
        array.reduce<{ [key: string]: T }>((acc, item) => ({ ...acc, [key(item)]: item }), {})
    );
};

interface ImportEntry {
    identifier: string;
    as?: string;
}

export class Importer {
    private readonly imports: { [from: string]: Array<ImportEntry> | undefined } = {};

    public registerImport(identifier: string, from: string, as?: string): void {
        this.imports[from] = this.imports[from] ?? [];
        this.imports[from]?.push({ identifier, as });
    }

    public getImports(): Array<string> {
        return Object
            .keys(this.imports)
            .sort(alphabetically)
            .map(from => {
                const imports = [...this.imports[from]?.values() ?? []];
                const identifiers = unique(imports, a => a.identifier)
                    .sort((a, b) => a.identifier.localeCompare(b.identifier))
                    .map(({ identifier, as }) => as === undefined
                        ? `${identifier}`
                        : `${identifier} as ${as}`)
                    .join(', ');
                return `import { ${identifiers} } from '${from}';`;
            });
    }
}

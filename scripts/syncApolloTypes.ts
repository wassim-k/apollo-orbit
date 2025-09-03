/* eslint-disable no-bitwise */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const TARGET_FILE_PATHS = [
  path.resolve(__dirname, '../packages/angular/src/types.ts'),
  path.resolve(__dirname, '../packages/angular/src/signals/query.ts'),
  path.resolve(__dirname, '../packages/angular/src/signals/subscription.ts'),
  path.resolve(__dirname, '../packages/angular/src/signals/fragment.ts')
];

const logger = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅  ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.log(`❌  ${msg}`)
};

interface ImportInfo {
  commentRange: { start: number; end: number };
  fullCommentText: string;
  importPath: string;
  typeName: string;
  asName?: string;
  namespace?: string;
}

interface TypeDefinition {
  typeName: string;
  definitionText: string;
  insertionPoint: number;
  existingRange?: { start: number; end: number };
}

function resolvePackageSourcePath(importPath: string, targetDir: string): string {
  const packageJsonPath = require.resolve(`${importPath}/package.json`, { paths: [targetDir, __dirname] });
  const packageDir = path.dirname(packageJsonPath);
  const { types, typings } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return path.resolve(packageDir, types ?? typings);
}

function findTypeDeclarationNodeInSource(
  tsProgram: ts.Program,
  tsChecker: ts.TypeChecker,
  typeName: string,
  sourceFilePath: string,
  namespace?: string
): ts.Declaration | null {
  const sourceFile = tsProgram.getSourceFile(sourceFilePath);
  if (!sourceFile) {
    logger.error(`Could not get SourceFile for ${sourceFilePath} from the program.`);
    return null;
  }

  const moduleSymbol = tsChecker.getSymbolAtLocation(sourceFile);

  if (moduleSymbol) {
    // First, try to find the namespace if provided
    if (namespace !== undefined) {
      const namespaceSymbol = tsChecker.getExportsOfModule(moduleSymbol).find(exp => exp.getName() === namespace);
      if (namespaceSymbol) {
        // Get the type of the namespace
        const namespaceType = tsChecker.getTypeOfSymbolAtLocation(namespaceSymbol, sourceFile);
        const namespaceSymbolResolved = namespaceType.getSymbol();

        if (namespaceSymbolResolved) {
          // Look for the type within the namespace
          const namespaceExports = tsChecker.getExportsOfModule(namespaceSymbolResolved);
          const targetSymbol = namespaceExports.find(exp => exp.getName() === typeName);

          if (targetSymbol) {
            let declarationSymbol = targetSymbol;

            while ((declarationSymbol.getFlags() & ts.SymbolFlags.Alias) !== 0) {
              const aliasedSymbol = tsChecker.getAliasedSymbol(declarationSymbol);
              if (aliasedSymbol === declarationSymbol || (aliasedSymbol.declarations?.length ?? 0) === 0) break;
              declarationSymbol = aliasedSymbol;
            }

            return declarationSymbol.declarations?.find(d => ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d)) ?? null;
          }
        }
      }
    }

    // Fallback to direct export lookup
    const targetExportSymbol = tsChecker.getExportsOfModule(moduleSymbol).find(exp => exp.getName() === typeName);
    if (targetExportSymbol) {
      let declarationSymbol = targetExportSymbol;

      while ((declarationSymbol.getFlags() & ts.SymbolFlags.Alias) !== 0) {
        const aliasedSymbol = tsChecker.getAliasedSymbol(declarationSymbol);
        if (aliasedSymbol === declarationSymbol || (aliasedSymbol.declarations?.length ?? 0) === 0) break;
        declarationSymbol = aliasedSymbol;
      }

      return declarationSymbol.declarations?.find(d => ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d)) ?? null;
    }
  }

  // Manual fallback search
  let declaration: ts.Declaration | null = null;
  ts.forEachChild(sourceFile, node => {
    if (!declaration && (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      node.name.getText(sourceFile) === typeName &&
      node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
      declaration = node;
    }
  });

  return declaration;
}

function getProcessedDefinitionText(declarationNode: ts.Declaration, typeName: string, asName?: string): string {
  const sourceFile = declarationNode.getSourceFile();

  let definitionText = sourceFile.text.substring(
    declarationNode.getStart(sourceFile, false),
    declarationNode.getEnd()
  ).trim();

  definitionText = definitionText.replace(/\bOperationVariables\b/g, 'Variables');
  definitionText = definitionText.replace(/ +\n/g, '\n');

  if (!definitionText.startsWith('export ')) {
    definitionText = `export ${definitionText}`;
  }

  if (asName !== undefined && asName !== typeName) {
    definitionText = definitionText.replace(
      new RegExp(`(export\\s+(?:\\w+)\\s+)${typeName}\\b`),
      `$1${asName}`
    );
    logger.info(`Renamed type ${typeName} to ${asName}`);
  }

  if (typeName === 'WatchQueryOptions' && asName === undefined) {
    definitionText = definitionText.replace(/nextFetchPolicy\?: .*\n/g, 'nextFetchPolicy?: ApolloClient.WatchQueryOptions<TData, TVariables>[\'nextFetchPolicy\'];\n');
    definitionText = definitionText.replace(/\n {4}}/g, `

        /**
         * Whether or not observers should receive initial network loading status when subscribing to this observable.
         * @default true
         */
        notifyOnLoading?: boolean;
}`);
  }

  if (typeName === 'QueryOptions') {
    definitionText = definitionText.replace(/\n {4}}/g, `

        /**
         * Whether or not observers should receive initial network loading status when subscribing to this observable.
         * @default true
         */
        notifyOnLoading?: boolean;

        /**
         * Throw errors on the observable's error stream instead of assigning them to the error property of the result object.
         * @default true
         */
        throwError?: boolean;
}`);
  }

  if (asName === 'QueryResult') {
    // Find the start of the partial property's documentation
    const partialDocStart = definitionText.lastIndexOf('/**', definitionText.indexOf('partial: boolean;'));

    if (partialDocStart !== -1) {
      // Find the end of the partial property line
      const partialEnd = definitionText.indexOf('partial: boolean;') + 'partial: boolean;'.length;

      // Remove the partial property and its documentation
      definitionText = definitionText.substring(0, partialDocStart).trimEnd() + definitionText.substring(partialEnd);
    }

    // Replace double quotes with single quotes and add previousData property
    definitionText = definitionText.replace(/"/g, '\'').replace(/\n\s*}\s*&/, `

        /**
         * An object containing the result from the most recent _previous_ execution of this query.
         *
         * This value is \`undefined\` if this is the query's first execution.
         */
        previousData?: GetData<TData, TStates>;
} &`);
  }

  if (asName === 'SignalQueryOptions') {
    definitionText = definitionText.replace(
      '* The default value is `none`, meaning that the query result includes error details but not partial results.',
      '* The default value is `all`, meaning that the promise returned from `execute` method always resolves to a result with an optional `error` field.'
    );
    definitionText = definitionText.replace(/nextFetchPolicy\?: .*\n/g, 'nextFetchPolicy?: ApolloClient.WatchQueryOptions<TData, TVariables>[\'nextFetchPolicy\'];\n');
    definitionText = definitionText.replace(/\n {4}} & VariablesOption<NoInfer<TVariables>>;/g, `

        /**
         * Whether or not to track initial network loading status.
         * @default true
         */
        notifyOnLoading?: boolean;

        /**
         * Whether to execute query immediately or lazily via \`execute\` method.
         */
        lazy?: boolean;

        /**
         * Custom injector to use for this query.
         */
        injector?: Injector;
  } & (
    | {
      /**
       * Whether to execute query immediately or lazily via \`execute\` method.
       */
      lazy: true;

      /**
      * A function or signal returning an object containing all of the GraphQL variables your query requires to execute.
      *
      * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
      *
      */
      variables?: () => TVariables | undefined;
    }
    | SignalVariablesOption<NoInfer<TVariables>>
  );`);
  }

  if (asName === 'SubscriptionOptions') {
    definitionText = definitionText.replace(/query:/g, 'subscription:');
  }

  if (typeName === 'SubscribeToMoreOptions') {
    definitionText = definitionText.replace(/document:/g, 'subscription:');
  }

  if (asName === 'SignalSubscriptionOptions') {
    definitionText = definitionText.replace(/query: (.*?);/g, 'subscription: $1;');
    definitionText = definitionText.replace(/\n {4}} & VariablesOption<NoInfer<TVariables>>/, `

        /**
         * Whether to execute subscription immediately or lazily via \`execute\` method.
         */
        lazy?: boolean;

        /**
         * Callback for when new data is received
         */
        onData?: (data: TData) => void;

        /**
         * Callback for when the subscription is completed
         */
        onComplete?: () => void;

        /**
         * Callback for when an error occurs
         */
        onError?: (error: ErrorLike) => void;

        /**
         * Custom injector to use for this subscription.
         */
        injector?: Injector;
} & (
  | {
    /**
     * Whether to execute subscription immediately or lazily via \`execute\` method.
     */
    lazy: true;

    /**
    * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
    *
    * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
    */
    variables?: () => TVariables | undefined;
  }
  | SignalVariablesOption<NoInfer<TVariables>>
)`);
  }

  if (asName === 'SignalFragmentOptions') {
    definitionText = definitionText.replace('TData, TVars', 'TData = unknown, TVariables extends Variables = Variables');
    definitionText = definitionText.replace(/from: (.*?);/g, `from:
          | $1
          | (() => $1);`);
    definitionText = definitionText.replace(/variables\?: (.*?);/g, 'variables?: NoInfer<TVariables> | (() => NoInfer<TVariables>);');
    definitionText = definitionText.replace('TVars', 'TVariables');
    definitionText = definitionText.replace('\n    }', `

        /**
         * Custom injector to use for this signal.
         */
        injector?: Injector;
}`);
  }

  return definitionText;
}

function findExistingDefinitionRange(sourceFile: ts.SourceFile, typeName: string): { start: number; end: number } | null {
  function visit(node: ts.Node): { start: number; end: number } | null {
    return (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      (node.name.getText(sourceFile) === typeName) &&
      node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)
      ? { start: node.getStart(sourceFile, false), end: node.getEnd() }
      : ts.forEachChild(node, visit) ?? null;
  }

  return visit(sourceFile);
}

function extractImports(filePath: string): Array<ImportInfo> {
  logger.info(`Extracting imports from file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    logger.error(`Error: Target file not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: Array<ImportInfo> = [];
  const regex = /^\s*(\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?)\s*$/gm;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const [, fullCommentText, importSpecifiers, importPath] = match;

    for (const specifier of importSpecifiers.split(',').map(s => s.trim()).filter(Boolean)) {
      const asMatch = /^([^{}]+?)\s+as\s+([^{}]+?)$/.exec(specifier);

      let typeName: string;
      let asName: string | undefined;
      let namespace: string | undefined;

      if (asMatch) {
        const sourceName = asMatch[1].trim();
        asName = asMatch[2].trim();
        const { namespace: ns, typeName: tn } = splitNamespace(sourceName);
        namespace = ns;
        typeName = tn;
      } else {
        const { namespace: ns, typeName: tn } = splitNamespace(specifier);
        namespace = ns;
        typeName = tn;
      }

      imports.push({
        commentRange: { start: match.index, end: match.index + match[0].length },
        fullCommentText,
        importPath,
        typeName,
        asName,
        namespace
      });
    }
  }

  return imports;
}

function splitNamespace(specifier: string): { namespace?: string; typeName: string } {
  const namespacedMatch = /^(\w+)\.(\w+)$/.exec(specifier);
  if (namespacedMatch) {
    return { namespace: namespacedMatch[1], typeName: namespacedMatch[2] };
  } else {
    return { typeName: specifier };
  }
}

function processTargetFile(filePath: string, tsProgram: ts.Program, tsChecker: ts.TypeChecker, imports: Array<ImportInfo>): void {
  logger.info(`Processing target file: ${filePath}`);
  if (imports.length === 0) {
    logger.info(`No package import comments found in ${filePath}. Skipping.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(path.basename(filePath), fileContent, ts.ScriptTarget.Latest, true);
  const targetDir = path.dirname(filePath);

  const typeDefinitions = imports
    .map(importInfo => {
      const sourcePath = resolvePackageSourcePath(importInfo.importPath, targetDir);
      const typeName = importInfo.typeName;
      const finalTypeName = importInfo.asName ?? typeName;
      const existingRange = findExistingDefinitionRange(sourceFile, finalTypeName);

      const fullName = importInfo.namespace !== undefined ? `${importInfo.namespace}.${typeName}` : typeName;
      logger.info(`Resolving: ${fullName} from ${path.relative(process.cwd(), sourcePath)}...`);

      const declarationNode = findTypeDeclarationNodeInSource(tsProgram, tsChecker, typeName, sourcePath, importInfo.namespace);
      if (!declarationNode) {
        logger.warning(`Could not resolve declaration node for '${fullName}'.`);
        return null;
      }

      const definitionText = getProcessedDefinitionText(declarationNode, typeName, importInfo.asName);
      logger.success(`Resolved '${fullName}${importInfo.asName !== undefined ? ` as ${importInfo.asName}` : ''}'`);

      return {
        typeName: finalTypeName,
        definitionText,
        insertionPoint: importInfo.commentRange.end,
        existingRange
      };
    })
    .filter(Boolean) as Array<TypeDefinition>;

  if (typeDefinitions.length === 0) {
    logger.info(`No type definitions to update in ${filePath}.`);
    return;
  }

  let updatedContent = fileContent;
  let changesCount = 0;

  typeDefinitions
    .filter(def => def.existingRange)
    .sort((a, b) => (b.existingRange?.start ?? 0) - (a.existingRange?.start ?? 0))
    .forEach(def => {
      const { existingRange, definitionText, typeName } = def;
      if (!existingRange) return;

      const currentText = fileContent.substring(existingRange.start, existingRange.end);
      if (currentText.trim() !== definitionText.trim()) {
        updatedContent = updatedContent.substring(0, existingRange.start) + definitionText + updatedContent.substring(existingRange.end);
        changesCount++;
        logger.info(`Updated existing definition for '${typeName}'`);
      } else {
        logger.info(`Definition for '${typeName}' already up-to-date.`);
      }
    });

  const insertionGroups = typeDefinitions
    .filter(def => !def.existingRange)
    .reduce((groups, def) => {
      const point = def.insertionPoint;
      groups.set(point, [...(groups.get(point) ?? []), def.definitionText]);
      return groups;
    }, new Map<number, Array<string>>());

  [...insertionGroups.entries()]
    .sort(([a], [b]) => b - a)
    .forEach(([point, texts]) => {
      const insertText = '\n\n' + texts.join('\n\n');
      updatedContent = updatedContent.substring(0, point) + insertText + updatedContent.substring(point);
      changesCount += texts.length;
    });

  if (changesCount > 0) {
    try {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      logger.success(`Updated ${filePath} (${changesCount} modifications).`);
    } catch (err: any) {
      logger.error(`Error writing to ${filePath}: ${err.message}`);
    }
  } else {
    logger.info(`${filePath} already up-to-date.`);
  }
}

function main(): void {
  logger.info('Starting type sync script...');
  const existingTargets = TARGET_FILE_PATHS.filter(filePath => fs.existsSync(filePath));

  if (existingTargets.length === 0) {
    logger.info('No target files found. Nothing to sync.');
    return;
  }

  const importsByFile = new Map<string, Array<ImportInfo>>();
  const sourceFilePaths = new Set<string>();

  for (const targetPath of existingTargets) {
    const imports = extractImports(targetPath);
    importsByFile.set(targetPath, imports);

    for (const importInfo of imports) {
      const resolvedPath = resolvePackageSourcePath(importInfo.importPath, path.dirname(targetPath));
      sourceFilePaths.add(resolvedPath);
    }
  }

  if (sourceFilePaths.size === 0) {
    logger.error('Could not resolve source files for imports. Aborting.');
    process.exit(1);
  }

  logger.info('Creating TypeScript program...');
  const tsProgram = ts.createProgram(Array.from(sourceFilePaths), {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    esModuleInterop: true
  });

  const tsChecker = tsProgram.getTypeChecker();
  logger.success('Program context created.');

  for (const targetPath of existingTargets) {
    processTargetFile(targetPath, tsProgram, tsChecker, importsByFile.get(targetPath) ?? []);
  }

  logger.success('Type sync finished.');
}

try {
  main();
} catch (error: any) {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}

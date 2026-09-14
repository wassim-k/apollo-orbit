/* eslint-disable no-bitwise */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { amend, normalizeDefinitionText, reindent, removeIgnoredMembers } from './amendments';
import { logger } from './logger';
import { REPO_ROOT } from './repoRoot';
import { applyTextEdits, writePreservingEol } from './sourceFile';

export const TARGET_FILE_PATHS = [
  path.resolve(REPO_ROOT, 'packages/angular/src/apollo.ts'),
  path.resolve(REPO_ROOT, 'packages/angular/src/types.ts'),
  path.resolve(REPO_ROOT, 'packages/angular/src/signals/query.ts'),
  path.resolve(REPO_ROOT, 'packages/angular/src/signals/subscription.ts'),
  path.resolve(REPO_ROOT, 'packages/angular/src/signals/fragment.ts'),
  path.resolve(REPO_ROOT, 'packages/angular/src/signals/apolloSignal.ts')
];

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
      return null;
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

  let definitionText = sourceFile.text
    .substring(
      declarationNode.getStart(sourceFile, false),
      declarationNode.getEnd()
    )
    .trim();

  definitionText = reindent(definitionText);

  definitionText = normalizeDefinitionText(definitionText);
  definitionText = removeIgnoredMembers(definitionText);

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

  return amend(definitionText, asName ?? typeName);
}

/**
 * The overloads of a copied method, as public members of the class copying them.
 */
function getProcessedOverloadsText(overloadNodes: Array<ts.MethodDeclaration>, asName: string): string {
  const sourceFile = overloadNodes[0].getSourceFile();

  return normalizeDefinitionText(overloadNodes
    .map(node => sourceFile.text
      .substring(node.getStart(sourceFile, false), node.getEnd())
      .split('\n')
      // A member of a class is indented one level deeper in a `.d.ts` file than it is here.
      .map((line, index) => index === 0 ? line.trim() : line.replace(/^ +/, spaces => ' '.repeat(spaces.length / 2)))
      .join('\n'))
    .map(text => `public ${text.replace(new RegExp(`^${overloadNodes[0].name.getText(sourceFile)}\\b`), asName)}`)
    .map(text => amend(text, asName))
    // A signature Apollo declares on one line is wrapped, as every other signature here is.
    .map(text => text.includes('\n') ? text : text.replace(/^(.+?)\((.+)\): (.+);$/, '$1(\n    $2\n  ): $3;'))
    .join('\n\n  '));
}

/**
 * The overload signatures of a class method, which is what a method is declared as in a `.d.ts` file.
 */
function findMethodOverloadNodes(
  tsProgram: ts.Program,
  tsChecker: ts.TypeChecker,
  className: string,
  methodName: string,
  sourceFilePath: string
): Array<ts.MethodDeclaration> {
  const sourceFile = tsProgram.getSourceFile(sourceFilePath);
  const moduleSymbol = sourceFile !== undefined ? tsChecker.getSymbolAtLocation(sourceFile) : undefined;
  if (!moduleSymbol) return [];

  let classSymbol = tsChecker.getExportsOfModule(moduleSymbol).find(exp => exp.getName() === className);

  while (classSymbol !== undefined && (classSymbol.getFlags() & ts.SymbolFlags.Alias) !== 0) {
    const aliasedSymbol = tsChecker.getAliasedSymbol(classSymbol);
    if (aliasedSymbol === classSymbol) break;
    classSymbol = aliasedSymbol;
  }

  const classDeclaration = classSymbol?.declarations?.find(ts.isClassDeclaration);
  if (!classDeclaration) return [];

  return classDeclaration.members.filter((member): member is ts.MethodDeclaration =>
    ts.isMethodDeclaration(member) &&
    member.name.getText(classDeclaration.getSourceFile()) === methodName);
}

/**
 * The overload signatures a method is declared with, without the implementation signature that follows them.
 */
function findExistingMethodRange(sourceFile: ts.SourceFile, methodName: string): { start: number; end: number } | null {
  const classDeclaration = sourceFile.statements.find(ts.isClassDeclaration);
  if (!classDeclaration) return null;

  const overloads = classDeclaration.members.filter((member): member is ts.MethodDeclaration =>
    ts.isMethodDeclaration(member) &&
    member.body === undefined &&
    member.name.getText(sourceFile) === methodName);

  return overloads.length === 0
    ? null
    : { start: overloads[0].getStart(sourceFile, false), end: overloads[overloads.length - 1].getEnd() };
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
    throw new Error(`Target file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
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

function processTargetFile(filePath: string, tsProgram: ts.Program, tsChecker: ts.TypeChecker, imports: Array<ImportInfo>): string | undefined {
  logger.info(`Processing target file: ${filePath}`);
  if (imports.length === 0) {
    throw new Error(`No sync import comments found in ${filePath}.`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const sourceFile = ts.createSourceFile(path.basename(filePath), fileContent, ts.ScriptTarget.Latest, true);
  const targetDir = path.dirname(filePath);

  const typeDefinitions = imports
    .map(importInfo => {
      const sourcePath = resolvePackageSourcePath(importInfo.importPath, targetDir);
      const typeName = importInfo.typeName;
      const finalTypeName = importInfo.asName ?? typeName;
      const fullName = importInfo.namespace !== undefined ? `${importInfo.namespace}.${typeName}` : typeName;
      logger.info(`Resolving: ${fullName} from ${path.relative(process.cwd(), sourcePath)}...`);

      // A member of a class rather than a type of a namespace, so it is copied as the overloads it is declared with.
      const overloadNodes = importInfo.namespace !== undefined
        ? findMethodOverloadNodes(tsProgram, tsChecker, importInfo.namespace, typeName, sourcePath)
        : [];

      if (overloadNodes.length > 0) {
        logger.success(`Resolved '${fullName}' (${overloadNodes.length} overloads)`);

        return {
          typeName: finalTypeName,
          definitionText: getProcessedOverloadsText(overloadNodes, finalTypeName),
          insertionPoint: importInfo.commentRange.end,
          existingRange: findExistingMethodRange(sourceFile, finalTypeName) ?? undefined
        };
      }

      const existingRange = findExistingDefinitionRange(sourceFile, finalTypeName);

      const declarationNode = findTypeDeclarationNodeInSource(tsProgram, tsChecker, typeName, sourcePath, importInfo.namespace);
      if (!declarationNode) {
        throw new Error(`Could not resolve declaration node for '${fullName}' in ${filePath}.`);
      }

      const definitionText = getProcessedDefinitionText(declarationNode, typeName, importInfo.asName);
      logger.success(`Resolved '${fullName}${importInfo.asName !== undefined ? ` as ${importInfo.asName}` : ''}'`);

      return {
        typeName: finalTypeName,
        definitionText,
        insertionPoint: importInfo.commentRange.end,
        existingRange
      };
    }) as Array<TypeDefinition>;

  if (typeDefinitions.length === 0) {
    logger.info(`No type definitions to update in ${filePath}.`);
    return;
  }

  const edits = typeDefinitions.map(def => ({
    start: def.existingRange?.start ?? def.insertionPoint,
    end: def.existingRange?.end ?? def.insertionPoint,
    text: def.existingRange ? def.definitionText : '\n\n' + def.definitionText
  }));
  const updatedContent = applyTextEdits(fileContent, edits);
  return updatedContent === fileContent ? undefined : updatedContent;
}

/** Copies the Apollo Client types marked by `// import { ... }` comments into the target files. */
export function syncImportedTypes(targets = TARGET_FILE_PATHS, check = false): void {
  if (targets.length === 0) throw new Error('No target files supplied.');

  const importsByFile = new Map<string, Array<ImportInfo>>();
  const sourceFilePaths = new Set<string>();

  for (const targetPath of targets) {
    const imports = extractImports(targetPath);
    importsByFile.set(targetPath, imports);

    for (const importInfo of imports) {
      sourceFilePaths.add(resolvePackageSourcePath(importInfo.importPath, path.dirname(targetPath)));
    }
  }

  if (sourceFilePaths.size === 0) {
    throw new Error('No sync import comments found.');
  }

  logger.info('Creating TypeScript program...');
  const tsProgram = ts.createProgram(Array.from(sourceFilePaths), {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    esModuleInterop: true
  });

  const tsChecker = tsProgram.getTypeChecker();
  logger.success('Program context created.');

  // Resolve every declaration before changing any file.
  const updates = targets.map(filePath => ({
    filePath,
    content: processTargetFile(filePath, tsProgram, tsChecker, importsByFile.get(filePath) ?? [])
  })).filter(update => update.content !== undefined);
  if (check && updates.length > 0) throw new Error('Generated types are out of date: ' + updates.map(update => update.filePath).join(', '));
  for (const { filePath, content } of updates) {
    writePreservingEol(filePath, content!, fs.readFileSync(filePath, 'utf-8'));
    logger.success('Updated ' + filePath);
  }
}

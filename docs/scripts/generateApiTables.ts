/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';
import { Comment, CommentDisplayPart, DeclarationReflection, Reflection, SignatureReflection, SomeType } from 'typedoc';
import { generateApiDocs } from './generateApiDocs';

const tableConfigs: Array<TableConfig> = [
  {
    targetName: 'SignalQuery',
    memberType: 'methods',
    outputFilename: 'SignalQueryMethods.md'
  },
  {
    targetName: 'SignalQueryOptions',
    memberType: 'properties',
    outputFilename: 'SignalQueryOptions.md',
    memberFilter: {
      custom: (member: Reflection) => member.name !== 'nextFetchPolicy'
    }
  },
  {
    targetName: 'SignalQuery',
    memberType: 'properties',
    headers: ['Signal', 'Type', 'Description'],
    memberFilter: {
      kind: 'Property',
      typePrefix: 'Signal<'
    },
    outputFilename: 'SignalQuerySignals.md'
  },
  {
    targetName: 'SignalSubscriptionOptions',
    memberType: 'properties',
    outputFilename: 'SignalSubscriptionOptions.md'
  },
  {
    targetName: 'SignalSubscription',
    memberType: 'properties',
    headers: ['Signal', 'Type', 'Description'],
    memberFilter: {
      kind: 'Property',
      typePrefix: 'Signal<'
    },
    outputFilename: 'SignalSubscriptionSignals.md'
  },
  {
    targetName: 'SignalSubscription',
    memberType: 'methods',
    outputFilename: 'SignalSubscriptionMethods.md'
  },
  {
    targetName: 'SignalMutationOptions',
    memberType: 'properties',
    outputFilename: 'SignalMutationOptions.md'
  },
  {
    targetName: 'SignalMutation',
    memberType: 'properties',
    headers: ['Signal', 'Type', 'Description'],
    memberFilter: {
      kind: 'Property',
      typePrefix: 'Signal<'
    },
    outputFilename: 'SignalMutationSignals.md'
  },
  {
    targetName: 'SignalMutation',
    memberType: 'methods',
    outputFilename: 'SignalMutationMethods.md'
  },
  {
    targetName: 'SignalFragmentOptions',
    memberType: 'properties',
    outputFilename: 'SignalFragmentOptions.md'
  },
  {
    targetName: 'SignalFragment',
    memberType: 'properties',
    headers: ['Signal', 'Type', 'Description'],
    memberFilter: {
      kind: 'Property',
      typePrefix: 'Signal<'
    },
    outputFilename: 'SignalFragmentSignals.md'
  },
  {
    targetName: 'SignalCacheQueryOptions',
    memberType: 'properties',
    outputFilename: 'SignalCacheQueryOptions.md'
  },
  {
    targetName: 'SignalCacheQuery',
    memberType: 'properties',
    headers: ['Signal', 'Type', 'Description'],
    memberFilter: {
      kind: 'Property',
      typePrefix: 'Signal<'
    },
    outputFilename: 'SignalCacheQuerySignals.md'
  }
];

interface TableData {
  headers: Array<string>;
  rows: Array<PropertyRow | MethodRow>;
  error?: string;
}

interface PropertyRow {
  kind: 'property';
  name: string;
  description?: Array<CommentDisplayPart>;
  type: string;
  defaultValue?: string;
}

interface MethodRow {
  kind: 'method';
  name: string;
  description?: Array<CommentDisplayPart>;
}

interface TableConfig {
  targetName: string;
  headers?: Array<string>;
  memberType: 'methods' | 'properties';
  memberFilter?: {
    kind?: 'Method' | 'Property';
    typePrefix?: string;
    custom?: (member: Reflection) => boolean;
  };
  outputFilename: string;
}

interface InternalPropertyData {
  name: string;
  optional: boolean;
  type: string;
  description?: Array<CommentDisplayPart>;
  defaultValue: string;
  comment?: Comment | null;
}

const ReflectionKind = {
  Module: 2,
  Function: 64,
  Class: 128,
  Interface: 256,
  Property: 1024,
  Method: 2048,
  TypeAlias: 2097152
} as const;

function formatType(typeInfo: SomeType | undefined, isComposite: boolean = false): string {
  if (!typeInfo) return 'any';

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (typeInfo.type) {
    case 'intrinsic':
      return typeInfo.name;

    case 'reference':
      if ((typeInfo.typeArguments?.length ?? 0) > 0) {
        const args = typeInfo.typeArguments.map(arg => formatType(arg, isComposite)).join(', ');
        return `${typeInfo.name}<${args}>`;
      }
      return typeInfo.name;

    case 'union': {
      const unionTypes = typeInfo.types
        .map(t => formatType(t, true))
        .sort((a, b) => {
          const aIsUndefinedOrNull = a === 'undefined' || a === 'null';
          const bIsUndefinedOrNull = b === 'undefined' || b === 'null';

          if (aIsUndefinedOrNull && !bIsUndefinedOrNull) return 1;
          if (!aIsUndefinedOrNull && bIsUndefinedOrNull) return -1;

          return 0;
        });

      return unionTypes.length > 3 && !isComposite
        ? '| ' + unionTypes.join('`\n`| ')
        : unionTypes.join(' | ');
    }

    case 'intersection':
      return formatType(typeInfo.types[0], true);

    case 'reflection':
      if (typeInfo.declaration.signatures?.[0]) {
        const sig = typeInfo.declaration.signatures[0];
        const params = sig.parameters?.map(p => `${p.name}: ${formatType(p.type, isComposite)}`).join(', ') ?? '';
        const returnType = formatType(sig.type, isComposite);
        const lambdaType = `(${params}) => ${returnType}`;
        return isComposite ? `(${lambdaType})` : lambdaType;
      }

      if ((typeInfo.declaration.children?.length ?? 0) > 0) {
        const members = typeInfo.declaration.children.map(child => {
          const name = child.name;
          const typeStr = formatType(child.type, isComposite);
          const optional = child.flags.isOptional ? '?' : '';
          return `${name}${optional}: ${typeStr}`;
        }).join('; ');
        return `{ ${members} }`;
      }

      return 'object';

    case 'literal':
      return typeInfo.value?.toString();

    case 'indexedAccess':
      return `${formatType(typeInfo.objectType)}[${formatType(typeInfo.indexType)}]`;

    default:
      return 'unknown';
  }
}

function formatMethodSignature(methodName: string, signature?: SignatureReflection): string {
  if (!signature) return `${methodName}()`;

  const params = signature.parameters?.map(p => {
    if (p.flags.isRest) {
      const type = p.type?.type === 'conditional' ? (p.type as any).trueType : p.type;
      const typeElement = type?.elements?.[0];
      if (typeElement !== undefined) {
        return `${typeElement.name}${typeElement.isOptional === true ? '?' : ''}: ${formatType(typeElement.element)}`;
      }
    }

    return `${p.name}${p.flags.isOptional ? '?' : ''}: ${formatType(p.type)}`;
  }).join(', ') ?? '';

  const paramString = (signature.parameters?.length ?? 0) > 0 ? params : '';
  const typeParams = signature.typeParameters?.map(tp => tp.name).join(', ');
  const generics = typeParams !== undefined ? `<${typeParams}>` : '';
  return `${methodName}${generics}(${paramString})`;
}

function findTargetReflection(apiData: DeclarationReflection, targetName: string): DeclarationReflection | undefined {
  const findInScope = (children: Array<DeclarationReflection> | undefined): DeclarationReflection | undefined =>
    children?.find(
      child =>
        child.name === targetName &&
        (child.kind === ReflectionKind.Class ||
          child.kind === ReflectionKind.TypeAlias ||
          child.kind === ReflectionKind.Interface)
    );

  const directFind = findInScope(apiData.children);
  if (directFind) return directFind;

  return apiData.children
    ?.filter(module => module.kind === ReflectionKind.Module && module.children !== undefined)
    .reduce((found, module) => found ?? findInScope(module.children), undefined as DeclarationReflection | undefined);
}

function buildReflectionsMap(apiData: DeclarationReflection): Record<number, DeclarationReflection> {
  const getAllDescendantReflections = (
    initialReflections: Array<DeclarationReflection> | undefined
  ): Array<DeclarationReflection> => {
    if (!initialReflections) return [];
    return initialReflections.flatMap(ref => [
      ref,
      ...getAllDescendantReflections(ref.children)
    ]);
  };

  const list = getAllDescendantReflections(apiData.children);

  return list.reduce((map, ref) => {
    if (typeof ref.id !== 'undefined') {
      return { ...map, [ref.id]: ref };
    }
    return map;
  }, {} as Record<number, DeclarationReflection>);
}

function getTagContent(comment: Comment | undefined, tagName: string): string {
  const tag = comment?.blockTags?.find(t => t.tag === tagName); // eslint-disable-line @typescript-eslint/no-unnecessary-condition
  return tag?.content
    .map(part => part.text.replace(/^```ts\n?/, '').replace(/\n?```$/, ''))
    .join('') ?? '';
}

function createPropertyInternalData(
  prop: DeclarationReflection,
  effectiveComment: Comment | undefined | null
): InternalPropertyData {
  return {
    name: prop.name,
    optional: 'isOptional' in prop.flags && prop.flags.isOptional,
    type: formatType(prop.type),
    description: (effectiveComment ?? prop.comment)?.summary,
    defaultValue: getTagContent(effectiveComment ?? prop.comment, '@default'),
    comment: effectiveComment ?? prop.comment
  };
}

function shouldIncludeProperty(
  prop: DeclarationReflection,
  memberFilter: TableConfig['memberFilter'] | undefined
): boolean {
  if (prop.flags.isPrivate || prop.flags.isProtected) return false;

  if (typeof prop.flags.isPublic === 'boolean' && !prop.flags.isPublic) return false;

  if (memberFilter?.typePrefix !== undefined) {
    const formattedType = formatType(prop.type);
    if (!formattedType.startsWith(memberFilter.typePrefix)) return false;
  }
  if (memberFilter?.kind && ReflectionKind[memberFilter.kind] !== prop.kind) return false;

  return !memberFilter?.custom || memberFilter.custom(prop);
}

function extractPropertiesFromTypeRecursive(
  typeNode: SomeType | undefined,
  reflectionsMap: Record<number, DeclarationReflection | undefined>,
  memberFilter: TableConfig['memberFilter'] | undefined,
  defaultComment: Comment | null | undefined,
  depth: number
): Array<InternalPropertyData> {
  if (!typeNode || depth > 10) return [];

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (typeNode.type) {
    case 'intersection':
    case 'union':
      return typeNode.types.flatMap(t => extractPropertiesFromTypeRecursive(t, reflectionsMap, memberFilter, defaultComment, depth + 1));

    case 'reference': {
      const { name, typeArguments } = typeNode;
      const typeTarget = (typeNode as any).target;
      const targetId: number | undefined = typeof typeTarget === 'number' ? typeTarget : typeTarget?.id;

      if (name === 'Omit' && typeArguments?.length === 2) {
        const [sourceType, keysToOmitType] = typeArguments;
        let propertiesToFilter: Array<InternalPropertyData> = [];
        const sourceTypeTarget = (sourceType as any).target;

        if (sourceType.type === 'reference') {
          const sourceTargetId = typeof sourceTypeTarget === 'number' ? sourceTypeTarget : sourceTypeTarget?.id;
          const referenced = sourceTargetId !== undefined ? reflectionsMap[sourceTargetId] : undefined;
          if (referenced) {
            propertiesToFilter = extractPropertiesFromReflectionRecursive(referenced, reflectionsMap, memberFilter, depth + 1);
          }
        } else {
          propertiesToFilter = extractPropertiesFromTypeRecursive(sourceType, reflectionsMap, memberFilter, defaultComment, depth + 1);
        }

        const omittedKeys = new Set<string>();
        if (keysToOmitType.type === 'literal' && typeof keysToOmitType.value === 'string') {
          omittedKeys.add(keysToOmitType.value);
        } else if (keysToOmitType.type === 'union') {
          keysToOmitType.types.forEach(keyType => {
            if (keyType.type === 'literal' && typeof keyType.value === 'string') {
              omittedKeys.add(keyType.value);
            }
          });
        }

        return propertiesToFilter.filter(p => !omittedKeys.has(p.name));
      }

      if (targetId !== undefined) {
        const referencedReflection = reflectionsMap[targetId];
        if (referencedReflection) {
          return extractPropertiesFromReflectionRecursive(referencedReflection, reflectionsMap, memberFilter, depth + 1);
        }
      }

      return [];
    }

    case 'reflection':
      return (typeNode.declaration.children ?? [])
        .filter(prop => prop.kind === ReflectionKind.Property && shouldIncludeProperty(prop, memberFilter))
        .map(prop => createPropertyInternalData(prop, prop.comment ?? defaultComment));

    default:
      return [];
  }
}

function extractPropertiesFromReflectionRecursive(
  reflection: DeclarationReflection | undefined,
  reflectionsMap: Record<number, DeclarationReflection | undefined>,
  memberFilter: TableConfig['memberFilter'] | undefined,
  depth: number
): Array<InternalPropertyData> {
  if (!reflection || depth > 10) return [];

  const properties = (reflection.children ?? [])
    .filter(prop => prop.kind === ReflectionKind.Property && shouldIncludeProperty(prop, memberFilter))
    .map(prop => createPropertyInternalData(prop, prop.comment ?? reflection.comment));

  if (reflection.type) {
    return [
      ...properties,
      ...extractPropertiesFromTypeRecursive(reflection.type, reflectionsMap, memberFilter, reflection.comment, depth + 1)
    ];
  }

  if (reflection.extendedTypes) {
    return [
      ...properties,
      ...reflection.extendedTypes
        .flatMap(extendedType => extractPropertiesFromTypeRecursive(extendedType, reflectionsMap, memberFilter, reflection.comment, depth + 1))
    ];
  }

  if (reflection.kind === ReflectionKind.Interface && reflection.type?.type === 'intersection') {
    return [
      ...properties,
      ...reflection.type.types
        .flatMap(t => extractPropertiesFromTypeRecursive(t, reflectionsMap, memberFilter, reflection.comment, depth + 1))
    ];
  }

  return properties;
}

function deduplicateAndFormatProperties(internalProps: Array<InternalPropertyData>): Array<PropertyRow> {
  const uniquePropsMap = new Map<string, InternalPropertyData>();
  for (const prop of internalProps) {
    if (!uniquePropsMap.has(prop.name)) {
      uniquePropsMap.set(prop.name, prop);
    }
  }
  return Array.from(uniquePropsMap.values()).map((p): PropertyRow => ({
    kind: 'property',
    name: `${p.name}${p.optional ? '?' : ''}`,
    type: p.type,
    description: p.description,
    defaultValue: p.defaultValue
  }));
}

function extractMembers(
  targetReflection: DeclarationReflection,
  memberType: 'methods' | 'properties',
  reflectionsMap: Record<number, DeclarationReflection | undefined>,
  memberFilter?: TableConfig['memberFilter']
): Array<PropertyRow | MethodRow> {
  if (memberType === 'methods') {
    const children = targetReflection.children ?? [];
    return children
      .filter(child => {
        if (child.kind !== ReflectionKind.Method) return false;
        if (child.flags.isPrivate || child.flags.isProtected) return false;
        if (child.name === 'constructor') return false;
        if (typeof child.flags.isPublic === 'boolean' && !child.flags.isPublic) return false;

        if (memberFilter?.typePrefix !== undefined && child.type) {
          const formattedType = formatType(child.type);
          if (!formattedType.startsWith(memberFilter.typePrefix)) return false;
        }

        return !memberFilter?.custom || memberFilter.custom(child);
      })
      .map(member => {
        const signature = member.signatures?.[0];
        return {
          kind: 'method',
          name: formatMethodSignature(member.name, signature),
          description: signature?.comment?.summary ?? member.comment?.summary
        };
      });
  } else {
    return deduplicateAndFormatProperties((targetReflection.children ?? [])
      .filter(child => child.kind === ReflectionKind.Property && shouldIncludeProperty(child, memberFilter))
      .map(child => createPropertyInternalData(child, child.comment))
      .concat(extractPropertiesFromReflectionRecursive(
        targetReflection,
        reflectionsMap,
        memberFilter,
        0
      )));
  }
}

function generateTableData(
  apiData: DeclarationReflection,
  targetName: string,
  customHeaders: Array<string> | undefined,
  tableType: 'methods' | 'properties',
  memberFilter?: TableConfig['memberFilter']
): TableData {
  const defaultHeaders = {
    methods: ['Method', 'Description'],
    properties: ['Property', 'Type', 'Description']
  };

  try {
    const targetReflection = findTargetReflection(apiData, targetName);

    if (!targetReflection) {
      throw new Error(`Target '${targetName}' not found`);
    }

    const reflectionsMap = buildReflectionsMap(apiData);

    return {
      headers: customHeaders ?? defaultHeaders[tableType],
      rows: extractMembers(targetReflection, tableType, reflectionsMap, memberFilter)
    };
  } catch (e: any) {
    return { headers: [], rows: [], error: e.message };
  }
}

function escapeMarkdownSpecialChars(textInput: string | Array<CommentDisplayPart>): string {
  const parts: Array<CommentDisplayPart> = Array.isArray(textInput)
    ? textInput
    : typeof textInput === 'string'
      ? [{ kind: 'text', text: textInput }]
      : [];

  return parts
    .map(part => part.text
      .replace(/\|/g, '\\|')
      .replace(/\n/g, '<br />')
      .replace(/\r/g, ''))
    .join('');
}

function generateMarkdownTable(data: TableData): string {
  if (data.error !== undefined) {
    return `<!-- Error: ${data.error} -->`;
  }
  if (data.rows.length === 0) {
    return '<!-- No data found for table -->';
  }

  let markdown = '';
  markdown += '| ' + data.headers.join(' | ') + ' |\n';
  markdown += '| ' + data.headers.map(() => '---').join(' | ') + ' |\n';

  for (const row of data.rows) {
    const cells = data.headers.map((header, index) => {
      const headerLower = header.toLowerCase();
      if (index === 0) {
        return `\`${row.name}\``;
      }

      if (headerLower === 'type' && 'type' in row) {
        return `\`${escapeMarkdownSpecialChars(row.type)}\``;
      }

      let descriptionText = escapeMarkdownSpecialChars(row.description);

      if ('defaultValue' in row && row.defaultValue !== undefined && row.defaultValue.length > 0) {
        descriptionText += `<br/>*@default*: \`${escapeMarkdownSpecialChars(row.defaultValue)}\``;
      }

      return descriptionText;
    });
    markdown += '| ' + cells.join(' | ') + ' |\n';
  }
  return markdown + '\n';
}

export default async function generateApiTables(): Promise<void> {
  console.log('🔄 Generating API tables...');

  const markdownDir = path.join(__dirname, '../src/components/api-tables');

  if (!fs.existsSync(markdownDir)) {
    fs.mkdirSync(markdownDir, { recursive: true });
  }

  const apiData = await generateApiDocs();

  for (const config of tableConfigs) {
    const filename = config.outputFilename;

    const tableData = generateTableData(
      apiData,
      config.targetName,
      config.headers,
      config.memberType,
      config.memberFilter
    );

    const markdown = generateMarkdownTable(tableData);
    const markdownPath = path.join(markdownDir, filename);
    fs.writeFileSync(markdownPath, markdown);

    console.log(`  ✅ Generated API markdown: ${filename}`);
  }
}

if (require.main === module) {
  generateApiTables().catch(err => {
    console.error('Error during API table generation:', err);
    process.exit(1);
  });
}

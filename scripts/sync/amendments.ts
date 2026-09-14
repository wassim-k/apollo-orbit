/**
 * Text copied out of Apollo Client, as the text this library declares. Everything here is a string
 * transform: the TypeScript AST is read in `importedTypes.ts`, and only its printed text arrives here.
 *
 * This is the file to edit when Apollo changes a type.
 */

const IGNORED_MEMBERS = ['variablesUnknownSymbol'];

/**
 * Apollo's indentation, in this library's. A copied declaration is indented from wherever it sat in the
 * `.d.ts` - inside a namespace, at four spaces per level - so each line is dedented by the declaration's own
 * indent and then halved. Flattening every line to one level instead would put a nested member at the same
 * depth as its parent.
 */
export function reindent(definitionText: string): string {
  const lines = definitionText.split('\n');
  const declarationIndent = (/^ */.exec(lines[lines.length - 1]) as RegExpExecArray)[0].length;

  return lines
    .map((line, index) => index === 0
      ? line
      : line.replace(/^ */, spaces => ' '.repeat(Math.max(0, spaces.length - declarationIndent) / 2)))
    .join('\n');
}

export function removeIgnoredMembers(definitionText: string): string {
  return IGNORED_MEMBERS.reduce((text, member) => text.replace(
    new RegExp(String.raw`\n[ \t]*(?:/\*\*(?:(?!\*/)[\s\S])*?\*/\n[ \t]*)?\[${member}\]\?:[^;]*;`),
    ''
  ), definitionText);
}

/**
 * Apollo's own naming and spacing, in the naming and spacing of the file copying it.
 */
export function normalizeDefinitionText(definitionText: string): string {
  return definitionText
    .replace(/\bOperationVariables\b/g, 'Variables')
    .replace(/ +\n/g, '\n');
}

/**
 * A replacement that fails loudly. Apollo owns the text being amended, so a pattern that stops matching means
 * the declaration it was written for has changed shape, and a silent no-op would ship a type that looks right.
 */
function replace(definitionText: string, pattern: string | RegExp, replacement: string, amendment: string): string {
  const amended = definitionText.replace(pattern, replacement);

  if (amended === definitionText) throw new Error(`Cannot apply '${amendment}': Apollo's declaration no longer matches.`);

  return amended;
}

/**
 * The `partial` field of a watched query result, which this library reports through `dataState` instead.
 */
function withoutPartialField(definitionText: string): string {
  // Apollo has deprecated the field, so its absence is the expected end state rather than a mismatch.
  if (!/\bpartial\??:/.test(definitionText)) return definitionText;

  return replace(
    definitionText,
    /\n[ \t]*\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\n[ \t]*partial: boolean;/,
    '',
    'partial'
  );
}

/**
 * A type parameter added to the copied declaration, with the option it narrows retyped to it. Apollo
 * declares each of these options as its own full union; carrying the written value in a parameter is what
 * lets a result type read it back.
 *
 * `before` places the parameter ahead of one Apollo declared, so the parameters a caller actually writes
 * stay reachable by position.
 */
function withNarrowedOption(
  definitionText: string,
  parameter: string,
  option: string,
  optionType: string,
  before?: string
): string {
  const beforeIndex = before === undefined ? -1 : definitionText.indexOf(`, ${before} extends`);
  const parameterListEnd = definitionText.indexOf('> =');
  const optionDeclaration = new RegExp(String.raw`\b${option}\?: [^;]*;`);

  if (parameterListEnd === -1) throw new Error(`Cannot add '${parameter}': no type parameter list found.`);
  if (!optionDeclaration.test(definitionText)) throw new Error(`Cannot narrow '${option}': it declares no such option.`);

  const insertionPoint = beforeIndex === -1 ? parameterListEnd : beforeIndex;

  return definitionText.slice(0, insertionPoint) + `, ${parameter}` + definitionText.slice(insertionPoint)
    .replace(optionDeclaration, `${option}?: ${optionType};`);
}

const withErrorPolicy = (definitionText: string): string =>
  withNarrowedOption(definitionText, 'TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy', 'errorPolicy', 'TErrorPolicy', 'TCache');

const withReturnPartialData = (definitionText: string): string =>
  withNarrowedOption(definitionText, 'TPartial extends boolean | undefined = boolean', 'returnPartialData', 'TPartial');

/**
 * An overload of `watchFragment` as the equivalent overload of the signal that watches a fragment: the same
 * shapes of `from`, carried by this library's own options and result types.
 */
function asSignalOverload(overloadText: string): string {
  const signalOverload = overloadText
    .replace(/ApolloClient\.WatchFragmentOptions<TData, TVariables> & \{\n {4}from: (.+);\n {2}\}/, 'SignalFragmentOptions<TData, TVariables, $1>')
    .replace(/ApolloClient\.WatchFragmentOptions<TData, TVariables>/, 'SignalFragmentOptions<TData, TVariables>')
    .replace(/ApolloClient\.ObservableFragment<(.+)>;$/, 'SignalFragment<$1, TVariables>;');

  if (/ApolloClient\.(WatchFragmentOptions|ObservableFragment)/.test(signalOverload)) {
    throw new Error('Cannot apply \'fragment\': an overload still refers to a shape this library redeclares.');
  }

  return signalOverload;
}

/**
 * What the watched query options carry in both the plain and the signal form: the two narrowing parameters, and
 * `nextFetchPolicy` referred back to Apollo's own declaration rather than copied, since its callback signature
 * mentions option types this library does not redeclare.
 */
const withWatchQueryAmendments = (definitionText: string): string =>
  replace(
    withReturnPartialData(withErrorPolicy(definitionText)),
    /nextFetchPolicy\?: .*\n/g,
    'nextFetchPolicy?: ApolloClient.WatchQueryOptions<TData, TVariables>[\'nextFetchPolicy\'];\n',
    'nextFetchPolicy'
  );

const REACTIVE_OPTIONS = ['query', 'context', 'fetchPolicy', 'initialFetchPolicy', 'pollInterval', 'notifyOnNetworkStatusChange', 'refetchWritePolicy'];

function withReactiveOptions(definitionText: string): string {
  return REACTIVE_OPTIONS.reduce<string>((text, option) => {
    for (const separator of ['?: ', ': ']) {
      const declaration = `\n  ${option}${separator}`;
      const declarationStart = text.indexOf(declaration);

      if (declarationStart === -1) continue;

      const typeStart = declarationStart + declaration.length;
      const typeEnd = text.indexOf(';', typeStart);

      const type = text.slice(typeStart, typeEnd);

      return `${text.slice(0, typeStart)}${type} | (() => ${type})${text.slice(typeEnd)}`;
    }

    throw new Error(`Cannot make '${option}' reactive: Apollo declares no such option.`);
  }, definitionText);
}

/**
 * How the text copied from Apollo becomes the type this library declares, keyed by the name it is declared as.
 *
 * Keying by that name rather than by Apollo's own means a rule only ever amends the type it was written for,
 * never another type copied from the same source.
 */
const AMENDMENTS: Partial<Record<string, (definitionText: string) => string>> = {
  WatchQueryOptions: withWatchQueryAmendments,

  QueryOptions: withErrorPolicy,

  MutationOptions: withErrorPolicy,

  QueryResult: definitionText => withoutPartialField(definitionText)
    .replace(/"/g, '\'')
    .replace(/\n\s*}\s*&/, `

  /**
   * An object containing the result from the most recent _previous_ execution of this query.
   *
   * This value is \`undefined\` if this is the query's first execution.
   */
  previousData?: GetData<TData, TStates>;
} &`),

  SignalQueryOptions: definitionText => withReactiveOptions(withWatchQueryAmendments(definitionText))
    .replace(/\n\s*} & VariablesOption<NoInfer<TVariables>>;/g, `

  /**
   * Whether to execute query immediately or lazily via \`execute\` method.
   */
  lazy?: boolean;

  /**
   * Custom injector to use for this query.
   */
  injector?: Injector;
} & SignalLazyVariablesOption<NoInfer<TVariables>>;`),

  SubscriptionOptions: definitionText => replace(definitionText, /query:/g, 'subscription:', 'SubscriptionOptions'),

  SubscribeToMoreOptions: definitionText => replace(definitionText, /document:/g, 'subscription:', 'SubscribeToMoreOptions'),

  SignalSubscriptionOptions: definitionText => definitionText
    .replace(/query: (.*?);/g, 'subscription: $1;')
    .replace(/\n\s*} & VariablesOption<NoInfer<TVariables>>/, `

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
} & SignalLazyVariablesOption<NoInfer<TVariables>>`),

  SignalFragmentOptions: definitionText => definitionText
    // An intersection carries the conditional variables option, which an interface cannot hold.
    .replace('export interface ', 'export type ')
    .replace('> {', '> = {')
    .replace('<TData = unknown, TVariables extends Variables = Variables>', `<
  TData = unknown,
  TVariables extends Variables = Variables,
  TFrom extends FragmentFrom<TData> = FragmentFrom<TData>
>`)
    .replace(/from: (.*?);/g, `from:
  | TFrom
  | (() => TFrom);`)
    .replace(/\n\s*\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\n\s*variables\?: .*?;/, '')
    .replace(/\n\s*}$/, `

  /**
   * Custom injector to use for this signal.
   */
  injector?: Injector;
} & SignalCacheVariablesOption<NoInfer<TVariables>>;`),

  fragment: asSignalOverload
};

export function amend(definitionText: string, declaredAs: string): string {
  return AMENDMENTS[declaredAs]?.(definitionText) ?? definitionText;
}

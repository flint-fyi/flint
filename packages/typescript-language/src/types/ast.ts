/* Generated from tsl */
import type ts from "typescript";

export interface AbstractKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AbstractKeyword;
	readonly parent: ModifierParent;
}
export type AccessorDeclaration =
	| GetAccessorDeclaration
	| SetAccessorDeclaration;
export interface AccessorKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AccessorKeyword;
	readonly parent: ModifierParent;
}
export type AdditiveOperator =
	| ts.SyntaxKind.MinusToken
	| ts.SyntaxKind.PlusToken;
export type AdditiveOperatorOrHigher =
	| AdditiveOperator
	| MultiplicativeOperatorOrHigher;
export interface AnyKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AnyKeyword;
	readonly parent: TypeNodeParent;
}
export type ArrayBindingElement = BindingElement | OmittedExpression;
export interface ArrayBindingPattern extends ts.Node {
	readonly elements: ts.NodeArray<ArrayBindingElement>;
	readonly kind: ts.SyntaxKind.ArrayBindingPattern;
	readonly parent: BindingElement | ParameterDeclaration | VariableDeclaration;
}
export interface ArrayLiteralExpression extends ts.Node {
	readonly elements: ts.NodeArray<Expression>;
	readonly kind: ts.SyntaxKind.ArrayLiteralExpression;
	readonly parent: LeftHandSideExpressionParent;
}
export interface ArrayTypeNode extends ts.Node {
	readonly elementType: TypeNode;
	readonly kind: ts.SyntaxKind.ArrayType;
	readonly parent: TypeNodeParent;
}
export interface ArrowFunction extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body: ConciseBody;
	readonly equalsGreaterThanToken: EqualsGreaterThanToken;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.ArrowFunction;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name: never;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: ExpressionParent;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface AsExpression extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.AsExpression;
	readonly parent: ExpressionParent;
	readonly type: TypeNode;
}
export interface AssertsKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AssertsKeyword;
	readonly parent: TypePredicateNode;
}
export type AssignmentOperator =
	| CompoundAssignmentOperator
	| ts.SyntaxKind.EqualsToken;
export type AssignmentOperatorOrHigher =
	| AssignmentOperator
	| LogicalOperatorOrHigher
	| ts.SyntaxKind.QuestionQuestionToken;
export interface AsteriskToken extends ts.Node {
	readonly kind: ts.SyntaxKind.AsteriskToken;
	readonly parent:
		| AccessorDeclaration
		| ArrowFunction
		| ConstructorDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| MethodDeclaration
		| YieldExpression;
}
export interface AsyncKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AsyncKeyword;
	readonly parent: ModifierParent;
}
export interface AwaitExpression extends ts.Node {
	readonly expression: UnaryExpression;
	readonly kind: ts.SyntaxKind.AwaitExpression;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export interface AwaitKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.AwaitKeyword;
	readonly parent: ForOfStatement;
}
export interface BigIntKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.BigIntKeyword;
	readonly parent: TypeNodeParent;
}
export interface BigIntLiteral extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.BigIntLiteral;
	readonly parent:
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| FunctionOrConstructorTypeNodeBase
		| JSDocFunctionType
		| LeftHandSideExpressionParent
		| LiteralTypeNode
		| MethodDeclaration
		| SemicolonClassElement
		| TypeElement;
	text: string;
}
export interface BinaryExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.BinaryExpression;
	readonly left: Expression;
	readonly operatorToken: BinaryOperatorToken;
	readonly parent: ExpressionParent;
	readonly right: Expression;
}
export type BinaryOperator =
	| AssignmentOperatorOrHigher
	| ts.SyntaxKind.CommaToken;
export interface BinaryOperatorToken extends ts.Node {
	readonly kind: BinaryOperator;
	readonly parent: BinaryExpression;
}
export interface BindingElement extends ts.Node {
	readonly dotDotDotToken?: DotDotDotToken;
	readonly initializer?: Expression;
	readonly kind: ts.SyntaxKind.BindingElement;
	readonly name: BindingName;
	readonly parent: BindingPattern;
	readonly propertyName?: PropertyName;
}
export type BindingName = BindingPattern | Identifier;
export type BindingPattern = ArrayBindingPattern | ObjectBindingPattern;
export type BitwiseOperator =
	| ts.SyntaxKind.AmpersandToken
	| ts.SyntaxKind.BarToken
	| ts.SyntaxKind.CaretToken;
export type BitwiseOperatorOrHigher =
	| BitwiseOperator
	| EqualityOperatorOrHigher;
export interface Block extends ts.Node {
	readonly kind: ts.SyntaxKind.Block;
	readonly parent:
		| AccessorDeclaration
		| ArrowFunction
		| CatchClause
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| MethodDeclaration
		| StatementParent
		| TryStatement;
	readonly statements: ts.NodeArray<Statement>;
}
export interface BooleanKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.BooleanKeyword;
	readonly parent: TypeNodeParent;
}
export type BooleanLiteral = FalseLiteral | TrueLiteral;
export interface BreakStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.BreakStatement;
	readonly label?: Identifier;
	readonly parent: StatementParent;
}
export interface CallExpression extends ts.Node {
	readonly arguments: ts.NodeArray<Expression>;
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.CallExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly questionDotToken?: QuestionDotToken;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface CallSignatureDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.CallSignature;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: InterfaceDeclaration | MappedTypeNode | TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface CaseBlock extends ts.Node {
	readonly clauses: ts.NodeArray<CaseOrDefaultClause>;
	readonly kind: ts.SyntaxKind.CaseBlock;
	readonly parent: SwitchStatement;
}
export interface CaseClause extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.CaseClause;
	readonly parent: CaseBlock;
	readonly statements: ts.NodeArray<Statement>;
}
export type CaseOrDefaultClause = CaseClause | DefaultClause;
export interface CatchClause extends ts.Node {
	readonly block: Block;
	readonly kind: ts.SyntaxKind.CatchClause;
	readonly parent: TryStatement;
	readonly variableDeclaration?: VariableDeclaration;
}
export interface ClassDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.ClassDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly parent: StatementParent;
	/** May be undefined in `export default class { ... }`. */
	readonly heritageClauses?: ts.NodeArray<HeritageClause>;
	readonly members: ts.NodeArray<ClassElement>;
	readonly name?: Identifier;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration>;
}
export type ClassElement =
	| ClassStaticBlockDeclaration
	| ConstructorDeclaration
	| GetAccessorDeclaration
	| IndexSignatureDeclaration
	| MethodDeclaration
	| PropertyDeclaration
	| SemicolonClassElement
	| SetAccessorDeclaration;
export interface ClassExpression extends ts.Node {
	readonly heritageClauses?: ts.NodeArray<HeritageClause>;
	readonly kind: ts.SyntaxKind.ClassExpression;
	readonly members: ts.NodeArray<ClassElement>;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name?: Identifier;
	readonly parent: LeftHandSideExpressionParent;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration>;
}
export interface ClassStaticBlockDeclaration extends ts.Node {
	readonly body: Block;
	readonly kind: ts.SyntaxKind.ClassStaticBlockDeclaration;
	readonly name?: PropertyName;
	readonly parent: ClassDeclaration | ClassExpression;
}
export interface ColonToken extends ts.Node {
	readonly kind: ts.SyntaxKind.ColonToken;
	readonly parent: ConditionalExpression;
}
export interface CommaListExpression extends ts.Node {
	readonly elements: ts.NodeArray<Expression>;
	readonly kind: ts.SyntaxKind.CommaListExpression;
	readonly parent: ExpressionParent;
}
export type CompoundAssignmentOperator =
	| ts.SyntaxKind.AmpersandAmpersandEqualsToken
	| ts.SyntaxKind.AmpersandEqualsToken
	| ts.SyntaxKind.AsteriskAsteriskEqualsToken
	| ts.SyntaxKind.AsteriskEqualsToken
	| ts.SyntaxKind.BarBarEqualsToken
	| ts.SyntaxKind.BarEqualsToken
	| ts.SyntaxKind.CaretEqualsToken
	| ts.SyntaxKind.GreaterThanGreaterThanEqualsToken
	| ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken
	| ts.SyntaxKind.LessThanLessThanEqualsToken
	| ts.SyntaxKind.MinusEqualsToken
	| ts.SyntaxKind.PercentEqualsToken
	| ts.SyntaxKind.PlusEqualsToken
	| ts.SyntaxKind.QuestionQuestionEqualsToken
	| ts.SyntaxKind.SlashEqualsToken;
export interface ComputedPropertyName extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.ComputedPropertyName;
	readonly parent:
		| BindingElement
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| EnumMember
		| FunctionOrConstructorTypeNodeBase
		| JSDocFunctionType
		| JsxSpreadAttribute
		| MethodDeclaration
		| PropertyAssignment
		| PropertyDeclaration
		| SemicolonClassElement
		| SpreadAssignment
		| TypeElement;
}
export type ConciseBody = Expression | FunctionBody;
export interface ConditionalExpression extends ts.Node {
	readonly colonToken: ColonToken;
	readonly condition: Expression;
	readonly kind: ts.SyntaxKind.ConditionalExpression;
	readonly parent: ExpressionParent;
	readonly questionToken: QuestionToken;
	readonly whenFalse: Expression;
	readonly whenTrue: Expression;
}
export interface ConditionalTypeNode extends ts.Node {
	readonly checkType: TypeNode;
	readonly extendsType: TypeNode;
	readonly falseType: TypeNode;
	readonly kind: ts.SyntaxKind.ConditionalType;
	readonly parent: TypeNodeParent;
	readonly trueType: TypeNode;
}
export interface ConstKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.ConstKeyword;
	readonly parent: ModifierParent;
}
export interface ConstructorDeclaration extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body?: FunctionBody | undefined;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.Constructor;
	readonly modifiers?: ts.NodeArray<ModifierLike> | undefined;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: ClassDeclaration | ClassExpression;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface ConstructorTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.ConstructorType;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface ConstructSignatureDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.ConstructSignature;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: InterfaceDeclaration | MappedTypeNode | TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface ContinueStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.ContinueStatement;
	readonly label?: Identifier;
	readonly parent: StatementParent;
}
export interface DebuggerStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.DebuggerStatement;
	readonly parent: StatementParent;
}
export type DeclarationStatement =
	| ClassDeclaration
	| EnumDeclaration
	| ExportAssignment
	| ExportDeclaration
	| FunctionDeclaration
	| ImportEqualsDeclaration
	| InterfaceDeclaration
	| MissingDeclaration
	| ModuleDeclaration
	| NamespaceExportDeclaration
	| TypeAliasDeclaration;
export interface DeclareKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.DeclareKeyword;
	readonly parent: ModifierParent;
}
export interface Decorator extends ts.Node {
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.Decorator;
	readonly parent:
		| AccessorDeclaration
		| ClassDeclaration
		| ClassExpression
		| ConstructorDeclaration
		| EnumDeclaration
		| ExportAssignment
		| ExportDeclaration
		| FunctionDeclaration
		| ImportDeclaration
		| ImportEqualsDeclaration
		| IndexSignatureDeclaration
		| InterfaceDeclaration
		| JSDocNamespaceDeclaration
		| MethodDeclaration
		| ModuleDeclaration
		| NamespaceDeclaration
		| ParameterDeclaration
		| PropertyDeclaration
		| TypeAliasDeclaration
		| VariableStatement;
}
export interface DefaultClause extends ts.Node {
	readonly kind: ts.SyntaxKind.DefaultClause;
	readonly parent: CaseBlock;
	readonly statements: ts.NodeArray<Statement>;
}
export interface DefaultKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.DefaultKeyword;
	readonly parent: ModifierParent;
}
export interface DeleteExpression extends ts.Node {
	readonly expression: UnaryExpression;
	readonly kind: ts.SyntaxKind.DeleteExpression;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export interface DoStatement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.DoStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export interface DotDotDotToken extends ts.Node {
	readonly kind: ts.SyntaxKind.DotDotDotToken;
	readonly parent: BindingElement | ParameterDeclaration;
}
export interface ElementAccessExpression extends ts.Node {
	readonly argumentExpression: Expression;
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.ElementAccessExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly questionDotToken?: QuestionDotToken;
}
export interface EmptyStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.EmptyStatement;
	readonly parent: StatementParent;
}
export type EntityName = Identifier | QualifiedName;
export interface EnumDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.EnumDeclaration;
	readonly members: ts.NodeArray<EnumMember>;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: Identifier;
	readonly parent: StatementParent;
}
export interface EnumMember extends ts.Node {
	readonly initializer?: Expression;
	readonly kind: ts.SyntaxKind.EnumMember;
	readonly name: PropertyName;
	readonly parent: EnumDeclaration;
}
export type EqualityOperator =
	| ts.SyntaxKind.EqualsEqualsEqualsToken
	| ts.SyntaxKind.EqualsEqualsToken
	| ts.SyntaxKind.ExclamationEqualsEqualsToken
	| ts.SyntaxKind.ExclamationEqualsToken;
export type EqualityOperatorOrHigher =
	| EqualityOperator
	| RelationalOperatorOrHigher;
export interface EqualsGreaterThanToken extends ts.Node {
	readonly kind: ts.SyntaxKind.EqualsGreaterThanToken;
	readonly parent: ArrowFunction;
}
export interface EqualsToken extends ts.Node {
	readonly kind: ts.SyntaxKind.EqualsToken;
	readonly parent: ShorthandPropertyAssignment;
}
export interface ExclamationToken extends ts.Node {
	readonly kind: ts.SyntaxKind.ExclamationToken;
	readonly parent:
		| AccessorDeclaration
		| ArrowFunction
		| ConstructorDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| MethodDeclaration
		| PropertyDeclaration
		| VariableDeclaration;
}
export type ExponentiationOperator = ts.SyntaxKind.AsteriskAsteriskToken;
export interface ExportAssignment extends ts.Node {
	readonly expression: Expression;
	readonly isExportEquals?: boolean;
	readonly kind: ts.SyntaxKind.ExportAssignment;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name?: Identifier | NumericLiteral | StringLiteral;
	readonly parent: StatementParent;
}
export interface ExportDeclaration extends ts.Node {
	readonly isTypeOnly: boolean;
	readonly kind: ts.SyntaxKind.ExportDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly parent: StatementParent;
	/** Will not be assigned in the case of `export * from "foo";` */
	readonly exportClause?: NamedExportBindings;
	/** If this is not a StringLiteral it will be a grammar error. */
	readonly attributes?: ImportAttributes;
	readonly moduleSpecifier?: Expression;
	readonly name?: Identifier | NumericLiteral | StringLiteral;
}
export interface ExportKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.ExportKeyword;
	readonly parent: ModifierParent;
}
export interface ExportSpecifier extends ts.Node {
	readonly isTypeOnly: boolean;
	readonly kind: ts.SyntaxKind.ExportSpecifier;
	readonly name: ModuleExportName;
	readonly parent: NamedExports;
	readonly propertyName?: ModuleExportName;
}
export type Expression =
	| ArrowFunction
	| AsExpression
	| BinaryExpression
	| CommaListExpression
	| ConditionalExpression
	| JsxClosingFragment
	| JsxExpression
	| JsxOpeningElement
	| JsxOpeningFragment
	| OmittedExpression
	| SatisfiesExpression
	| SpreadElement
	| SyntheticExpression
	| UnaryExpression
	| YieldExpression;
export interface ExpressionStatement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.ExpressionStatement;
	readonly parent: StatementParent;
}
export interface ExpressionWithTypeArguments extends ts.Node {
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.ExpressionWithTypeArguments;
	readonly parent:
		| ArrayLiteralExpression
		| ArrayTypeNode
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CallSignatureDeclaration
		| CaseClause
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| ConditionalTypeNode
		| ConstructorDeclaration
		| ConstructSignatureDeclaration
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExternalModuleReference
		| FunctionDeclaration
		| FunctionExpression
		| FunctionOrConstructorTypeNodeBase
		| HeritageClause
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| IndexedAccessTypeNode
		| IndexSignatureDeclaration
		| IntersectionTypeNode
		| IterationStatement
		| JSDocFunctionType
		| JSDocNamepathType
		| JSDocNonNullableType
		| JSDocNullableType
		| JSDocOptionalType
		| JSDocTypeExpression
		| JSDocVariadicType
		| JsxExpression
		| JsxOpeningElement
		| JsxSelfClosingElement
		| JsxSpreadAttribute
		| MappedTypeNode
		| MethodSignature
		| NamedTupleMember
		| NewExpression
		| NodeWithTypeArguments
		| NonNullExpression
		| ObjectLiteralElementLike
		| OptionalTypeNode
		| ParameterDeclaration
		| ParenthesizedExpression
		| ParenthesizedTypeNode
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyDeclaration
		| PropertySignature
		| RestTypeNode
		| ReturnStatement
		| SatisfiesExpression
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateLiteralTypeSpan
		| TemplateSpan
		| ThrowStatement
		| TupleTypeNode
		| TypeAliasDeclaration
		| TypeAssertion
		| TypeOfExpression
		| TypeOperatorNode
		| TypeParameterDeclaration
		| TypePredicateNode
		| UnionTypeNode
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface ExternalModuleReference extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.ExternalModuleReference;
	readonly parent: ImportEqualsDeclaration;
}
export interface FalseLiteral extends ts.Node {
	readonly kind: ts.SyntaxKind.FalseKeyword;
	readonly parent: LeftHandSideExpressionParent | LiteralTypeNode;
}
export type ForInitializer = Expression | VariableDeclarationList;
export interface ForInStatement extends ts.Node {
	readonly expression: Expression;
	readonly initializer: ForInitializer;
	readonly kind: ts.SyntaxKind.ForInStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export interface ForOfStatement extends ts.Node {
	readonly awaitModifier?: AwaitKeyword;
	readonly expression: Expression;
	readonly initializer: ForInitializer;
	readonly kind: ts.SyntaxKind.ForOfStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export interface ForStatement extends ts.Node {
	readonly condition?: Expression;
	readonly incrementor?: Expression;
	readonly initializer?: ForInitializer;
	readonly kind: ts.SyntaxKind.ForStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export type FunctionBody = Block;
export interface FunctionDeclaration extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body?: FunctionBody;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.FunctionDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name?: Identifier;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: StatementParent;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface FunctionExpression extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body: FunctionBody;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.FunctionExpression;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name?: Identifier;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: LeftHandSideExpressionParent;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export type FunctionOrConstructorTypeNodeBase =
	| ConstructorTypeNode
	| FunctionTypeNode;
export interface FunctionTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.FunctionType;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface GetAccessorDeclaration extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body?: FunctionBody;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.GetAccessor;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent:
		| ClassDeclaration
		| ClassExpression
		| InterfaceDeclaration
		| MappedTypeNode
		| ObjectLiteralExpressionBase
		| TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface HeritageClause extends ts.Node {
	readonly kind: ts.SyntaxKind.HeritageClause;
	readonly parent: ClassDeclaration | ClassExpression | InterfaceDeclaration;
	readonly token:
		| ts.SyntaxKind.ExtendsKeyword
		| ts.SyntaxKind.ImplementsKeyword;
	readonly types: ts.NodeArray<ExpressionWithTypeArguments>;
}
export interface Identifier extends ts.Node {
	readonly kind: ts.SyntaxKind.Identifier;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| BreakStatement
		| CallExpression
		| CaseClause
		| ClassExpression
		| ClassStaticBlockDeclaration
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| ConstructorDeclaration
		| ContinueStatement
		| DeclarationStatement
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportSpecifier
		| ExpressionStatement
		| ExternalModuleReference
		| FunctionExpression
		| FunctionOrConstructorTypeNodeBase
		| IfStatement
		| ImportAttribute
		| ImportClause
		| ImportDeclaration
		| ImportSpecifier
		| IterationStatement
		| JSDocFunctionType
		| JSDocLink
		| JSDocLinkCode
		| JSDocLinkPlain
		| JSDocMemberName
		| JSDocNamespaceDeclaration
		| JSDocPropertyLikeTag
		| JSDocReturnTag
		| JSDocTemplateTag
		| JsxAttributeLike
		| JsxClosingElement
		| JsxExpression
		| JsxNamespacedName
		| JsxOpeningElement
		| JsxSelfClosingElement
		| JsxTagNamePropertyAccess
		| LabeledStatement
		| MetaProperty
		| MethodDeclaration
		| NamedTupleMember
		| NamespaceDeclaration
		| NamespaceExport
		| NamespaceImport
		| NewExpression
		| NodeWithTypeArguments
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| QualifiedName
		| ReturnStatement
		| SatisfiesExpression
		| SemicolonClassElement
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeElement
		| TypeOfExpression
		| TypeParameterDeclaration
		| TypePredicateNode
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;

	/**
	 * Prefer to use `id.unescapedText`. (Note: This is available only in services, not internally to the TypeScript compiler.)
	 * Text of identifier, but if the identifier begins with two underscores, this will begin with three.
	 */
	readonly escapedText: ts.__String;
	readonly text: string;
}
export interface IfStatement extends ts.Node {
	readonly elseStatement?: Statement;
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.IfStatement;
	readonly parent: StatementParent;
	readonly thenStatement: Statement;
}
export interface ImportAttribute extends ts.Node {
	readonly kind: ts.SyntaxKind.ImportAttribute;
	readonly name: ImportAttributeName;
	readonly parent: ImportAttributes;
	readonly value: Expression;
}
export type ImportAttributeName = Identifier | StringLiteral;
export interface ImportAttributes extends ts.Node {
	readonly elements: ts.NodeArray<ImportAttribute>;
	readonly kind: ts.SyntaxKind.ImportAttributes;
	readonly multiLine?: boolean;
	readonly parent: ExportDeclaration | ImportDeclaration | ImportTypeNode;
	readonly token: ts.SyntaxKind.AssertKeyword | ts.SyntaxKind.WithKeyword;
}
export interface ImportClause extends ts.Node {
	readonly kind: ts.SyntaxKind.ImportClause;
	readonly parent: ImportDeclaration;
	/** @deprecated Use `phaseModifier` instead */
	readonly isTypeOnly: boolean;
	readonly name?: Identifier;
	readonly namedBindings?: NamedImportBindings;
	readonly phaseModifier: ImportPhaseModifierSyntaxKind | undefined;
}
export interface ImportDeclaration extends ts.Node {
	readonly importClause?: ImportClause;
	readonly kind: ts.SyntaxKind.ImportDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly parent: StatementParent;
	/** If this is not a StringLiteral it will be a grammar error. */
	readonly attributes?: ImportAttributes;
	readonly moduleSpecifier: Expression;
}
export interface ImportEqualsDeclaration extends ts.Node {
	readonly isTypeOnly: boolean;
	readonly kind: ts.SyntaxKind.ImportEqualsDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly moduleReference: ModuleReference;
	readonly name: Identifier;
	readonly parent: StatementParent;
}
export interface ImportExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.ImportKeyword;
	readonly parent: LeftHandSideExpressionParent;
}
export type ImportPhaseModifierSyntaxKind =
	| ts.SyntaxKind.DeferKeyword
	| ts.SyntaxKind.TypeKeyword;
export interface ImportSpecifier extends ts.Node {
	readonly isTypeOnly: boolean;
	readonly kind: ts.SyntaxKind.ImportSpecifier;
	readonly name: Identifier;
	readonly parent: NamedImports;
	readonly propertyName?: ModuleExportName;
}
export interface ImportTypeNode extends ts.Node {
	readonly argument: TypeNode;
	readonly attributes?: ImportAttributes;
	readonly isTypeOf: boolean;
	readonly kind: ts.SyntaxKind.ImportType;
	readonly parent: TypeNodeParent;
	readonly qualifier?: EntityName;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface IndexedAccessTypeNode extends ts.Node {
	readonly indexType: TypeNode;
	readonly kind: ts.SyntaxKind.IndexedAccessType;
	readonly objectType: TypeNode;
	readonly parent: TypeNodeParent;
}
export interface IndexSignatureDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.IndexSignature;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent:
		| ClassDeclaration
		| ClassExpression
		| InterfaceDeclaration
		| MappedTypeNode
		| TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type: TypeNode;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface InferTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.InferType;
	readonly parent: TypeNodeParent;
	readonly typeParameter: TypeParameterDeclaration;
}
export interface InKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.InKeyword;
	readonly parent: ModifierParent;
}
export interface InterfaceDeclaration extends ts.Node {
	readonly heritageClauses?: ts.NodeArray<HeritageClause>;
	readonly kind: ts.SyntaxKind.InterfaceDeclaration;
	readonly members: ts.NodeArray<TypeElement>;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: Identifier;
	readonly parent: StatementParent;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration>;
}
export interface IntersectionTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.IntersectionType;
	readonly parent: TypeNodeParent;
	readonly types: ts.NodeArray<TypeNode>;
}
export interface IntrinsicKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.IntrinsicKeyword;
	readonly parent: TypeNodeParent;
}
export type IterationStatement =
	| DoStatement
	| ForInStatement
	| ForOfStatement
	| ForStatement
	| WhileStatement;
export interface JSDocAllType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocAllType;
	readonly parent: TypeNodeParent;
}
export type JSDocComment =
	| JSDocLink
	| JSDocLinkCode
	| JSDocLinkPlain
	| JSDocText;
export interface JSDocFunctionType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocFunctionType;
	readonly name?: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: TypeNodeParent;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface JSDocLink extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocLink;
	readonly name?: EntityName | JSDocMemberName;
	readonly parent: JSDocPropertyLikeTag | JSDocReturnTag | JSDocTemplateTag;
	text: string;
}
export interface JSDocLinkCode extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocLinkCode;
	readonly name?: EntityName | JSDocMemberName;
	readonly parent: JSDocPropertyLikeTag | JSDocReturnTag | JSDocTemplateTag;
	text: string;
}
export interface JSDocLinkPlain extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocLinkPlain;
	readonly name?: EntityName | JSDocMemberName;
	readonly parent: JSDocPropertyLikeTag | JSDocReturnTag | JSDocTemplateTag;
	text: string;
}
export interface JSDocMemberName extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocMemberName;
	readonly left: EntityName | JSDocMemberName;
	readonly parent: JSDocLink | JSDocLinkCode | JSDocLinkPlain | JSDocMemberName;
	readonly right: Identifier;
}
export interface JSDocNamepathType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocNamepathType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export type JSDocNamespaceBody = Identifier | JSDocNamespaceDeclaration;
export interface JSDocNamespaceDeclaration extends ts.Node {
	readonly body?: JSDocNamespaceBody;
	readonly kind: ts.SyntaxKind.ModuleDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: Identifier;
	readonly parent: JSDocNamespaceDeclaration | ModuleDeclaration;
}
export interface JSDocNonNullableType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocNonNullableType;
	readonly parent: TypeNodeParent;
	readonly postfix: boolean;
	readonly type: TypeNode;
}
export interface JSDocNullableType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocNullableType;
	readonly parent: TypeNodeParent;
	readonly postfix: boolean;
	readonly type: TypeNode;
}
export interface JSDocOptionalType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocOptionalType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface JSDocParameterTag extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocParameterTag;
	readonly name: EntityName;
	readonly parent: JSDocSignature | JSDocTypeLiteral;
	readonly typeExpression?: JSDocTypeExpression;
	/** Whether the property name came before the type -- non-standard for JSDoc, but Typescript-like */
	readonly comment?: string | ts.NodeArray<JSDocComment>;
	readonly isBracketed: boolean;
	readonly isNameFirst: boolean;
	readonly tagName: Identifier;
}
export type JSDocPropertyLikeTag = JSDocParameterTag | JSDocPropertyTag;
export interface JSDocPropertyTag extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocPropertyTag;
	readonly name: EntityName;
	readonly parent: JSDocTypeLiteral;
	readonly typeExpression?: JSDocTypeExpression;
	/** Whether the property name came before the type -- non-standard for JSDoc, but Typescript-like */
	readonly comment?: string | ts.NodeArray<JSDocComment>;
	readonly isBracketed: boolean;
	readonly isNameFirst: boolean;
	readonly tagName: Identifier;
}
export interface JSDocReturnTag extends ts.Node {
	readonly comment?: string | ts.NodeArray<JSDocComment>;
	readonly kind: ts.SyntaxKind.JSDocReturnTag;
	readonly parent: JSDocSignature;
	readonly tagName: Identifier;
	readonly typeExpression?: JSDocTypeExpression;
}
export interface JSDocSignature extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocSignature;
	readonly parameters: readonly JSDocParameterTag[];
	readonly parent: TypeNodeParent;
	readonly type: JSDocReturnTag | undefined;
	readonly typeParameters?: readonly JSDocTemplateTag[];
}
export interface JSDocTemplateTag extends ts.Node {
	readonly comment?: string | ts.NodeArray<JSDocComment>;
	readonly constraint: JSDocTypeExpression | undefined;
	readonly kind: ts.SyntaxKind.JSDocTemplateTag;
	readonly parent: JSDocSignature;
	readonly tagName: Identifier;
	readonly typeParameters: ts.NodeArray<TypeParameterDeclaration>;
}
export interface JSDocText extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocText;
	readonly parent: JSDocPropertyLikeTag | JSDocReturnTag | JSDocTemplateTag;
	text: string;
}
export type JSDocType =
	| JSDocAllType
	| JSDocFunctionType
	| JSDocNamepathType
	| JSDocNonNullableType
	| JSDocNullableType
	| JSDocOptionalType
	| JSDocSignature
	| JSDocTypeLiteral
	| JSDocUnknownType
	| JSDocVariadicType;
export interface JSDocTypeExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocTypeExpression;
	readonly parent:
		| JSDocPropertyLikeTag
		| JSDocReturnTag
		| JSDocTemplateTag
		| TypeNodeParent;
	readonly type: TypeNode;
}
export interface JSDocTypeLiteral extends ts.Node {
	readonly jsDocPropertyTags?: readonly JSDocPropertyLikeTag[];
	readonly kind: ts.SyntaxKind.JSDocTypeLiteral;
	readonly parent: TypeNodeParent;
	/** If true, then this type literal represents an *array* of its type. */
	readonly isArrayType: boolean;
}
export interface JSDocUnknownType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocUnknownType;
	readonly parent: TypeNodeParent;
}
export interface JSDocVariadicType extends ts.Node {
	readonly kind: ts.SyntaxKind.JSDocVariadicType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface JsxAttribute extends ts.Node {
	readonly initializer?: JsxAttributeValue;
	readonly kind: ts.SyntaxKind.JsxAttribute;
	readonly name: JsxAttributeName;
	readonly parent: JsxAttributes;
}
export type JsxAttributeLike = JsxAttribute | JsxSpreadAttribute;
export type JsxAttributeName = Identifier | JsxNamespacedName;
export interface JsxAttributes extends ts.Node {
	readonly kind: ts.SyntaxKind.JsxAttributes;
	readonly parent:
		| JsxOpeningElement
		| JsxSelfClosingElement
		| LeftHandSideExpressionParent;
	readonly properties: ts.NodeArray<JsxAttributeLike>;
}
export type JsxAttributeValue =
	| JsxElement
	| JsxExpression
	| JsxFragment
	| JsxSelfClosingElement
	| StringLiteral;
export type JsxChild =
	| JsxElement
	| JsxExpression
	| JsxFragment
	| JsxSelfClosingElement
	| JsxText;
export interface JsxClosingElement extends ts.Node {
	readonly kind: ts.SyntaxKind.JsxClosingElement;
	readonly parent: JsxElement;
	readonly tagName: JsxTagNameExpression;
}
export interface JsxClosingFragment extends ts.Node {
	readonly kind: ts.SyntaxKind.JsxClosingFragment;
	readonly parent: ExpressionParent | JsxFragment;
}
export interface JsxElement extends ts.Node {
	readonly children: ts.NodeArray<JsxChild>;
	readonly closingElement: JsxClosingElement;
	readonly kind: ts.SyntaxKind.JsxElement;
	readonly openingElement: JsxOpeningElement;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CaseClause
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExpressionWithTypeArguments
		| ExternalModuleReference
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| IterationStatement
		| JsxAttributeLike
		| JsxElement
		| JsxExpression
		| JsxFragment
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeOfExpression
		| TypeParameterDeclaration
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;
}
export interface JsxExpression extends ts.Node {
	readonly dotDotDotToken?: Token<ts.SyntaxKind.DotDotDotToken, JsxExpression>;
	readonly expression?: Expression;
	readonly kind: ts.SyntaxKind.JsxExpression;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CaseClause
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExternalModuleReference
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| IterationStatement
		| JsxAttributeLike
		| JsxElement
		| JsxExpression
		| JsxFragment
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TemplateSpan
		| ThrowStatement
		| TypeParameterDeclaration
		| VariableDeclaration
		| WithStatement
		| YieldExpression;
}
export interface JsxFragment extends ts.Node {
	readonly children: ts.NodeArray<JsxChild>;
	readonly closingFragment: JsxClosingFragment;
	readonly kind: ts.SyntaxKind.JsxFragment;
	readonly openingFragment: JsxOpeningFragment;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CaseClause
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExpressionWithTypeArguments
		| ExternalModuleReference
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| IterationStatement
		| JsxAttributeLike
		| JsxElement
		| JsxExpression
		| JsxFragment
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeOfExpression
		| TypeParameterDeclaration
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;
}
export interface JsxNamespacedName extends ts.Node {
	readonly kind: ts.SyntaxKind.JsxNamespacedName;
	readonly name: Identifier;
	readonly namespace: Identifier;
	readonly parent:
		| JsxAttribute
		| JsxClosingElement
		| JsxOpeningElement
		| JsxSelfClosingElement;
}
export interface JsxOpeningElement extends ts.Node {
	readonly attributes: JsxAttributes;
	readonly kind: ts.SyntaxKind.JsxOpeningElement;
	readonly parent: ExpressionParent | JsxElement;
	readonly tagName: JsxTagNameExpression;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface JsxOpeningFragment extends ts.Node {
	readonly kind: ts.SyntaxKind.JsxOpeningFragment;
	readonly parent: ExpressionParent | JsxFragment;
}
export interface JsxSelfClosingElement extends ts.Node {
	readonly attributes: JsxAttributes;
	readonly kind: ts.SyntaxKind.JsxSelfClosingElement;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CaseClause
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExpressionWithTypeArguments
		| ExternalModuleReference
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| IterationStatement
		| JsxAttributeLike
		| JsxElement
		| JsxExpression
		| JsxFragment
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeOfExpression
		| TypeParameterDeclaration
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;
	readonly tagName: JsxTagNameExpression;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface JsxSpreadAttribute extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.JsxSpreadAttribute;
	readonly name?: PropertyName;
	readonly parent: JsxAttributes;
}
export type JsxTagNameExpression =
	| Identifier
	| JsxNamespacedName
	| JsxTagNamePropertyAccess
	| ThisExpression;
export interface JsxTagNamePropertyAccess extends ts.Node {
	readonly expression: Identifier | JsxTagNamePropertyAccess | ThisExpression;
	readonly kind: ts.SyntaxKind.PropertyAccessExpression;
	readonly name: MemberName;
	readonly parent:
		| JsxClosingElement
		| JsxOpeningElement
		| JsxSelfClosingElement
		| JsxTagNamePropertyAccess;
	readonly questionDotToken?: QuestionDotToken;
}
export interface JsxText extends ts.Node {
	readonly containsOnlyTriviaWhiteSpaces: boolean;
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.JsxText;
	readonly parent: JsxElement | JsxFragment;
	text: string;
}
export interface LabeledStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.LabeledStatement;
	readonly label: Identifier;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export type LeftHandSideExpression =
	| CallExpression
	| MemberExpression
	| NonNullExpression
	| PartiallyEmittedExpression;
export type LiteralExpression =
	| BigIntLiteral
	| NoSubstitutionTemplateLiteral
	| NumericLiteral
	| RegularExpressionLiteral
	| StringLiteral;
export interface LiteralTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.LiteralType;
	readonly literal:
		| BooleanLiteral
		| LiteralExpression
		| NullLiteral
		| PrefixUnaryExpression;
	readonly parent: TypeNodeParent;
}
export type LogicalOperator =
	| ts.SyntaxKind.AmpersandAmpersandToken
	| ts.SyntaxKind.BarBarToken;
export type LogicalOperatorOrHigher = BitwiseOperatorOrHigher | LogicalOperator;
export interface MappedTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.MappedType;
	readonly nameType?: TypeNode;
	readonly parent: TypeNodeParent;
	readonly questionToken?: MinusToken | PlusToken | QuestionToken;
	readonly readonlyToken?: MinusToken | PlusToken | ReadonlyKeyword;
	readonly type?: TypeNode;
	readonly typeParameter: TypeParameterDeclaration;
	/** Used only to produce grammar errors */
	readonly members?: ts.NodeArray<TypeElement>;
}
export type MemberExpression =
	| ElementAccessExpression
	| ExpressionWithTypeArguments
	| PrimaryExpression
	| PropertyAccessExpression
	| TaggedTemplateExpression;
export type MemberName = Identifier | PrivateIdentifier;
export interface MetaProperty extends ts.Node {
	readonly keywordToken: ts.SyntaxKind.ImportKeyword | ts.SyntaxKind.NewKeyword;
	readonly kind: ts.SyntaxKind.MetaProperty;
	readonly name: Identifier;
	readonly parent: LeftHandSideExpressionParent;
}
export interface MethodDeclaration extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body?: FunctionBody | undefined;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.MethodDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike> | undefined;
	readonly name: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent:
		| ClassDeclaration
		| ClassExpression
		| ObjectLiteralExpressionBase;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface MethodSignature extends ts.Node {
	readonly kind: ts.SyntaxKind.MethodSignature;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent: InterfaceDeclaration | MappedTypeNode | TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export interface MinusToken extends ts.Node {
	readonly kind: ts.SyntaxKind.MinusToken;
	readonly parent: MappedTypeNode;
}
export interface MissingDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.MissingDeclaration;
	readonly name?: Identifier;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExpressionStatement
		| ExpressionWithTypeArguments
		| ExternalModuleReference
		| ImportAttribute
		| ImportDeclaration
		| JsxExpression
		| JsxSpreadAttribute
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| StatementParent
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeOfExpression
		| TypeParameterDeclaration
		| VariableDeclaration
		| VoidExpression
		| YieldExpression;
}
export type Modifier =
	| AbstractKeyword
	| AccessorKeyword
	| AsyncKeyword
	| ConstKeyword
	| DeclareKeyword
	| DefaultKeyword
	| ExportKeyword
	| InKeyword
	| OutKeyword
	| OverrideKeyword
	| PrivateKeyword
	| ProtectedKeyword
	| PublicKeyword
	| ReadonlyKeyword
	| StaticKeyword;
export type ModifierLike = Decorator | Modifier;
export interface ModuleBlock extends ts.Node {
	readonly kind: ts.SyntaxKind.ModuleBlock;
	readonly parent:
		| Block
		| CaseOrDefaultClause
		| IfStatement
		| IterationStatement
		| LabeledStatement
		| ModuleDeclaration
		| NamespaceBody
		| SourceFile
		| WithStatement;
	readonly statements: ts.NodeArray<Statement>;
}
export type ModuleBody = JSDocNamespaceBody | NamespaceBody;
export interface ModuleDeclaration extends ts.Node {
	readonly body?: JSDocNamespaceDeclaration | ModuleBody;
	readonly kind: ts.SyntaxKind.ModuleDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: ModuleName;
	readonly parent: StatementParent;
}
export type ModuleExportName = Identifier | StringLiteral;
export type ModuleName = Identifier | StringLiteral;
export type ModuleReference = EntityName | ExternalModuleReference;
export type MultiplicativeOperator =
	| ts.SyntaxKind.AsteriskToken
	| ts.SyntaxKind.PercentToken
	| ts.SyntaxKind.SlashToken;
export type MultiplicativeOperatorOrHigher =
	| ExponentiationOperator
	| MultiplicativeOperator;
export type NamedExportBindings = NamedExports | NamespaceExport;
export interface NamedExports extends ts.Node {
	readonly elements: ts.NodeArray<ExportSpecifier>;
	readonly kind: ts.SyntaxKind.NamedExports;
	readonly parent: ExportDeclaration;
}
export type NamedImportBindings = NamedImports | NamespaceImport;
export interface NamedImports extends ts.Node {
	readonly elements: ts.NodeArray<ImportSpecifier>;
	readonly kind: ts.SyntaxKind.NamedImports;
	readonly parent: ImportClause;
}
export interface NamedTupleMember extends ts.Node {
	readonly dotDotDotToken?: Token<
		ts.SyntaxKind.DotDotDotToken,
		NamedTupleMember
	>;
	readonly kind: ts.SyntaxKind.NamedTupleMember;
	readonly name: Identifier;
	readonly parent: SyntheticExpression | TypeNodeParent;
	readonly questionToken?: Token<ts.SyntaxKind.QuestionToken, NamedTupleMember>;
	readonly type: TypeNode;
}
export type NamespaceBody = ModuleBlock | NamespaceDeclaration;
export interface NamespaceDeclaration extends ts.Node {
	readonly body: NamespaceBody;
	readonly kind: ts.SyntaxKind.ModuleDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: Identifier;
	readonly parent: ModuleDeclaration | NamespaceDeclaration;
}
export interface NamespaceExport extends ts.Node {
	readonly kind: ts.SyntaxKind.NamespaceExport;
	readonly name: ModuleExportName;
	readonly parent: ExportDeclaration;
}
export interface NamespaceExportDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.NamespaceExportDeclaration;
	readonly name: Identifier;
	readonly parent: StatementParent;
}
export interface NamespaceImport extends ts.Node {
	readonly kind: ts.SyntaxKind.NamespaceImport;
	readonly name: Identifier;
	readonly parent: ImportClause;
}
export interface NeverKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.NeverKeyword;
	readonly parent: TypeNodeParent;
}
export interface NewExpression extends ts.Node {
	readonly arguments?: ts.NodeArray<Expression>;
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.NewExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export type NodeWithTypeArguments =
	| ExpressionWithTypeArguments
	| ImportTypeNode
	| TypeQueryNode
	| TypeReferenceNode;
export interface NonNullExpression extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.NonNullExpression;
	readonly parent: LeftHandSideExpressionParent;
}
export interface NoSubstitutionTemplateLiteral extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.NoSubstitutionTemplateLiteral;
	readonly parent:
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| FunctionOrConstructorTypeNodeBase
		| JSDocFunctionType
		| LeftHandSideExpressionParent
		| LiteralTypeNode
		| MethodDeclaration
		| SemicolonClassElement
		| TypeElement;
	rawText?: string;
	text: string;
}
export interface NotEmittedStatement extends ts.Node {
	readonly kind: ts.SyntaxKind.NotEmittedStatement;
	readonly parent: StatementParent;
}
export interface NotEmittedTypeElement extends ts.Node {
	readonly kind: ts.SyntaxKind.NotEmittedTypeElement;
	readonly name?: PropertyName;
	readonly parent: InterfaceDeclaration | MappedTypeNode | TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
}
export interface NullLiteral extends ts.Node {
	readonly kind: ts.SyntaxKind.NullKeyword;
	readonly parent: LeftHandSideExpressionParent | LiteralTypeNode;
}
export interface NumberKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.NumberKeyword;
	readonly parent: TypeNodeParent;
}
export interface NumericLiteral extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.NumericLiteral;
	readonly parent:
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| FunctionOrConstructorTypeNodeBase
		| JSDocFunctionType
		| LeftHandSideExpressionParent
		| LiteralTypeNode
		| MethodDeclaration
		| SemicolonClassElement
		| TypeElement;
	text: string;
}
export interface ObjectBindingPattern extends ts.Node {
	readonly elements: ts.NodeArray<BindingElement>;
	readonly kind: ts.SyntaxKind.ObjectBindingPattern;
	readonly parent: BindingElement | ParameterDeclaration | VariableDeclaration;
}
export interface ObjectKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.ObjectKeyword;
	readonly parent: TypeNodeParent;
}
export type ObjectLiteralElementLike =
	| AccessorDeclaration
	| MethodDeclaration
	| PropertyAssignment
	| ShorthandPropertyAssignment
	| SpreadAssignment;
export interface ObjectLiteralExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.ObjectLiteralExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly properties: ts.NodeArray<ObjectLiteralElementLike>;
}
export type ObjectLiteralExpressionBase = ObjectLiteralExpression;
export interface OmittedExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.OmittedExpression;
	readonly parent: ArrayBindingPattern | ExpressionParent;
}
export interface OptionalTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.OptionalType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface OutKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.OutKeyword;
	readonly parent: ModifierParent;
}
export interface OverrideKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.OverrideKeyword;
	readonly parent: ModifierParent;
}
export interface ParameterDeclaration extends ts.Node {
	readonly dotDotDotToken?: DotDotDotToken;
	readonly initializer?: Expression;
	readonly kind: ts.SyntaxKind.Parameter;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: BindingName;
	readonly parent:
		| AccessorDeclaration
		| ArrowFunction
		| CallSignatureDeclaration
		| ConstructorDeclaration
		| ConstructSignatureDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| FunctionOrConstructorTypeNodeBase
		| IndexSignatureDeclaration
		| JSDocFunctionType
		| MethodDeclaration
		| MethodSignature
		| SyntheticExpression;
	readonly questionToken?: QuestionToken;
	readonly type?: TypeNode;
}
export interface ParenthesizedExpression extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.ParenthesizedExpression;
	readonly parent: LeftHandSideExpressionParent;
}
export interface ParenthesizedTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.ParenthesizedType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface PartiallyEmittedExpression extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.PartiallyEmittedExpression;
	readonly parent: LeftHandSideExpressionParent;
}
export interface PlusToken extends ts.Node {
	readonly kind: ts.SyntaxKind.PlusToken;
	readonly parent: MappedTypeNode;
}
export interface PostfixUnaryExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.PostfixUnaryExpression;
	readonly operand: LeftHandSideExpression;
	readonly operator: PostfixUnaryOperator;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export type PostfixUnaryOperator =
	| ts.SyntaxKind.MinusMinusToken
	| ts.SyntaxKind.PlusPlusToken;
export interface PrefixUnaryExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.PrefixUnaryExpression;
	readonly operand: UnaryExpression;
	readonly operator: PrefixUnaryOperator;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| LiteralTypeNode
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export type PrefixUnaryOperator =
	| ts.SyntaxKind.ExclamationToken
	| ts.SyntaxKind.MinusMinusToken
	| ts.SyntaxKind.MinusToken
	| ts.SyntaxKind.PlusPlusToken
	| ts.SyntaxKind.PlusToken
	| ts.SyntaxKind.TildeToken;
export type PrimaryExpression =
	| ArrayLiteralExpression
	| ClassExpression
	| FalseLiteral
	| FunctionExpression
	| Identifier
	| ImportExpression
	| JsxAttributes
	| JsxElement
	| JsxFragment
	| JsxSelfClosingElement
	| LiteralExpression
	| MetaProperty
	| MissingDeclaration
	| NewExpression
	| NullLiteral
	| ObjectLiteralExpressionBase
	| ParenthesizedExpression
	| PrivateIdentifier
	| SuperExpression
	| TemplateExpression
	| ThisExpression
	| TrueLiteral;
export interface PrivateIdentifier extends ts.Node {
	readonly escapedText: ts.__String;
	readonly kind: ts.SyntaxKind.PrivateIdentifier;
	readonly parent:
		| ClassStaticBlockDeclaration
		| ConstructorDeclaration
		| FunctionOrConstructorTypeNodeBase
		| JSDocFunctionType
		| JsxTagNamePropertyAccess
		| LeftHandSideExpressionParent
		| MethodDeclaration
		| SemicolonClassElement
		| TypeElement;
	readonly text: string;
}
export interface PrivateKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.PrivateKeyword;
	readonly parent: ModifierParent;
}
export interface PropertyAccessExpression extends ts.Node {
	readonly expression: LeftHandSideExpression;
	readonly kind: ts.SyntaxKind.PropertyAccessExpression;
	readonly name: MemberName;
	readonly parent: LeftHandSideExpressionParent;
	readonly questionDotToken?: QuestionDotToken;
}
export interface PropertyAssignment extends ts.Node {
	readonly initializer: Expression;
	readonly kind: ts.SyntaxKind.PropertyAssignment;
	readonly name: PropertyName;
	readonly parent: ObjectLiteralExpressionBase;
}
export interface PropertyDeclaration extends ts.Node {
	readonly exclamationToken?: ExclamationToken;
	readonly initializer?: Expression;
	readonly kind: ts.SyntaxKind.PropertyDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: PropertyName;
	readonly parent: ClassDeclaration | ClassExpression;
	readonly questionToken?: QuestionToken;
	readonly type?: TypeNode;
}
export type PropertyName =
	| BigIntLiteral
	| ComputedPropertyName
	| Identifier
	| NoSubstitutionTemplateLiteral
	| NumericLiteral
	| PrivateIdentifier
	| StringLiteral;
export interface PropertySignature extends ts.Node {
	readonly kind: ts.SyntaxKind.PropertySignature;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name: PropertyName;
	readonly parent: InterfaceDeclaration | MappedTypeNode | TypeLiteralNode;
	readonly questionToken?: QuestionToken;
	readonly type?: TypeNode;
}
export interface ProtectedKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.ProtectedKeyword;
	readonly parent: ModifierParent;
}
export interface PublicKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.PublicKeyword;
	readonly parent: ModifierParent;
}
export interface QualifiedName extends ts.Node {
	readonly kind: ts.SyntaxKind.QualifiedName;
	readonly left: EntityName;
	readonly parent:
		| ImportEqualsDeclaration
		| ImportTypeNode
		| JSDocLink
		| JSDocLinkCode
		| JSDocLinkPlain
		| JSDocMemberName
		| JSDocPropertyLikeTag
		| QualifiedName
		| TypeQueryNode
		| TypeReferenceNode;
	readonly right: Identifier;
}
export interface QuestionDotToken extends ts.Node {
	readonly kind: ts.SyntaxKind.QuestionDotToken;
	readonly parent:
		| CallExpression
		| ElementAccessExpression
		| JsxTagNamePropertyAccess
		| PropertyAccessExpression;
}
export interface QuestionToken extends ts.Node {
	readonly kind: ts.SyntaxKind.QuestionToken;
	readonly parent:
		| ArrowFunction
		| ConditionalExpression
		| ConstructorDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| MappedTypeNode
		| MethodDeclaration
		| ParameterDeclaration
		| PropertyDeclaration
		| TypeElement;
}
export interface ReadonlyKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.ReadonlyKeyword;
	readonly parent: MappedTypeNode | ModifierParent;
}
export interface RegularExpressionLiteral extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.RegularExpressionLiteral;
	readonly parent: LeftHandSideExpressionParent | LiteralTypeNode;
	text: string;
}
export type RelationalOperator =
	| ts.SyntaxKind.GreaterThanEqualsToken
	| ts.SyntaxKind.GreaterThanToken
	| ts.SyntaxKind.InKeyword
	| ts.SyntaxKind.InstanceOfKeyword
	| ts.SyntaxKind.LessThanEqualsToken
	| ts.SyntaxKind.LessThanToken;
export type RelationalOperatorOrHigher =
	| RelationalOperator
	| ShiftOperatorOrHigher;
export interface RestTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.RestType;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface ReturnStatement extends ts.Node {
	readonly expression?: Expression;
	readonly kind: ts.SyntaxKind.ReturnStatement;
	readonly parent: StatementParent;
}
export interface SatisfiesExpression extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.SatisfiesExpression;
	readonly parent: ExpressionParent;
	readonly type: TypeNode;
}
export interface SemicolonClassElement extends ts.Node {
	readonly kind: ts.SyntaxKind.SemicolonClassElement;
	readonly name?: PropertyName;
	readonly parent: ClassDeclaration | ClassExpression;
}
export interface SetAccessorDeclaration extends ts.Node {
	readonly asteriskToken?: AsteriskToken | undefined;
	readonly body?: FunctionBody;
	readonly exclamationToken?: ExclamationToken | undefined;
	readonly kind: ts.SyntaxKind.SetAccessor;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: PropertyName;
	readonly parameters: ts.NodeArray<ParameterDeclaration>;
	readonly parent:
		| ClassDeclaration
		| ClassExpression
		| InterfaceDeclaration
		| MappedTypeNode
		| ObjectLiteralExpressionBase
		| TypeLiteralNode;
	readonly questionToken?: QuestionToken | undefined;
	readonly type?: TypeNode | undefined;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration> | undefined;
}
export type ShiftOperator =
	| ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
	| ts.SyntaxKind.GreaterThanGreaterThanToken
	| ts.SyntaxKind.LessThanLessThanToken;
export type ShiftOperatorOrHigher = AdditiveOperatorOrHigher | ShiftOperator;
export interface ShorthandPropertyAssignment extends ts.Node {
	readonly equalsToken?: EqualsToken;
	readonly kind: ts.SyntaxKind.ShorthandPropertyAssignment;
	readonly name: Identifier;
	readonly objectAssignmentInitializer?: Expression;
	readonly parent: ObjectLiteralExpressionBase;
}
export interface SourceFile extends ts.Node {
	readonly kind: ts.SyntaxKind.SourceFile;
	// parent is actually undefined, see comment for NullNode
	amdDependencies: readonly ts.AmdDependency[];
	readonly endOfFileToken: Token<ts.SyntaxKind.EndOfFileToken, SourceFile>;
	fileName: string;
	isDeclarationFile: boolean;
	languageVariant: ts.LanguageVariant;
	libReferenceDirectives: readonly ts.FileReference[];
	moduleName?: string;
	readonly parent: NullNode;
	referencedFiles: readonly ts.FileReference[];
	readonly statements: ts.NodeArray<Statement>;
	text: string;
	typeReferenceDirectives: readonly ts.FileReference[];

	/**
	 * lib.d.ts should have a reference comment like
	 *
	 *  /// &lt;reference no-default-lib="true"/>
	 *
	 * If any other file has this comment, it signals not to include lib.d.ts
	 * because this containing file is intended to act as a default library.
	 */
	hasNoDefaultLib: boolean;
	languageVersion: ts.ScriptTarget;

	/**
	 * When `module` is `Node16` or `NodeNext`, this field controls whether the
	 * source file in question is an ESNext-output-format file, or a CommonJS-output-format
	 * module. This is derived by the module resolver as it looks up the file, since
	 * it is derived from either the file extension of the module, or the containing
	 * `package.json` context, and affects both checking and emit.
	 *
	 * It is _public_ so that (pre)transformers can set this field,
	 * since it switches the builtin `node` module transform. Generally speaking, if unset,
	 * the field is treated as though it is `ModuleKind.CommonJS`.
	 *
	 * Note that this field is only set by the module resolution process when
	 * `moduleResolution` is `Node16` or `NodeNext`, which is implied by the `module` setting
	 * of `Node16` or `NodeNext`, respectively, but may be overriden (eg, by a `moduleResolution`
	 * of `node`). If so, this field will be unset and source files will be considered to be
	 * CommonJS-output-format by the node module transformer and type checker, regardless of extension or context.
	 */
	getLineAndCharacterOfPosition(pos: number): ts.LineAndCharacter;
	getLineEndOfPosition(pos: number): number;
	getLineStarts(): readonly number[];
	getPositionOfLineAndCharacter(line: number, character: number): number;
	impliedNodeFormat?: ts.ResolutionMode;
	update(newText: string, textChangeRange: ts.TextChangeRange): SourceFile;
}
export interface SpreadAssignment extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.SpreadAssignment;
	readonly name?: PropertyName;
	readonly parent: ObjectLiteralExpressionBase;
}
export interface SpreadElement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.SpreadElement;
	readonly parent: ExpressionParent;
}
export type Statement =
	| Block
	| BreakStatement
	| ContinueStatement
	| DebuggerStatement
	| DeclarationStatement
	| EmptyStatement
	| ExpressionStatement
	| IfStatement
	| ImportDeclaration
	| IterationStatement
	| LabeledStatement
	| ModuleBlock
	| NotEmittedStatement
	| ReturnStatement
	| SwitchStatement
	| ThrowStatement
	| TryStatement
	| VariableStatement
	| WithStatement;
export interface StaticKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.StaticKeyword;
	readonly parent: ModifierParent;
}
export interface StringKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.StringKeyword;
	readonly parent: TypeNodeParent;
}
export interface StringLiteral extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.StringLiteral;
	readonly parent:
		| ArrayLiteralExpression
		| ArrowFunction
		| AsExpression
		| AwaitExpression
		| BinaryExpression
		| BindingElement
		| CallExpression
		| CaseClause
		| ClassStaticBlockDeclaration
		| CommaListExpression
		| ComputedPropertyName
		| ConditionalExpression
		| ConstructorDeclaration
		| Decorator
		| DeleteExpression
		| ElementAccessExpression
		| EnumMember
		| ExportAssignment
		| ExportDeclaration
		| ExportSpecifier
		| ExpressionStatement
		| ExpressionWithTypeArguments
		| ExternalModuleReference
		| FunctionOrConstructorTypeNodeBase
		| IfStatement
		| ImportAttribute
		| ImportDeclaration
		| ImportSpecifier
		| IterationStatement
		| JSDocFunctionType
		| JsxAttributeLike
		| JsxExpression
		| LiteralTypeNode
		| MethodDeclaration
		| ModuleDeclaration
		| NamespaceExport
		| NewExpression
		| NonNullExpression
		| ParameterDeclaration
		| ParenthesizedExpression
		| PartiallyEmittedExpression
		| PostfixUnaryExpression
		| PrefixUnaryExpression
		| PropertyAccessExpression
		| PropertyAssignment
		| PropertyDeclaration
		| ReturnStatement
		| SatisfiesExpression
		| SemicolonClassElement
		| ShorthandPropertyAssignment
		| SpreadAssignment
		| SpreadElement
		| SwitchStatement
		| TaggedTemplateExpression
		| TemplateSpan
		| ThrowStatement
		| TypeAssertion
		| TypeElement
		| TypeOfExpression
		| TypeParameterDeclaration
		| VariableDeclaration
		| VoidExpression
		| WithStatement
		| YieldExpression;
	text: string;
}
export interface SuperExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.SuperKeyword;
	readonly parent: LeftHandSideExpressionParent;
}
export interface SwitchStatement extends ts.Node {
	readonly caseBlock: CaseBlock;
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.SwitchStatement;
	readonly parent: StatementParent;
	possiblyExhaustive?: boolean;
}
export interface SymbolKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.SymbolKeyword;
	readonly parent: TypeNodeParent;
}
export interface SyntheticExpression extends ts.Node {
	readonly isSpread: boolean;
	readonly kind: ts.SyntaxKind.SyntheticExpression;
	readonly parent: ExpressionParent;
	readonly tupleNameSource?: NamedTupleMember | ParameterDeclaration;
	readonly type: ts.Type;
}
export interface TaggedTemplateExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.TaggedTemplateExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly tag: LeftHandSideExpression;
	readonly template: TemplateLiteral;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface TemplateExpression extends ts.Node {
	readonly head: TemplateHead;
	readonly kind: ts.SyntaxKind.TemplateExpression;
	readonly parent: LeftHandSideExpressionParent;
	readonly templateSpans: ts.NodeArray<TemplateSpan>;
}
export interface TemplateHead extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.TemplateHead;
	readonly parent: TemplateExpression | TemplateLiteralTypeNode;
	rawText?: string;
	text: string;
}
export type TemplateLiteral =
	| NoSubstitutionTemplateLiteral
	| TemplateExpression;
export interface TemplateLiteralTypeNode extends ts.Node {
	readonly head: TemplateHead;
	readonly kind: ts.SyntaxKind.TemplateLiteralType;
	readonly parent: TypeNodeParent;
	readonly templateSpans: ts.NodeArray<TemplateLiteralTypeSpan>;
}
export interface TemplateLiteralTypeSpan extends ts.Node {
	readonly kind: ts.SyntaxKind.TemplateLiteralTypeSpan;
	readonly literal: TemplateMiddle | TemplateTail;
	readonly parent: TemplateLiteralTypeNode | TypeNodeParent;
	readonly type: TypeNode;
}
export interface TemplateMiddle extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.TemplateMiddle;
	readonly parent: TemplateLiteralTypeSpan | TemplateSpan;
	rawText?: string;
	text: string;
}
export interface TemplateSpan extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.TemplateSpan;
	readonly literal: TemplateMiddle | TemplateTail;
	readonly parent: TemplateExpression;
}
export interface TemplateTail extends ts.Node {
	hasExtendedUnicodeEscape?: boolean;
	isUnterminated?: boolean;
	readonly kind: ts.SyntaxKind.TemplateTail;
	readonly parent: TemplateLiteralTypeSpan | TemplateSpan;
	rawText?: string;
	text: string;
}
export interface ThisExpression extends ts.Node {
	readonly kind: ts.SyntaxKind.ThisKeyword;
	readonly parent:
		| JsxClosingElement
		| JsxOpeningElement
		| JsxSelfClosingElement
		| JsxTagNamePropertyAccess
		| LeftHandSideExpressionParent;
}
export interface ThisTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.ThisType;
	readonly parent: TypeNodeParent;
}
export interface ThrowStatement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.ThrowStatement;
	readonly parent: StatementParent;
}
export interface TrueLiteral extends ts.Node {
	readonly kind: ts.SyntaxKind.TrueKeyword;
	readonly parent: LeftHandSideExpressionParent | LiteralTypeNode;
}
export interface TryStatement extends ts.Node {
	readonly catchClause?: CatchClause;
	readonly finallyBlock?: Block;
	readonly kind: ts.SyntaxKind.TryStatement;
	readonly parent: StatementParent;
	readonly tryBlock: Block;
}
export interface TupleTypeNode extends ts.Node {
	readonly elements: ts.NodeArray<NamedTupleMember | TypeNode>;
	readonly kind: ts.SyntaxKind.TupleType;
	readonly parent: TypeNodeParent;
}
export interface TypeAliasDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.TypeAliasDeclaration;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly name: Identifier;
	readonly parent: StatementParent;
	readonly type: TypeNode;
	readonly typeParameters?: ts.NodeArray<TypeParameterDeclaration>;
}
export interface TypeAssertion extends ts.Node {
	readonly expression: UnaryExpression;
	readonly kind: ts.SyntaxKind.TypeAssertionExpression;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
	readonly type: TypeNode;
}
export type TypeElement =
	| CallSignatureDeclaration
	| ConstructSignatureDeclaration
	| GetAccessorDeclaration
	| IndexSignatureDeclaration
	| MethodSignature
	| NotEmittedTypeElement
	| PropertySignature
	| SetAccessorDeclaration;
export interface TypeLiteralNode extends ts.Node {
	readonly kind: ts.SyntaxKind.TypeLiteral;
	readonly members: ts.NodeArray<TypeElement>;
	readonly parent: TypeNodeParent;
}
export type TypeNode =
	| AnyKeyword
	| ArrayTypeNode
	| BigIntKeyword
	| BooleanKeyword
	| ConditionalTypeNode
	| FunctionOrConstructorTypeNodeBase
	| IndexedAccessTypeNode
	| InferTypeNode
	| IntersectionTypeNode
	| IntrinsicKeyword
	| JSDocType
	| JSDocTypeExpression
	| LiteralTypeNode
	| MappedTypeNode
	| NamedTupleMember
	| NeverKeyword
	| NodeWithTypeArguments
	| NumberKeyword
	| ObjectKeyword
	| OptionalTypeNode
	| ParenthesizedTypeNode
	| RestTypeNode
	| StringKeyword
	| SymbolKeyword
	| TemplateLiteralTypeNode
	| TemplateLiteralTypeSpan
	| ThisTypeNode
	| TupleTypeNode
	| TypeLiteralNode
	| TypeOperatorNode
	| TypePredicateNode
	| UndefinedKeyword
	| UnionTypeNode
	| UnknownKeyword
	| VoidKeyword;
export interface TypeOfExpression extends ts.Node {
	readonly expression: UnaryExpression;
	readonly kind: ts.SyntaxKind.TypeOfExpression;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export interface TypeOperatorNode extends ts.Node {
	readonly kind: ts.SyntaxKind.TypeOperator;
	readonly operator:
		| ts.SyntaxKind.KeyOfKeyword
		| ts.SyntaxKind.ReadonlyKeyword
		| ts.SyntaxKind.UniqueKeyword;
	readonly parent: TypeNodeParent;
	readonly type: TypeNode;
}
export interface TypeParameterDeclaration extends ts.Node {
	readonly kind: ts.SyntaxKind.TypeParameter;
	readonly modifiers?: ts.NodeArray<Modifier>;
	readonly name: Identifier;
	readonly parent:
		| AccessorDeclaration
		| ArrowFunction
		| CallSignatureDeclaration
		| ClassDeclaration
		| ClassExpression
		| ConstructorDeclaration
		| ConstructSignatureDeclaration
		| FunctionDeclaration
		| FunctionExpression
		| FunctionOrConstructorTypeNodeBase
		| IndexSignatureDeclaration
		| InferTypeNode
		| InterfaceDeclaration
		| JSDocFunctionType
		| JSDocTemplateTag
		| MappedTypeNode
		| MethodDeclaration
		| MethodSignature
		| TypeAliasDeclaration;
	/** Note: Consider calling `getEffectiveConstraintOfTypeParameter` */
	readonly constraint?: TypeNode;
	readonly default?: TypeNode;
	expression?: Expression;
}
export interface TypePredicateNode extends ts.Node {
	readonly assertsModifier?: AssertsKeyword;
	readonly kind: ts.SyntaxKind.TypePredicate;
	readonly parameterName: Identifier | ThisTypeNode;
	readonly parent: TypeNodeParent;
	readonly type?: TypeNode;
}
export interface TypeQueryNode extends ts.Node {
	readonly exprName: EntityName;
	readonly kind: ts.SyntaxKind.TypeQuery;
	readonly parent: TypeNodeParent;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
}
export interface TypeReferenceNode extends ts.Node {
	readonly kind: ts.SyntaxKind.TypeReference;
	readonly parent: TypeNodeParent;
	readonly typeArguments?: ts.NodeArray<TypeNode>;
	readonly typeName: EntityName;
}
export type UnaryExpression =
	| AwaitExpression
	| DeleteExpression
	| TypeAssertion
	| TypeOfExpression
	| UpdateExpression
	| VoidExpression;
export interface UndefinedKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.UndefinedKeyword;
	readonly parent: TypeNodeParent;
}
export interface UnionTypeNode extends ts.Node {
	readonly kind: ts.SyntaxKind.UnionType;
	readonly parent: TypeNodeParent;
	readonly types: ts.NodeArray<TypeNode>;
}
export interface UnknownKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.UnknownKeyword;
	readonly parent: TypeNodeParent;
}
export type UpdateExpression =
	| LeftHandSideExpression
	| PostfixUnaryExpression
	| PrefixUnaryExpression;
export interface VariableDeclaration extends ts.Node {
	readonly exclamationToken?: ExclamationToken;
	readonly initializer?: Expression;
	readonly kind: ts.SyntaxKind.VariableDeclaration;
	readonly name: BindingName;
	readonly parent: CatchClause | VariableDeclarationList;
	readonly type?: TypeNode;
}
export interface VariableDeclarationList extends ts.Node {
	readonly declarations: ts.NodeArray<VariableDeclaration>;
	readonly kind: ts.SyntaxKind.VariableDeclarationList;
	readonly parent:
		| ForInStatement
		| ForOfStatement
		| ForStatement
		| VariableStatement;
}
export interface VariableStatement extends ts.Node {
	readonly declarationList: VariableDeclarationList;
	readonly kind: ts.SyntaxKind.VariableStatement;
	readonly modifiers?: ts.NodeArray<ModifierLike>;
	readonly parent: StatementParent;
}
export interface VoidExpression extends ts.Node {
	readonly expression: UnaryExpression;
	readonly kind: ts.SyntaxKind.VoidExpression;
	readonly parent:
		| AwaitExpression
		| DeleteExpression
		| ExpressionParent
		| PrefixUnaryExpression
		| TypeAssertion
		| TypeOfExpression
		| VoidExpression;
}
export interface VoidKeyword extends ts.Node {
	readonly kind: ts.SyntaxKind.VoidKeyword;
	readonly parent: TypeNodeParent;
}
export interface WhileStatement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.WhileStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export interface WithStatement extends ts.Node {
	readonly expression: Expression;
	readonly kind: ts.SyntaxKind.WithStatement;
	readonly parent: StatementParent;
	readonly statement: Statement;
}
export interface YieldExpression extends ts.Node {
	readonly asteriskToken?: AsteriskToken;
	readonly expression?: Expression;
	readonly kind: ts.SyntaxKind.YieldExpression;
	readonly parent: ExpressionParent;
}

interface Token<Kind extends ts.SyntaxKind, Parent extends ts.Node>
	extends ts.Node {
	readonly kind: Kind;
	readonly parent: Parent;
}

/*
 * This node doesn't exist, it just here so that SourceFile.parent is
 * defined for compatibility with base types and is not ts.Node to keep
 * narrowing working on node.parent.kind
 */
export type AnyNode =
	| AnyKeyword
	| ArrayBindingPattern
	| ArrayLiteralExpression
	| ArrayTypeNode
	| ArrowFunction
	| AsExpression
	| AwaitExpression
	| BigIntKeyword
	| BigIntLiteral
	| BinaryExpression
	| BindingElement
	| Block
	| BooleanKeyword
	| BreakStatement
	| CallExpression
	| CallSignatureDeclaration
	| CaseBlock
	| CaseClause
	| CatchClause
	| ClassDeclaration
	| ClassExpression
	| ClassStaticBlockDeclaration
	| CommaListExpression
	| ComputedPropertyName
	| ConditionalExpression
	| ConditionalTypeNode
	| ConstructorDeclaration
	| ConstructorTypeNode
	| ConstructSignatureDeclaration
	| ContinueStatement
	| DebuggerStatement
	| Decorator
	| DefaultClause
	| DeleteExpression
	| DoStatement
	| ElementAccessExpression
	| EmptyStatement
	| EnumDeclaration
	| EnumMember
	| ExportAssignment
	| ExportDeclaration
	| ExportSpecifier
	| ExpressionStatement
	| ExpressionWithTypeArguments
	| ExternalModuleReference
	| FalseLiteral
	| ForInStatement
	| ForOfStatement
	| ForStatement
	| FunctionDeclaration
	| FunctionExpression
	| FunctionTypeNode
	| GetAccessorDeclaration
	| HeritageClause
	| Identifier
	| IfStatement
	| ImportAttribute
	| ImportAttributes
	| ImportClause
	| ImportDeclaration
	| ImportEqualsDeclaration
	| ImportExpression
	| ImportSpecifier
	| ImportTypeNode
	| IndexedAccessTypeNode
	| IndexSignatureDeclaration
	| InferTypeNode
	| InterfaceDeclaration
	| IntersectionTypeNode
	| IntrinsicKeyword
	| JSDocAllType
	| JSDocFunctionType
	| JSDocLink
	| JSDocLinkCode
	| JSDocLinkPlain
	| JSDocMemberName
	| JSDocNamepathType
	| JSDocNamespaceDeclaration
	| JSDocNonNullableType
	| JSDocNullableType
	| JSDocOptionalType
	| JSDocParameterTag
	| JSDocPropertyTag
	| JSDocReturnTag
	| JSDocSignature
	| JSDocTemplateTag
	| JSDocText
	| JSDocTypeExpression
	| JSDocTypeLiteral
	| JSDocUnknownType
	| JSDocVariadicType
	| JsxAttribute
	| JsxAttributes
	| JsxClosingElement
	| JsxClosingFragment
	| JsxElement
	| JsxExpression
	| JsxFragment
	| JsxNamespacedName
	| JsxOpeningElement
	| JsxOpeningFragment
	| JsxSelfClosingElement
	| JsxSpreadAttribute
	| JsxTagNamePropertyAccess
	| JsxText
	| LabeledStatement
	| LiteralTypeNode
	| MappedTypeNode
	| MetaProperty
	| MethodDeclaration
	| MethodSignature
	| MissingDeclaration
	| ModuleBlock
	| ModuleDeclaration
	| NamedExports
	| NamedImports
	| NamedTupleMember
	| NamespaceDeclaration
	| NamespaceExport
	| NamespaceExportDeclaration
	| NamespaceImport
	| NeverKeyword
	| NewExpression
	| NonNullExpression
	| NoSubstitutionTemplateLiteral
	| NotEmittedStatement
	| NotEmittedTypeElement
	| NullLiteral
	| NumberKeyword
	| NumericLiteral
	| ObjectBindingPattern
	| ObjectKeyword
	| ObjectLiteralExpression
	| OmittedExpression
	| OptionalTypeNode
	| ParameterDeclaration
	| ParenthesizedExpression
	| ParenthesizedTypeNode
	| PartiallyEmittedExpression
	| PostfixUnaryExpression
	| PrefixUnaryExpression
	| PrivateIdentifier
	| PropertyAccessExpression
	| PropertyAssignment
	| PropertyDeclaration
	| PropertySignature
	| QualifiedName
	| RegularExpressionLiteral
	| RestTypeNode
	| ReturnStatement
	| SatisfiesExpression
	| SemicolonClassElement
	| SetAccessorDeclaration
	| ShorthandPropertyAssignment
	| SourceFile
	| SpreadAssignment
	| SpreadElement
	| StringKeyword
	| StringLiteral
	| SuperExpression
	| SwitchStatement
	| SymbolKeyword
	| SyntheticExpression
	| TaggedTemplateExpression
	| TemplateExpression
	| TemplateHead
	| TemplateLiteralTypeNode
	| TemplateLiteralTypeSpan
	| TemplateMiddle
	| TemplateSpan
	| TemplateTail
	| ThisExpression
	| ThisTypeNode
	| ThrowStatement
	| TrueLiteral
	| TryStatement
	| TupleTypeNode
	| TypeAliasDeclaration
	| TypeAssertion
	| TypeLiteralNode
	| TypeOfExpression
	| TypeOperatorNode
	| TypeParameterDeclaration
	| TypePredicateNode
	| TypeQueryNode
	| TypeReferenceNode
	| UndefinedKeyword
	| UnionTypeNode
	| UnknownKeyword
	| VariableDeclaration
	| VariableDeclarationList
	| VariableStatement
	| VoidExpression
	| VoidKeyword
	| WhileStatement
	| WithStatement
	| YieldExpression;

export interface NullNode extends ts.Node {
	readonly kind: ts.SyntaxKind.NullKeyword;
	readonly parent: NullNode;
}

/* Enums here just for factorization */
export type ExpressionParent =
	| ArrayLiteralExpression
	| ArrowFunction
	| AsExpression
	| BinaryExpression
	| BindingElement
	| CallExpression
	| CaseClause
	| CommaListExpression
	| ComputedPropertyName
	| ConditionalExpression
	| ElementAccessExpression
	| EnumMember
	| ExportAssignment
	| ExportDeclaration
	| ExpressionStatement
	| ExternalModuleReference
	| IfStatement
	| ImportAttribute
	| ImportDeclaration
	| IterationStatement
	| JsxExpression
	| JsxSpreadAttribute
	| NewExpression
	| NonNullExpression
	| ParameterDeclaration
	| ParenthesizedExpression
	| PartiallyEmittedExpression
	| PropertyAssignment
	| PropertyDeclaration
	| ReturnStatement
	| SatisfiesExpression
	| ShorthandPropertyAssignment
	| SpreadAssignment
	| SpreadElement
	| SwitchStatement
	| TemplateSpan
	| ThrowStatement
	| TypeParameterDeclaration
	| VariableDeclaration
	| WithStatement
	| YieldExpression;
export type LeftHandSideExpressionParent =
	| AwaitExpression
	| Decorator
	| DeleteExpression
	| ExpressionParent
	| ExpressionWithTypeArguments
	| PostfixUnaryExpression
	| PrefixUnaryExpression
	| PropertyAccessExpression
	| TaggedTemplateExpression
	| TypeAssertion
	| TypeOfExpression
	| VoidExpression;
export type ModifierParent =
	| AccessorDeclaration
	| ArrowFunction
	| ClassDeclaration
	| ClassExpression
	| ConstructorDeclaration
	| ConstructorTypeNode
	| EnumDeclaration
	| ExportAssignment
	| ExportDeclaration
	| FunctionDeclaration
	| FunctionExpression
	| ImportDeclaration
	| ImportEqualsDeclaration
	| IndexSignatureDeclaration
	| InterfaceDeclaration
	| JSDocNamespaceDeclaration
	| MethodDeclaration
	| MethodSignature
	| ModuleDeclaration
	| NamespaceDeclaration
	| ParameterDeclaration
	| PropertyDeclaration
	| PropertySignature
	| TypeAliasDeclaration
	| TypeParameterDeclaration
	| VariableStatement;
export type StatementParent =
	| Block
	| CaseOrDefaultClause
	| IfStatement
	| IterationStatement
	| LabeledStatement
	| ModuleBlock
	| SourceFile
	| WithStatement;
export type TypeNodeParent =
	| AccessorDeclaration
	| ArrayTypeNode
	| ArrowFunction
	| AsExpression
	| CallExpression
	| CallSignatureDeclaration
	| ConditionalTypeNode
	| ConstructorDeclaration
	| ConstructSignatureDeclaration
	| FunctionDeclaration
	| FunctionExpression
	| FunctionOrConstructorTypeNodeBase
	| IndexedAccessTypeNode
	| IndexSignatureDeclaration
	| IntersectionTypeNode
	| JSDocFunctionType
	| JSDocNamepathType
	| JSDocNonNullableType
	| JSDocNullableType
	| JSDocOptionalType
	| JSDocTypeExpression
	| JSDocVariadicType
	| JsxOpeningElement
	| JsxSelfClosingElement
	| MappedTypeNode
	| MethodDeclaration
	| MethodSignature
	| NamedTupleMember
	| NewExpression
	| NodeWithTypeArguments
	| OptionalTypeNode
	| ParameterDeclaration
	| ParenthesizedTypeNode
	| PropertyDeclaration
	| PropertySignature
	| RestTypeNode
	| SatisfiesExpression
	| TaggedTemplateExpression
	| TemplateLiteralTypeSpan
	| TupleTypeNode
	| TypeAliasDeclaration
	| TypeAssertion
	| TypeOperatorNode
	| TypeParameterDeclaration
	| TypePredicateNode
	| UnionTypeNode
	| VariableDeclaration;

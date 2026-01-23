import { createPlugin } from "@flint.fyi/core";

import accessorPairGroups from "./rules/accessorPairGroups.ts";
import accessorPairTypes from "./rules/accessorPairTypes.ts";
import accessorThisRecursion from "./rules/accessorThisRecursion.ts";
import anyArguments from "./rules/anyArguments.ts";
import anyAssignments from "./rules/anyAssignments.ts";
import anyCalls from "./rules/anyCalls.ts";
import anyMemberAccess from "./rules/anyMemberAccess.ts";
import anyReturns from "./rules/anyReturns.ts";
import argumentsRule from "./rules/arguments.ts";
import arrayCallbackReturns from "./rules/arrayCallbackReturns.ts";
import arrayConstructors from "./rules/arrayConstructors.ts";
import arrayDeleteUnnecessaryCounts from "./rules/arrayDeleteUnnecessaryCounts.ts";
import arrayElementDeletions from "./rules/arrayElementDeletions.ts";
import arrayEmptyCallbackSlots from "./rules/arrayEmptyCallbackSlots.ts";
import arrayExistenceChecksConsistency from "./rules/arrayExistenceChecksConsistency.ts";
import arrayFilteredFinds from "./rules/arrayFilteredFinds.ts";
import arrayFinds from "./rules/arrayFinds.ts";
import arrayFlatMapMethods from "./rules/arrayFlatMapMethods.ts";
import arrayFlatMethods from "./rules/arrayFlatMethods.ts";
import arrayFlatUnnecessaryDepths from "./rules/arrayFlatUnnecessaryDepths.ts";
import arrayIncludes from "./rules/arrayIncludes.ts";
import arrayIncludesMethods from "./rules/arrayIncludesMethods.ts";
import arrayIndexOfMethods from "./rules/arrayIndexOfMethods.ts";
import arrayLoops from "./rules/arrayLoops.ts";
import arrayMapIdentities from "./rules/arrayMapIdentities.ts";
import arrayMutableReverses from "./rules/arrayMutableReverses.ts";
import arrayMutableSorts from "./rules/arrayMutableSorts.ts";
import arraySliceUnnecessaryEnd from "./rules/arraySliceUnnecessaryEnd.ts";
import arraySomeMethods from "./rules/arraySomeMethods.ts";
import arrayTernarySpreadingConsistency from "./rules/arrayTernarySpreadingConsistency.ts";
import arrayTypes from "./rules/arrayTypes.ts";
import arrayUnnecessaryLengthChecks from "./rules/arrayUnnecessaryLengthChecks.ts";
import asConstAssertions from "./rules/asConstAssertions.ts";
import assignmentOperatorShorthands from "./rules/assignmentOperatorShorthands.ts";
import asyncPromiseExecutors from "./rules/asyncPromiseExecutors.ts";
import asyncUnnecessaryPromiseWrappers from "./rules/asyncUnnecessaryPromiseWrappers.ts";
import atAccesses from "./rules/atAccesses.ts";
import builtinCoercions from "./rules/builtinCoercions.ts";
import builtinConstructorNews from "./rules/builtinConstructorNews.ts";
import caseDeclarations from "./rules/caseDeclarations.ts";
import caseDuplicates from "./rules/caseDuplicates.ts";
import caseFallthroughs from "./rules/caseFallthroughs.ts";
import catchCallbackTypes from "./rules/catchCallbackTypes.ts";
import caughtVariableNames from "./rules/caughtVariableNames.ts";
import chainedAssignments from "./rules/chainedAssignments.ts";
import charAtComparisons from "./rules/charAtComparisons.ts";
import classAssignments from "./rules/classAssignments.ts";
import classFieldDeclarations from "./rules/classFieldDeclarations.ts";
import classLiteralProperties from "./rules/classLiteralProperties.ts";
import classMemberDuplicates from "./rules/classMemberDuplicates.ts";
import classMethodsThis from "./rules/classMethodsThis.ts";
import combinedPushes from "./rules/combinedPushes.ts";
import consecutiveNonNullAssertions from "./rules/consecutiveNonNullAssertions.ts";
import consoleCalls from "./rules/consoleCalls.ts";
import constantAssignments from "./rules/constantAssignments.ts";
import constructorGenericCalls from "./rules/constructorGenericCalls.ts";
import constructorReturns from "./rules/constructorReturns.ts";
import constructorSupers from "./rules/constructorSupers.ts";
import dateConstructorClones from "./rules/dateConstructorClones.ts";
import dateNowTimestamps from "./rules/dateNowTimestamps.ts";
import debuggerStatements from "./rules/debuggerStatements.ts";
import defaultCaseLast from "./rules/defaultCaseLast.ts";
import defaultParameterLast from "./rules/defaultParameterLast.ts";
import deprecated from "./rules/deprecated.ts";
import destructuringConsistency from "./rules/destructuringConsistency.ts";
import duplicateArguments from "./rules/duplicateArguments.ts";
import dynamicDeletes from "./rules/dynamicDeletes.ts";
import elseIfDuplicates from "./rules/elseIfDuplicates.ts";
import elseReturns from "./rules/elseReturns.ts";
import emptyBlocks from "./rules/emptyBlocks.ts";
import emptyDestructures from "./rules/emptyDestructures.ts";
import emptyEnums from "./rules/emptyEnums.ts";
import emptyExports from "./rules/emptyExports.ts";
import emptyFiles from "./rules/emptyFiles.ts";
import emptyFunctions from "./rules/emptyFunctions.ts";
import emptyModuleAttributes from "./rules/emptyModuleAttributes.ts";
import emptyObjectTypes from "./rules/emptyObjectTypes.ts";
import emptyStaticBlocks from "./rules/emptyStaticBlocks.ts";
import emptyTypeParameterLists from "./rules/emptyTypeParameterLists.ts";
import enumInitializers from "./rules/enumInitializers.ts";
import enumMemberLiterals from "./rules/enumMemberLiterals.ts";
import enumValueConsistency from "./rules/enumValueConsistency.ts";
import enumValueDuplicates from "./rules/enumValueDuplicates.ts";
import equalityOperatorNegations from "./rules/equalityOperatorNegations.ts";
import errorMessages from "./rules/errorMessages.ts";
import errorSubclassProperties from "./rules/errorSubclassProperties.ts";
import errorUnnecessaryCaptureStackTraces from "./rules/errorUnnecessaryCaptureStackTraces.ts";
import escapeSequenceCasing from "./rules/escapeSequenceCasing.ts";
import evals from "./rules/evals.ts";
import evolvingVariableTypes from "./rules/evolvingVariableTypes.ts";
import exceptionAssignments from "./rules/exceptionAssignments.ts";
import explicitAnys from "./rules/explicitAnys.ts";
import exponentiationOperators from "./rules/exponentiationOperators.ts";
import exportFromImports from "./rules/exportFromImports.ts";
import exportMutables from "./rules/exportMutables.ts";
import exportUniqueNames from "./rules/exportUniqueNames.ts";
import extraneousClasses from "./rules/extraneousClasses.ts";
import fetchMethodBodies from "./rules/fetchMethodBodies.ts";
import finallyStatementSafety from "./rules/finallyStatementSafety.ts";
import forDirections from "./rules/forDirections.ts";
import forInArrays from "./rules/forInArrays.ts";
import forInGuards from "./rules/forInGuards.ts";
import functionApplySpreads from "./rules/functionApplySpreads.ts";
import functionAssignments from "./rules/functionAssignments.ts";
import functionCurryingRedundancy from "./rules/functionCurryingRedundancy.ts";
import functionDeclarationStyles from "./rules/functionDeclarationStyles.ts";
import functionNameMatches from "./rules/functionNameMatches.ts";
import functionNewCalls from "./rules/functionNewCalls.ts";
import generatorFunctionYields from "./rules/generatorFunctionYields.ts";
import getterReturns from "./rules/getterReturns.ts";
import globalAssignments from "./rules/globalAssignments.ts";
import globalObjectCalls from "./rules/globalObjectCalls.ts";
import globalThisAliases from "./rules/globalThisAliases.ts";
import impliedEvals from "./rules/impliedEvals.ts";
import importEmptyBlocks from "./rules/importEmptyBlocks.ts";
import importTypeSideEffects from "./rules/importTypeSideEffects.ts";
import indexedObjectTypes from "./rules/indexedObjectTypes.ts";
import instanceOfArrays from "./rules/instanceOfArrays.ts";
import irregularWhitespaces from "./rules/irregularWhitespaces.ts";
import isNaNComparisons from "./rules/isNaNComparisons.ts";
import literalConstructorWrappers from "./rules/literalConstructorWrappers.ts";
import mathMethods from "./rules/mathMethods.ts";
import meaninglessVoidOperators from "./rules/meaninglessVoidOperators.ts";
import misleadingVoidExpressions from "./rules/misleadingVoidExpressions.ts";
import moduleSpecifierLists from "./rules/moduleSpecifierLists.ts";
import multilineAmbiguities from "./rules/multilineAmbiguities.ts";
import namedDefaultExports from "./rules/namedDefaultExports.ts";
import namespaceDeclarations from "./rules/namespaceDeclarations.ts";
import namespaceImplicitAmbientImports from "./rules/namespaceImplicitAmbientImports.ts";
import namespaceKeywords from "./rules/namespaceKeywords.ts";
import nativeObjectExtensions from "./rules/nativeObjectExtensions.ts";
import negativeIndexLengthMethods from "./rules/negativeIndexLengthMethods.ts";
import negativeZeroComparisons from "./rules/negativeZeroComparisons.ts";
import nestedStandaloneIfs from "./rules/nestedStandaloneIfs.ts";
import newDefinitions from "./rules/newDefinitions.ts";
import newExpressions from "./rules/newExpressions.ts";
import newNativeNonConstructors from "./rules/newNativeNonConstructors.ts";
import nonNullableTypeAssertions from "./rules/nonNullableTypeAssertions.ts";
import nonNullAssertedNullishCoalesces from "./rules/nonNullAssertedNullishCoalesces.ts";
import nonNullAssertedOptionalChains from "./rules/nonNullAssertedOptionalChains.ts";
import nonNullAssertionPlacement from "./rules/nonNullAssertionPlacement.ts";
import nonOctalDecimalEscapes from "./rules/nonOctalDecimalEscapes.ts";
import nullishCoalescingOperators from "./rules/nullishCoalescingOperators.ts";
import numberMethodRanges from "./rules/numberMethodRanges.ts";
import numberStaticMethods from "./rules/numberStaticMethods.ts";
import numericErasingOperations from "./rules/numericErasingOperations.ts";
import numericLiteralParsing from "./rules/numericLiteralParsing.ts";
import numericPrecision from "./rules/numericPrecision.ts";
import numericSeparatorGroups from "./rules/numericSeparatorGroups.ts";
import objectAssignSpreads from "./rules/objectAssignSpreads.ts";
import objectCalls from "./rules/objectCalls.ts";
import objectEntriesMethods from "./rules/objectEntriesMethods.ts";
import objectHasOwns from "./rules/objectHasOwns.ts";
import objectKeyDuplicates from "./rules/objectKeyDuplicates.ts";
import objectProto from "./rules/objectProto.ts";
import objectPrototypeBuiltIns from "./rules/objectPrototypeBuiltIns.ts";
import objectShorthand from "./rules/objectShorthand.ts";
import objectSpreadUnnecessaryFallbacks from "./rules/objectSpreadUnnecessaryFallbacks.ts";
import objectTypeDefinitions from "./rules/objectTypeDefinitions.ts";
import octalEscapes from "./rules/octalEscapes.ts";
import octalNumbers from "./rules/octalNumbers.ts";
import operatorAssignmentShorthand from "./rules/operatorAssignmentShorthand.ts";
import overloadSignaturesAdjacent from "./rules/overloadSignaturesAdjacent.ts";
import parameterReassignments from "./rules/parameterReassignments.ts";
import parseIntRadixes from "./rules/parseIntRadixes.ts";
import propertyAccessNotation from "./rules/propertyAccessNotation.ts";
import recursionOnlyArguments from "./rules/recursionOnlyArguments.ts";
import reduceTypeParameters from "./rules/reduceTypeParameters.ts";
import redundantTypeConstituents from "./rules/redundantTypeConstituents.ts";
import regexAllGlobalFlags from "./rules/regexAllGlobalFlags.ts";
import regexAmbiguousInvalidity from "./rules/regexAmbiguousInvalidity.ts";
import regexCharacterClasses from "./rules/regexCharacterClasses.ts";
import regexCharacterClassRanges from "./rules/regexCharacterClassRanges.ts";
import regexCharacterClassSetOperations from "./rules/regexCharacterClassSetOperations.ts";
import regexConciseCharacterClassNegations from "./rules/regexConciseCharacterClassNegations.ts";
import regexContradictoryAssertions from "./rules/regexContradictoryAssertions.ts";
import regexControlCharacterEscapes from "./rules/regexControlCharacterEscapes.ts";
import regexControlCharacters from "./rules/regexControlCharacters.ts";
import regexDigitMatchers from "./rules/regexDigitMatchers.ts";
import regexDollarEscapes from "./rules/regexDollarEscapes.ts";
import regexDuplicateCharacterClassCharacters from "./rules/regexDuplicateCharacterClassCharacters.ts";
import regexEmptyAlternatives from "./rules/regexEmptyAlternatives.ts";
import regexEmptyCapturingGroups from "./rules/regexEmptyCapturingGroups.ts";
import regexEmptyCharacterClasses from "./rules/regexEmptyCharacterClasses.ts";
import regexEmptyGroups from "./rules/regexEmptyGroups.ts";
import regexEmptyLazyQuantifiers from "./rules/regexEmptyLazyQuantifiers.ts";
import regexEmptyLookaroundsAssertions from "./rules/regexEmptyLookaroundsAssertions.ts";
import regexEmptyStringLiterals from "./rules/regexEmptyStringLiterals.ts";
import regexEscapeBackspaces from "./rules/regexEscapeBackspaces.ts";
import regexExecutors from "./rules/regexExecutors.ts";
import regexGraphemeStringLiterals from "./rules/regexGraphemeStringLiterals.ts";
import regexHexadecimalEscapes from "./rules/regexHexadecimalEscapes.ts";
import regexIgnoreCaseFlags from "./rules/regexIgnoreCaseFlags.ts";
import regexInvisibleCharacters from "./rules/regexInvisibleCharacters.ts";
import returnAssignments from "./rules/returnAssignments.ts";
import selfAssignments from "./rules/selfAssignments.ts";
import selfComparisons from "./rules/selfComparisons.ts";
import sequences from "./rules/sequences.ts";
import shadowedRestrictedNames from "./rules/shadowedRestrictedNames.ts";
import sparseArrays from "./rules/sparseArrays.ts";
import symbolDescriptions from "./rules/symbolDescriptions.ts";
import typeofComparisons from "./rules/typeofComparisons.ts";
import unassignedVariables from "./rules/unassignedVariables.ts";
import undefinedVariables from "./rules/undefinedVariables.ts";
import unicodeBOMs from "./rules/unicodeBOMs.ts";
import unnecessaryBlocks from "./rules/unnecessaryBlocks.ts";
import unnecessaryCatches from "./rules/unnecessaryCatches.ts";
import unnecessaryConcatenation from "./rules/unnecessaryConcatenation.ts";
import unsafeNegations from "./rules/unsafeNegations.ts";
import variableDeletions from "./rules/variableDeletions.ts";
import voidOperator from "./rules/voidOperator.ts";
import withStatements from "./rules/withStatements.ts";
import wrapperObjects from "./rules/wrapperObjects.ts";

export const ts = createPlugin({
	files: {
		all: ["**/*.{cjs,js,jsx,mjs,ts,tsx}"],
	},
	name: "TypeScript",
	rules: [
		accessorPairGroups,
		accessorPairTypes,
		accessorThisRecursion,
		anyArguments,
		anyAssignments,
		anyCalls,
		anyMemberAccess,
		anyReturns,
		argumentsRule,
		arrayCallbackReturns,
		arrayConstructors,
		arrayDeleteUnnecessaryCounts,
		arrayElementDeletions,
		arrayEmptyCallbackSlots,
		arrayExistenceChecksConsistency,
		arrayFilteredFinds,
		arrayFinds,
		arrayFlatMapMethods,
		arrayFlatMethods,
		arrayFlatUnnecessaryDepths,
		arrayIncludes,
		arrayIncludesMethods,
		arrayIndexOfMethods,
		arrayLoops,
		arrayMapIdentities,
		arrayMutableReverses,
		arrayMutableSorts,
		arraySliceUnnecessaryEnd,
		arraySomeMethods,
		arrayTernarySpreadingConsistency,
		arrayTypes,
		arrayUnnecessaryLengthChecks,
		asConstAssertions,
		assignmentOperatorShorthands,
		asyncPromiseExecutors,
		asyncUnnecessaryPromiseWrappers,
		atAccesses,
		builtinCoercions,
		builtinConstructorNews,
		caseDeclarations,
		caseDuplicates,
		caseFallthroughs,
		catchCallbackTypes,
		caughtVariableNames,
		chainedAssignments,
		charAtComparisons,
		classAssignments,
		classFieldDeclarations,
		classLiteralProperties,
		classMemberDuplicates,
		classMethodsThis,
		combinedPushes,
		consecutiveNonNullAssertions,
		consoleCalls,
		constantAssignments,
		constructorGenericCalls,
		constructorReturns,
		constructorSupers,
		dateConstructorClones,
		dateNowTimestamps,
		debuggerStatements,
		defaultCaseLast,
		defaultParameterLast,
		deprecated,
		destructuringConsistency,
		duplicateArguments,
		dynamicDeletes,
		elseIfDuplicates,
		elseReturns,
		emptyBlocks,
		emptyDestructures,
		emptyEnums,
		emptyExports,
		emptyFiles,
		emptyFunctions,
		emptyModuleAttributes,
		emptyObjectTypes,
		emptyStaticBlocks,
		emptyTypeParameterLists,
		enumInitializers,
		enumMemberLiterals,
		enumValueConsistency,
		enumValueDuplicates,
		equalityOperatorNegations,
		errorMessages,
		errorSubclassProperties,
		errorUnnecessaryCaptureStackTraces,
		escapeSequenceCasing,
		evals,
		evolvingVariableTypes,
		exceptionAssignments,
		explicitAnys,
		exponentiationOperators,
		exportFromImports,
		exportMutables,
		exportUniqueNames,
		extraneousClasses,
		fetchMethodBodies,
		finallyStatementSafety,
		forDirections,
		forInArrays,
		forInGuards,
		functionApplySpreads,
		functionAssignments,
		functionCurryingRedundancy,
		functionDeclarationStyles,
		functionNameMatches,
		functionNewCalls,
		generatorFunctionYields,
		getterReturns,
		globalAssignments,
		globalObjectCalls,
		globalThisAliases,
		impliedEvals,
		importEmptyBlocks,
		importTypeSideEffects,
		indexedObjectTypes,
		instanceOfArrays,
		irregularWhitespaces,
		isNaNComparisons,
		literalConstructorWrappers,
		mathMethods,
		meaninglessVoidOperators,
		misleadingVoidExpressions,
		moduleSpecifierLists,
		multilineAmbiguities,
		namedDefaultExports,
		namespaceDeclarations,
		namespaceImplicitAmbientImports,
		namespaceKeywords,
		nativeObjectExtensions,
		negativeIndexLengthMethods,
		negativeZeroComparisons,
		nestedStandaloneIfs,
		newDefinitions,
		newExpressions,
		newNativeNonConstructors,
		nonNullableTypeAssertions,
		nonNullAssertedNullishCoalesces,
		nonNullAssertedOptionalChains,
		nonNullAssertionPlacement,
		nonOctalDecimalEscapes,
		nullishCoalescingOperators,
		numberMethodRanges,
		numberStaticMethods,
		numericErasingOperations,
		numericLiteralParsing,
		numericPrecision,
		numericSeparatorGroups,
		objectAssignSpreads,
		objectCalls,
		objectEntriesMethods,
		objectHasOwns,
		objectKeyDuplicates,
		objectProto,
		objectPrototypeBuiltIns,
		objectShorthand,
		objectSpreadUnnecessaryFallbacks,
		objectTypeDefinitions,
		octalEscapes,
		octalNumbers,
		operatorAssignmentShorthand,
		overloadSignaturesAdjacent,
		parameterReassignments,
		parseIntRadixes,
		propertyAccessNotation,
		recursionOnlyArguments,
		reduceTypeParameters,
		redundantTypeConstituents,
		regexAllGlobalFlags,
		regexAmbiguousInvalidity,
		regexCharacterClasses,
		regexCharacterClassRanges,
		regexCharacterClassSetOperations,
		regexConciseCharacterClassNegations,
		regexContradictoryAssertions,
		regexControlCharacterEscapes,
		regexControlCharacters,
		regexDigitMatchers,
		regexDollarEscapes,
		regexDuplicateCharacterClassCharacters,
		regexEmptyAlternatives,
		regexEmptyCapturingGroups,
		regexEmptyCharacterClasses,
		regexEmptyGroups,
		regexInvisibleCharacters,
		regexEmptyLazyQuantifiers,
		regexEmptyLookaroundsAssertions,
		regexEmptyStringLiterals,
		regexEscapeBackspaces,
		regexExecutors,
		regexGraphemeStringLiterals,
		regexHexadecimalEscapes,
		regexIgnoreCaseFlags,
		returnAssignments,
		selfAssignments,
		selfComparisons,
		sequences,
		shadowedRestrictedNames,
		sparseArrays,
		symbolDescriptions,
		typeofComparisons,
		unassignedVariables,
		undefinedVariables,
		unicodeBOMs,
		unnecessaryBlocks,
		unnecessaryCatches,
		unnecessaryConcatenation,
		unsafeNegations,
		variableDeletions,
		voidOperator,
		withStatements,
		wrapperObjects,
	],
});

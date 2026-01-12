import { createPlugin } from "@flint.fyi/core";

import anyArguments from "./rules/anyArguments.ts";
import anyAssignments from "./rules/anyAssignments.ts";
import anyCalls from "./rules/anyCalls.ts";
import anyMemberAccess from "./rules/anyMemberAccess.ts";
import anyReturns from "./rules/anyReturns.ts";
import argumentsRule from "./rules/arguments.ts";
import arrayCallbackReturns from "./rules/arrayCallbackReturns.ts";
import arrayConstructors from "./rules/arrayConstructors.ts";
import arrayDeleteUnnecessaryCounts from "./rules/arrayDeleteUnnecessaryCounts.ts";
import arrayExistenceChecksConsistency from "./rules/arrayExistenceChecksConsistency.ts";
import arrayFinds from "./rules/arrayFinds.ts";
import arrayMapIdentities from "./rules/arrayMapIdentities.ts";
import arrayMutableReverses from "./rules/arrayMutableReverses.ts";
import arrayMutableSorts from "./rules/arrayMutableSorts.ts";
import arraySliceUnnecessaryEnd from "./rules/arraySliceUnnecessaryEnd.ts";
import arraySomeMethods from "./rules/arraySomeMethods.ts";
import arrayTernarySpreadingConsistency from "./rules/arrayTernarySpreadingConsistency.ts";
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
import chainedAssignments from "./rules/chainedAssignments.ts";
import classAssignments from "./rules/classAssignments.ts";
import classFieldDeclarations from "./rules/classFieldDeclarations.ts";
import classLiteralProperties from "./rules/classLiteralProperties.ts";
import classMemberDuplicates from "./rules/classMemberDuplicates.ts";
import combinedPushes from "./rules/combinedPushes.ts";
import consecutiveNonNullAssertions from "./rules/consecutiveNonNullAssertions.ts";
import constantAssignments from "./rules/constantAssignments.ts";
import constructorReturns from "./rules/constructorReturns.ts";
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
import emptyBlocks from "./rules/emptyBlocks.ts";
import emptyDestructures from "./rules/emptyDestructures.ts";
import emptyStaticBlocks from "./rules/emptyStaticBlocks.ts";
import exceptionAssignments from "./rules/exceptionAssignments.ts";
import fetchMethodBodies from "./rules/fetchMethodBodies.ts";
import finallyStatementSafety from "./rules/finallyStatementSafety.ts";
import forDirections from "./rules/forDirections.ts";
import forInArrays from "./rules/forInArrays.ts";
import functionApplySpreads from "./rules/functionApplySpreads.ts";
import functionAssignments from "./rules/functionAssignments.ts";
import functionCurryingRedundancy from "./rules/functionCurryingRedundancy.ts";
import functionNewCalls from "./rules/functionNewCalls.ts";
import generatorFunctionYields from "./rules/generatorFunctionYields.ts";
import globalAssignments from "./rules/globalAssignments.ts";
import globalObjectCalls from "./rules/globalObjectCalls.ts";
import multilineAmbiguities from "./rules/multilineAmbiguities.ts";
import namespaceDeclarations from "./rules/namespaceDeclarations.ts";
import negativeZeroComparisons from "./rules/negativeZeroComparisons.ts";
import newExpressions from "./rules/newExpressions.ts";
import newNativeNonConstructors from "./rules/newNativeNonConstructors.ts";
import nonOctalDecimalEscapes from "./rules/nonOctalDecimalEscapes.ts";
import numericLiteralParsing from "./rules/numericLiteralParsing.ts";
import objectCalls from "./rules/objectCalls.ts";
import objectHasOwns from "./rules/objectHasOwns.ts";
import objectKeyDuplicates from "./rules/objectKeyDuplicates.ts";
import objectProto from "./rules/objectProto.ts";
import objectPrototypeBuiltIns from "./rules/objectPrototypeBuiltIns.ts";
import octalEscapes from "./rules/octalEscapes.ts";
import octalNumbers from "./rules/octalNumbers.ts";
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

export const ts = createPlugin({
	files: {
		all: ["**/*.{cjs,js,jsx,mjs,ts,tsx}"],
	},
	name: "TypeScript",
	rules: [
		anyArguments,
		anyAssignments,
		anyCalls,
		anyMemberAccess,
		anyReturns,
		argumentsRule,
		arrayCallbackReturns,
		arrayConstructors,
		arrayDeleteUnnecessaryCounts,
		arrayExistenceChecksConsistency,
		arrayFinds,
		arrayMapIdentities,
		arrayMutableReverses,
		arrayMutableSorts,
		arraySliceUnnecessaryEnd,
		arraySomeMethods,
		arrayTernarySpreadingConsistency,
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
		chainedAssignments,
		classAssignments,
		classFieldDeclarations,
		classLiteralProperties,
		classMemberDuplicates,
		combinedPushes,
		consecutiveNonNullAssertions,
		constantAssignments,
		constructorReturns,
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
		emptyBlocks,
		emptyDestructures,
		emptyStaticBlocks,
		exceptionAssignments,
		fetchMethodBodies,
		finallyStatementSafety,
		forDirections,
		forInArrays,
		functionAssignments,
		functionApplySpreads,
		functionCurryingRedundancy,
		functionNewCalls,
		generatorFunctionYields,
		globalAssignments,
		globalObjectCalls,
		multilineAmbiguities,
		namespaceDeclarations,
		negativeZeroComparisons,
		newExpressions,
		newNativeNonConstructors,
		nonOctalDecimalEscapes,
		numericLiteralParsing,
		objectCalls,
		objectHasOwns,
		objectKeyDuplicates,
		objectProto,
		objectPrototypeBuiltIns,
		octalEscapes,
		octalNumbers,
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
	],
});

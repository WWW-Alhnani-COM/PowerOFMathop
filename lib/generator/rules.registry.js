import NumbersRecognition from './rules/numbersRecognition'
import WritingNumbers from './rules/writingNumbers'
import Counting from './rules/counting'
import CompareNumbers from './rules/compareNumbers'
import BasicAddition from './rules/basicAddition'
import BasicSubtraction from './rules/basicSubtraction'

import FriendsOfFive from './rules/friendsOfFive'
import FriendsOfTen from './rules/friendsOfTen'
import FriendsOfTwenty from './rules/friendsOfTwenty'
import NumberDecomposition from './rules/numberDecomposition'
import CompletingNumber from './rules/completingNumber'

import AddNoCarry from './rules/addNoCarry'
import AddWithCarry from './rules/addWithCarry'
import VerticalAddition from './rules/verticalAddition'
import MultiAddition from './rules/multiAddition'
import AdditionStrategies from './rules/additionStrategies'

import SubNoBorrow from './rules/subNoBorrow'
import SubWithBorrow from './rules/subWithBorrow'
import VerticalSubtraction from './rules/verticalSubtraction'
import SequentialSubtraction from './rules/sequentialSubtraction'
import SubStrategies from './rules/subStrategies'

import MultiplicationConcept from './rules/multiplicationConcept'
import MultiplicationTables from './rules/multiplicationTables'
import MultiplyBy10_100 from './rules/multiplyBy10_100'
import VerticalMultiplication from './rules/verticalMultiplication'
import FastMultiplication from './rules/fastMultiplication'

import DivisionConcept from './rules/divisionConcept'
import DivisionNoRemainder from './rules/divisionNoRemainder'
import DivisionWithRemainder from './rules/divisionWithRemainder'
import LongDivision from './rules/longDivision'
import CheckDivision from './rules/checkDivision'

import MixedOperations from './rules/mixedOperations'
import MultiStep from './rules/multiStep'
import OrderOfOperations from './rules/orderOfOperations'
import WordProblems from './rules/wordProblems'

import Speed from './rules/speed'
import Accuracy from './rules/accuracy'
import Challenge from './rules/challenge'
import PvP from './rules/pvp'
import Improvement from './rules/improvement'

export const RULES = {
  1: NumbersRecognition,
  2: WritingNumbers,
  3: Counting,
  4: CompareNumbers,
  5: BasicAddition,
  6: BasicSubtraction,

  7: FriendsOfFive,
  8: FriendsOfTen,
  9: FriendsOfTwenty,
  10: NumberDecomposition,
  11: CompletingNumber,

  12: AddNoCarry,
  13: AddWithCarry,
  14: VerticalAddition,
  15: MultiAddition,
  16: AdditionStrategies,

  17: SubNoBorrow,
  18: SubWithBorrow,
  19: VerticalSubtraction,
  20: SequentialSubtraction,
  21: SubStrategies,

  22: MultiplicationConcept,
  23: MultiplicationTables,
  24: MultiplyBy10_100,
  25: VerticalMultiplication,
  26: FastMultiplication,

  27: DivisionConcept,
  28: DivisionNoRemainder,
  29: DivisionWithRemainder,
  30: LongDivision,
  31: CheckDivision,

  32: MixedOperations,
  33: MultiStep,
  34: MultiStep,
  35: OrderOfOperations,
  36: WordProblems,

  37: Speed,
  38: Accuracy,
  39: Challenge,
  40: PvP,
  41: Improvement
}

export function getRuleLogic(rule_id) {
  return RULES[Number(rule_id)]
}

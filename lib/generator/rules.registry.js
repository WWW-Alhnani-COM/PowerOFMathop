// lib/generator/rules.registry.js

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

export function getRuleLogic(rule_id) {
  switch (Number(rule_id)) {

    // Level 1
    case 1: return NumbersRecognition
    case 2: return WritingNumbers
    case 3: return Counting
    case 4: return CompareNumbers
    case 5: return BasicAddition
    case 6: return BasicSubtraction

    // Level 2
    case 7: return FriendsOfFive
    case 8: return FriendsOfTen
    case 9: return FriendsOfTwenty
    case 10: return NumberDecomposition
    case 11: return CompletingNumber

    // Level 3
    case 12: return AddNoCarry
    case 13: return AddWithCarry
    case 14: return VerticalAddition
    case 15: return MultiAddition
    case 16: return AdditionStrategies

    // Level 4
    case 17: return SubNoBorrow
    case 18: return SubWithBorrow
    case 19: return VerticalSubtraction
    case 20: return SequentialSubtraction
    case 21: return SubStrategies

    // Level 5
    case 22: return MultiplicationConcept
    case 23: return MultiplicationTables
    case 24: return MultiplyBy10_100
    case 25: return VerticalMultiplication
    case 26: return FastMultiplication

    // Level 6
    case 27: return DivisionConcept
    case 28: return DivisionNoRemainder
    case 29: return DivisionWithRemainder
    case 30: return LongDivision
    case 31: return CheckDivision

    // Level 7
    case 32: return MixedOperations
    case 33: return MultiStep
    case 34: return MultiStep
    case 35: return OrderOfOperations
    case 36: return WordProblems

    // Level 8
    case 37: return Speed
    case 38: return Accuracy
    case 39: return Challenge
    case 40: return PvP
    case 41: return Improvement

    default:
      throw new Error('Rule not implemented: ' + rule_id)
  }
}

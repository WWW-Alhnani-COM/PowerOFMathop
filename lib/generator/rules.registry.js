import AdditionUnits from './rules/additionUnits'
import SubtractionUnits from './rules/subtractionUnits'
import Multiplication from './rules/multiplication'
import Composite from './rules/composite'

export function getRuleLogic(rule_id) {
  switch (rule_id) {
    case 10:
      return AdditionUnits
    case 11:
      return SubtractionUnits
    case 21:
      return Multiplication
    case 30:
      return Composite
    default:
      throw new Error('Rule logic not found')
  }
}

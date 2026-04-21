import { rand } from '../mathHelpers'

const numberWordsAr = {
  0: 'صفر',
  1: 'واحد',
  2: 'اثنان',
  3: 'ثلاثة',
  4: 'أربعة',
  5: 'خمسة',
  6: 'ستة',
  7: 'سبعة',
  8: 'ثمانية',
  9: 'تسعة',
  10: 'عشرة'
}

const numberWordsEn = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten'
}

const WritingNumbers = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const num = rand(0, 10)

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `اكتب الرقم بالكلمات: ${num}`
            : `Write the number in words: ${num}`,

        correct_answer:
          language === 'ar'
            ? numberWordsAr[num]
            : numberWordsEn[num],

        operands: { num }
      })
    }

    return problems
  }
}

export default WritingNumbers

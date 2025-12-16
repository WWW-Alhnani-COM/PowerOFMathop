// ProblemGenerator.jsx (وظيفة مساعدة وليست مكون React)
const ProblemGenerator = {
  generate: (rule, difficulty) => {
    // منطق توليد المسائل العشوائية هنا
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    let operator = '+';

    if (rule === 'subtraction' && num1 < num2) [num1, num2] = [num2, num1]; // لضمان النتيجة الموجبة

    const answer = eval(`${num1} ${operator} ${num2}`);

    return { num1, num2, operator, answer };
  },
};
export default ProblemGenerator;
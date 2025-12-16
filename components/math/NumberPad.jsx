'use client'

import { useState } from 'react'
import { Delete, Check } from 'lucide-react'
import { playSound } from '@/lib/sounds'

const NumberPad = ({ onInput, onSubmit, disabled = false }) => {
  const [input, setInput] = useState('')

  const handleNumberClick = (num) => {
    if (input.length < 6) {
      const newInput = input + num
      setInput(newInput)
      onInput?.(newInput)
      playSound('click')
    }
  }

  const handleDelete = () => {
    if (input.length > 0) {
      const newInput = input.slice(0, -1)
      setInput(newInput)
      onInput?.(newInput)
      playSound('click')
    }
  }

  const handleSubmit = () => {
    if (input) {
      onSubmit?.(parseInt(input))
      setInput('')
      playSound('submit')
    }
  }

  const numbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [0]
  ]

  return (
    <div className="max-w-md mx-auto">
      {/* Display */}
      <div className="mb-6">
        <div className={`
          w-full h-20
          bg-gradient-to-r from-blue-50 to-purple-50
          rounded-2xl border-2 border-math-primary/30
          flex items-center justify-center
          text-4xl font-bold text-gray-800
          mb-2
        `}>
          {input || '0'}
        </div>
        <div className="text-center text-sm text-gray-600">
          أدخل الرقم ثم اضغط تأكيد
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-3 gap-4">
        {numbers.flat().map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className={`
              number-pad-btn
              h-16 rounded-2xl
              bg-gradient-to-br from-blue-100 to-purple-100
              text-2xl font-bold text-gray-800
              hover:from-blue-200 hover:to-purple-200
              active:scale-95
              transition-all duration-200
              shadow-lg hover:shadow-xl
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {num}
          </button>
        ))}

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={disabled || !input}
          className={`
            h-16 rounded-2xl
            bg-gradient-to-br from-red-100 to-pink-100
            text-gray-800
            hover:from-red-200 hover:to-pink-200
            active:scale-95
            transition-all duration-200
            shadow-lg hover:shadow-xl
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            flex items-center justify-center
          `}
        >
          <Delete className="w-6 h-6" />
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !input}
          className={`
            h-16 rounded-2xl col-span-2
            bg-gradient-to-br from-green-100 to-emerald-100
            text-gray-800
            hover:from-green-200 hover:to-emerald-200
            active:scale-95
            transition-all duration-200
            shadow-lg hover:shadow-xl
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            flex items-center justify-center gap-2
            text-lg font-bold
          `}
        >
          <Check className="w-6 h-6" />
          تأكيد الإجابة
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-math-success"></div>
            <span>انقر على الأرقام</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-math-primary"></div>
            <span>اضغط تأكيد عند الانتهاء</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-math-error"></div>
            <span>استخدم مسح لتصحيح الرقم</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NumberPad
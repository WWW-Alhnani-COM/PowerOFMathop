// lib/generator/mathHelpers.js

export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5)
}

export function pairSum(target) {
  const a = rand(0, target)
  return [a, target - a]
}

export function safeDiv(a, b) {
  return b === 0 ? a : Math.floor(a / b)
}

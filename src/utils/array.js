export const toggleItem = (arr, item) =>
  arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

// Simple English words for wallet backup
export const BACKUP_WORDS = [
  'apple', 'beach', 'card', 'dance', 'early', 'film',
  'green', 'happy', 'iron', 'jump', 'kind', 'light',
  'music', 'north', 'ocean', 'paper', 'queen', 'river',
  'sugar', 'table', 'until', 'voice', 'water', 'youth',
  // Add more simple words as needed...
]

export function getRandomWords(count: number): string[] {
  const words: string[] = []
  const usedIndexes = new Set()

  while (words.length < count) {
    const index = Math.floor(Math.random() * BACKUP_WORDS.length)
    if (!usedIndexes.has(index)) {
      usedIndexes.add(index)
      words.push(BACKUP_WORDS[index])
    }
  }

  return words
}

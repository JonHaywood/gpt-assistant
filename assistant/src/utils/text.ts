/**
 * Converts to lowercase, strips all punctuation and trims starting and trailing spaces.
 */
export function cleanText(text: string): string {
  if (text === '') return text;
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim();
}

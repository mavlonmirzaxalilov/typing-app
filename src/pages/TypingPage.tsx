// Xatolar soni
const errors = finalInput.split('').filter((char, i) => char !== text.content[i]).length;

// Gross WPM
const grossWpm = (charCount / 5) / timeInMinutes;

// Net WPM — 0 dan past bo'lmaydi
const netWpm = Math.max(0, Math.round(grossWpm - (errors / timeInMinutes)));

// Accuracy
const correctChars = charCount - errors;
const accuracy = Math.round((correctChars / text.content.length) * 100);

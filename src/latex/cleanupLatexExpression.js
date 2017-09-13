import { create } from 'urlify';
const urlify = create({});

export function cleanupLatexExpression(exp) {
  const escaped = exp
    .replace(/\\ /g, '')
    .toLowerCase();

  return escapeCharacters(escaped);
}

function escapeCharacters(str) {
  let char;
  let escaped = '';
  
  for(let i = 0; i < str.length; i++) {
    char = str[i];
    if(char !== '_' && urlify(char) !== '_') {
      char = urlify(char)[0];
    }

    escaped += char;
  }

  return escaped;
}

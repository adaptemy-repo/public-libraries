import { create } from 'urlify';
const urlify = create({});

export function cleanupLatexExpression(exp, caseSensitive) {
  let escaped = exp.replace(/\\ /g, '');

  if(!caseSensitive) {
    escaped = escaped.toLowerCase();
  }

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

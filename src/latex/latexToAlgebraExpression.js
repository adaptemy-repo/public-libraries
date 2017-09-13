import algebra from 'algebra.js';
const pi = Math.PI.toString();

export function latexToAlgebraExpression(latex) {
  let escaped = replaceLatexTokens(latex);

  while(escaped !== replaceLatexTokens(escaped)) {
    escaped = replaceLatexTokens(escaped);
  }

  const recompiled = recompileRootExpressions(escaped);
  return recompiled;
}

function replaceLatexTokens(latex) {
  const replaced = latex
    .replace(/\\sqrt\[3\]\{([^\{]*?)\}/g, (match, value) => {
      return replaceRootExpression(value, 'cbrt');
    })
    .replace(/\\sqrt\{([^\{]*?)\}/g, (match, value) => {
      return replaceRootExpression(value, 'sqrt');
    })
    .replace(/\\frac\{([^\{]*?)\}\{([^\{]*?)\}/g, '(($1)/($2))')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\pi/g, `(${pi})`)
    .replace(/\^\{(.?)\}/g, '^($1)')
  
  return replaced;
}

function replaceRootExpression(value, rootType) {
  try {
    const expression = algebra.parse(value);
    const evaluated = parseFloat(expression.eval({}).toString());
    if(Number.isFinite(evaluated)) {
      return Math[rootType](evaluated);
    }
  } catch(e) { }

  return `(${rootType}(${value}))`;
}

function replaceSquareRoot(match, varname, power) {
  power = parseInt(power);

  if(isNaN(power) || !power || power < 2) {
    return match;
  }
  
  const diff = power % 2;
  if(!diff) {
    return `(${varname}^${power/2})`;
  } else {
    return `((${varname}^${Math.floor(power/2)})*sqrt${varname})`;
  }
}

function replaceCubicRoot(match, varname, power) {
  power = parseInt(power);

  if(isNaN(power) || !power || power < 3) {
    return match;
  }
  
  const diff = power % 3;
  if(!diff) {
    return `(${varname}^${power/3})`;
  } else {
    return `((${varname}^${Math.floor(power/3)})*(cbrt${varname}^${diff}))`;
  }
}

function recompileRootExpressions(escaped) {
  const parsed = algebra.parse(escaped);
  
  const value = parsed.toString()
    // recompile SQUARE ROOT expressions if required
    // converts sqrta^2 to "a" and sqrta^3 to a*sqrta and sqrta^4 to "2a"
    .replace(/sqrt([a-z]?)\^([0-9]?)/gi, replaceSquareRoot)
    // recompile CUBIC ROOT expressions if required
    // converts cbrta^3 to "a" and cbrta^5 to a*cbrta^2
    .replace(/cbrt([a-z]?)\^([0-9]?)/gi, replaceCubicRoot);

  return algebra.parse(value);
}

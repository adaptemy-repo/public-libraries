import _ from 'lodash';

import { latexToAlgebraExpression } from './latexToAlgebraExpression';
import { cleanupLatexExpression } from './cleanupLatexExpression';

function extractVariableNames(exp) {
  return Array.prototype.concat.apply([],
    _.get(exp, 'terms', []).map(({ variables }) =>
      variables.map(({ variable }) => variable)
    )
  );
}

function populateVariables(exp) {
  const variables = {};
  const varnames = extractVariableNames(exp);
  varnames.forEach(varname =>
    variables[varname] = Math.floor(Math.random() * 100000000)
  );
  
  return variables;
}

export function compareLatexExpressions(exp, exp2, algebraic) {
  exp = cleanupLatexExpression(exp);
  exp2 = cleanupLatexExpression(exp2);

  if(!exp || !exp2) {
    return false;
  }

  // @TODO add support for fractions, square of root, braced expressions, etc.

  if(!algebraic) {
    return exp === exp2;
  }

  try {
    const parsed1 = latexToAlgebraExpression(exp);
    const parsed2 = latexToAlgebraExpression(exp2);
    const variables = populateVariables(parsed1);

    return parsed1.eval(variables).toString() === parsed2.eval(variables).toString();
  } catch(e) {
    console.log(e);
    return false;
  }
}

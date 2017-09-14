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

export function compareLatexExpressions(solution, answer, algebraic, caseSensitive) {
  solution = cleanupLatexExpression(solution, caseSensitive);
  answer = cleanupLatexExpression(answer, caseSensitive);

  if(!solution || !answer) {
    return false;
  }

  // @TODO add support for fractions, square of root, braced expressions, etc.

  try {
    const parsedSolution = latexToAlgebraExpression(solution);
    const variables = populateVariables(parsedSolution);
    const solutionValue = parsedSolution.eval(variables).toString();

    if(!algebraic) {
      const simple = solution === answer;
      const math = Number(solutionValue) === Number(answer);
      
      // @TODO evaluate (2^2)a + b === 4a + b

      return simple || math;
    }

    const parsedAnswer = latexToAlgebraExpression(answer);
    const answerValue = parsedAnswer.eval(variables).toString();
    
    return solutionValue === answerValue;
  } catch(e) {
    console.log(e);
    return false;
  }
}

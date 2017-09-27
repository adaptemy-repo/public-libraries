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
    const parsedAnswer = latexToAlgebraExpression(answer);
    const variables = populateVariables(parsedSolution);

    if(!algebraic) {
      return solution === answer;
    }

    const solutionValue = parsedSolution.eval(variables).toString();
    const answerValue = parsedAnswer.eval(variables).toString();
    
    return solutionValue === answerValue;
  } catch(e) {
    console.log(e);
    return false;
  }
}

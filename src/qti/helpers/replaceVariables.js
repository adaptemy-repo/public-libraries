export default function replaceVariables(context = '', values = {}) {
  const allVariations = generateVariableCases(values);
  
  Object.keys(allVariations).forEach(key => {
    const regex = new RegExp(escapeRegexCharacter(key), 'gi');
    context = context.replace(regex, allVariations[key]);
  });
  
  return context;
}

function escapeRegexCharacter(value) {
  value = value.replace(/\$/g, '\\$');
  value = value.replace(/\//g, '\\\/');
  return value;
}

function generateVariableCases(values = []) {
  const result = {};
  
  Object.keys(values).forEach(varname => {
    result[varname.toLowerCase()] = values[varname];
    result[formatMathMlVariable(varname)] = '<mn>' + values[varname] + '</mn>';
  });
  
  return result;
}

const MATH_ML_PREFIX = '<mo([^>]*)>$</mo><mo([^>]*)>$</mo><mi>';
function formatMathMlVariable(value) {
  return MATH_ML_PREFIX + value.substr(2) + '</mi>';
}

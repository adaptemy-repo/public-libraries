'use strict';

export default function algebraicEquals(a,b, caseSensitive){
  try{
    if (!caseSensitive) {
      a = typeof a === 'string' ? a.toLowerCase() : a
      b = typeof b === 'string' ? b.toLowerCase() : b
    }
    a = a.replace(/–/g, '-'); //be forgiving of different dashes for minus
    b = b.replace(/–/g, '-'); //be forgiving of different dashes for minus
    var dimension = getDimension(a);
    var errorFound = false;
    dimension = dimension || 1; //set minimum value to 1, we want to test problems of 0 dimension
    for (var count = 0; count < dimension; count++){
      if (!compareOnce(a,b)){
        errorFound = true;
      }
    }
    return !errorFound 
  }
  catch(e){
    return false;
  } 
}

function compareOnce(s1,s2){
  var tokens1 = tokenize(s1),
      tokens2 = tokenize(s2),
      placeholders = generatePlaceholders(tokens1, tokens2);

  var testTokens1 = replaceVariableTokens(tokens1, placeholders),
      testTokens2 = replaceVariableTokens(tokens2, placeholders);

  var testString1 = detokenize(testTokens1);
  var testString2 = detokenize(testTokens2);
  return eval(testString1) === eval(testString2);
}


function getDimension(input){
  var tokens = tokenize(input);
  return tokens.reduce(function(variables, token){
    if (token.type !== 'Variable'){
      return variables;
    }
    if (variables[token.value]){
      return variables;
    }
    variables[token.value] = 1;
    variables.count ++;
    return variables;
  },{count:0}).count;
}

function generatePlaceholders(tokens1, tokens2){
  //get all the variable tokens and assign them a random value
  var placeholders1 =  tokens1.reduce(accumulateTokens,{});
  return tokens2.reduce(accumulateTokens, placeholders1);

  function accumulateTokens(variables, token){
    if (token.type !== 'Variable'){
      return variables;
    }
    if (variables[token.value]){
      return variables;
    }
    variables[token.value] = Math.floor(Math.random()*1000000);
    return variables;
  }
}

function replaceVariableTokens(tokens, placeholders){
  return tokens.map(function(token){
    if (token.type !== 'Variable'){
      return token;
    }
    if (!placeholders[token.value]){
      token.value = Math.floor(Math.random()*1000000);
    }
    else{
      token.value = placeholders[token.value];  
    }
    return token;
  });
}
 

function detokenize(input){
  return input.reduce(function (acc, cur){
    return acc + cur.value;
  },'');
}

function Token(type, value) {
  this.type = type;
  this.value = value;
}

function isComma(ch) {
  return /,/.test(ch);
}

function isDigit(ch) {
  return /\d/.test(ch);
}

function isLetter(ch) {
  return /[a-z]/i.test(ch);
}

function isOperator(ch) {
  return /\+|-|\*|\/|\^/.test(ch);
}

function isLeftParenthesis(ch) {
  return /\(/.test(ch);
}

function isRightParenthesis(ch) {
  return /\)/.test(ch);
}

function tokenize(str) {
  str.replace(/\s+/g, "");
  str=str.split("");

  var result=[];
  var letterBuffer=[];
  var numberBuffer=[];

  str.forEach(function (char, idx) {
    if(isDigit(char)) {
      numberBuffer.push(char);
    } else if(char==".") {
      numberBuffer.push(char);
    } else if (isLetter(char)) {
      if(numberBuffer.length) {
        emptyNumberBufferAsLiteral();
        result.push(new Token("Operator", "*"));
      }
      letterBuffer.push(char);
    } else if (isOperator(char)) {
      emptyNumberBufferAsLiteral();
      emptyLetterBufferAsVariables();
      result.push(new Token("Operator", char));
    } else if (isLeftParenthesis(char)) {
      if(letterBuffer.length) {
        result.push(new Token("Function", letterBuffer.join("")));
        letterBuffer=[];
      } else if(numberBuffer.length) {
        emptyNumberBufferAsLiteral();
        result.push(new Token("Operator", "*"));
      } else if (result[result.length-1].type === "Right Parenthesis"){
        result.push(new Token("Operator", "*"));
      }
      result.push(new Token("Left Parenthesis", char));
    } else if (isRightParenthesis(char)) {
      emptyLetterBufferAsVariables();
      emptyNumberBufferAsLiteral();
      result.push(new Token("Right Parenthesis", char));
    } else if (isComma(char)) {
      emptyNumberBufferAsLiteral();
      emptyLetterBufferAsVariables();
      result.push(new Token("Function Argument Separator", char));
    }
  });
  if (numberBuffer.length) {
    emptyNumberBufferAsLiteral();
  }
  if(letterBuffer.length) {
    emptyLetterBufferAsVariables();
  }
  return result;

  function emptyLetterBufferAsVariables() {
    var l = letterBuffer.length;
    for (var i = 0; i < l; i++) {
      result.push(new Token("Variable", letterBuffer[i]));
          if(i< l-1) { //there are more Variables left
            result.push(new Token("Operator", "*"));
          }
      }
      letterBuffer = [];
  }

  function emptyNumberBufferAsLiteral() {
    if(numberBuffer.length) {
      result.push(new Token("Literal", numberBuffer.join("")));
      numberBuffer=[];
    }
  }

}
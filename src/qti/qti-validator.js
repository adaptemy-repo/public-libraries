import QTIParser from './qti-parser';
import QTIStyler from './qti-styler';
import * as QTIElements from './qti-elements';
import algebraicEquals from '../helpers/algebraic-equals';
import latex from '../latex';
import { compareLatexExpressions } from '../latex/compareLatexExpressions';

const urlify = require('urlify').create();
const MINIMAL_SECOND_CHANCE_RATING = 4;

class QTIValidator {
  constructor() {
    this.decimalSeparator = '.'; // default decimal separator
  }
  
  setDecimalSeparator(separator) {
    this.decimalSeparator = separator;
    return this;
  }
  
  extractUserAnswer(inputNode) {
    const questionType = inputNode.getAttribute('question-type');
    
    switch(questionType) {
      case QTIElements.extendedTextInteraction.IDENTIFIER:
      case QTIElements.textEntryInteraction.IDENTIFIER:
        if (inputNode.getAttribute('comparison').indexOf('latex') !== -1){
          return inputNode.getAttribute('value');
        }
        return inputNode.value;
        
      case QTIElements.inlineChoiceInteraction.IDENTIFIER:
        const select = inputNode.getElementsByTagName('select')[0];
        return select.options[select.selectedIndex].value;
        
      case QTIElements.choiceInteraction.IDENTIFIER:
        return this.getCheckedValues(inputNode);
    }
    
    throw 'The provided inputNode did not contain a question-type';
  }

  extractAllCheckboxes(inputNode) {
    const questionType = inputNode.getAttribute('question-type');
    
    switch(questionType) {
      case QTIElements.extendedTextInteraction.IDENTIFIER:
      case QTIElements.textEntryInteraction.IDENTIFIER:
        return [];
        
      case QTIElements.inlineChoiceInteraction.IDENTIFIER:
        return [];
        
      case QTIElements.choiceInteraction.IDENTIFIER:
        return this.getAllAvailableValues(inputNode);
    }
    
    throw 'The provided inputNode did not contain a question-type';
  }

  getAllAvailableValues(node) {
    const inputs = node.getElementsByTagName('input');
    const values = [];
    
    for(let i = 0; i < inputs.length; i++) {
      values.push(inputs[i].id);
    }
    
    return values;
  }
  
  getCheckedValues(node) {
    const inputs = node.getElementsByTagName('input');
    const values = [];
    
    for(let i = 0; i < inputs.length; i++) {
      if(inputs[i].checked) {
        values.push(inputs[i].id);
      }
    }
    
    return this.isRadio(node) ? values[0] : values;
  }
  
  isRadio(node) {
    const interactionType = node.getAttribute('interaction-type');
    return interactionType === QTIElements.choiceInteraction.RADIO;
  }

  getAllInputs(node) {
    node = node || document;
    return node.getElementsByClassName('qti-interaction');
  }
  
  getInputsFromNode(node) {
    const inputs = this.getAllInputs(node);
    return Array.prototype.slice.call(inputs);
  }

  getAllUserAnswers(inputsNode) {
    const inputs = this.getInputsFromNode(inputsNode);
    
    return inputs.map(node => {
      let answers = this.extractUserAnswer(node) || [];
      let availableAnswers = this.extractAllCheckboxes(node) || [];
      
      // cast to array
      if(!Array.isArray(answers)) {
        answers = [answers];
      }
      
      return {
        node,
        answers,
        availableAnswers,
        identifier: node.getAttribute('identifier')
      };
    });
  }
  
  findSolutionByIdentifier(solutions, identifier) {
    return solutions.find(s => s.identifier === identifier);
  }
  
  findAnyOrderSolutionValues(solutions) {
    const anyOrder = this.filterAnyOrderSolutions(solutions);
    return anyOrder.map(function(solution){
      return {
        value: solution.value,
        caseSensitive: solution.caseSensitive
      };
    });
  }
  
  filterAnyOrderSolutions(solutions) {
    return solutions.filter(solution => solution.anyOrder);
  }

  containsIncorrectDecimalSeparator(value){
    var possibleSeparators = ['.', ','];
    var correctSeparator = this.decimalSeparator;
    var valueString = ''+value;
    return possibleSeparators.some(function(separator){
      if (separator === correctSeparator){
        return false;
      }
      if (valueString.includes(separator)){
        return true;
      }
      return false;
    });
  }

  isAnswerInRange(userAnswer, range){
    var min, max;
    [min, max] = range.sort((a, b) => a - b);
    return userAnswer.answers.every(value => {
      if (this.containsIncorrectDecimalSeparator(value)){
        return false;
      }
      value = parseFloat(value);
      if(isNaN(value)) {
        return false;
      }

      return value >= min && value <= max; 
    });
  }
  
  isValidUserAnswer(solutions, userAnswer) {
    var self = this;
    let solution = this.findSolutionByIdentifier(solutions, userAnswer.identifier);
    let solutionValues = 
    [{
      value: solution.value,
      caseSensitive: solution.caseSensitive
    }];
    if(solution.anyOrder) {
      solutionValues = this.findAnyOrderSolutionValues(solutions);
    }

    if(!userAnswer || !userAnswer.answers || !userAnswer.answers.length) {
      return false;
    }
    
    if(solution.isRange) {
      if (!solution.anyOrder){
        if (self.isAnswerInRange(userAnswer, solution.rangeValue)){
          return true;
        }
      }
      else{
        return solutionValues.some(function(solutionValue){
          if (self.isAnswerInRange(userAnswer, solutionValue.rangeValue)){
            return true;
          }
        });
      }
    } 

    if( !solution.containsAlternatives && (solution.value.length !== userAnswer.answers.length) ) {
      return false;
    }
    
    return userAnswer.answers.every(answer => {
      return solutionValues.some(function(solutionValue){
        return solutionValue.value.some(function(value){
          return self.isSingleValueCorrect(solution, value, answer, solutionValue.caseSensitive); 
        });
      });
    }); 
    
  }//isValidUserAnswer

  isSingleValueCorrect(solution, value, answer, caseSensitive){
    try{
      const { isLatex, isAlgebraic } = solution;
      if(isLatex) {
        return compareLatexExpressions(value, answer, isAlgebraic, caseSensitive);
      }
      
      if(isAlgebraic) {
        value = Array.isArray(value) ? value[0] : value
        return algebraicEquals(value, answer, caseSensitive);
      }

      if (this.decimalSeparator !== '.' && answer.indexOf('.') !== -1 && value.indexOf('.') === -1){
        //answers containing incorrect decimal separator are incorrect
        return false;
      }

      const ansA = this.uniformatValue(value, caseSensitive);
      const ansB = this.uniformatValue(answer, caseSensitive);

      const stringMatch = ansA === ansB;
      const numericMatch = Number(ansA) === Number(ansB);

      return stringMatch || numericMatch;
    } catch (e) {
      return false
    }
  }

  validateUserAnswersAgainstSolutions(userAnswers, solutions) {
    //removeUnavailableCheckboxes is to allow for a bug in the authoring system.
    //It can show us some checkbox answers are required even when they are not present in the html
    //we remove any required answers which were not presented to the user.
    //These functions are also included in this bug fix: extractAllCheckboxes, getAllAvailableValues
    solutions = this.removeUnavailableCheckboxes(userAnswers, solutions);
    userAnswers = this.santizeDuplicateAnyOrderAnswers(userAnswers, solutions);
    return userAnswers.every(this.isValidUserAnswer.bind(this, solutions));
  }

  removeUnavailableCheckboxes(userAnswers, solutions){
    //if available options are not being tracked, do nothing
    var isAnyAnswerUntracked = userAnswers.some(function(userAnswer){
      return !(userAnswer.availableAnswers && userAnswer.availableAnswers.length > 0);
    });
    if (isAnyAnswerUntracked){
      return solutions;
    }

    //get UUID of all options presented to the user
    var allAvailableAnswers = userAnswers.reduce(function(pre, cur){
      return pre.concat(cur.availableAnswers);
    },[]);
    //remove any required answers which were not presented to the user.
    solutions.forEach(function(solution){
      solution.value = solution.value.filter(function(valueUnderTest){
        return allAvailableAnswers.some(function(availableAnswer){
          return availableAnswer === valueUnderTest;
        });
      });
    });
    return solutions;
  }


  styleInputs(userAnswers, solutions, hasUsedLastChance) {
    QTIStyler.setInputValidationState(userAnswers, solutions, hasUsedLastChance);
  }
  
  santizeDuplicateAnyOrderAnswers(userAnswers, solutions) {
    const sanitized = [];
    const anyAnswer = [];
    var self = this;
    solutions.forEach(solution => {
      const answer = userAnswers.find(
        answer => answer.identifier === solution.identifier
      );
      
      // if no answer was found for the solution, ignore
      if(!answer) {
        return;
      }
      
      // if not an anyOrder answer - ignore
      if(!solution.anyOrder) {
        sanitized.push(answer);
      }
      // an anyOrder answer
      else
      {
        var matchingSolutions = solutions.filter( function (solution) {
          return self.isSingleValueCorrect(solution, solution.value, answer.answers[0])
        });

        // answer was previously entered (look only at first value)
        if(anyAnswer.indexOf(answer.answers[0]) === -1) {
          anyAnswer.push(answer.answers[0]);
        } else if (matchingSolutions.length > 1) {
          // Are there several matching 'any order' solutions
          // If so, leave the remaining answers alone
        }
        else {
          answer.answers = [ null ];
        }
        sanitized.push(answer);
      }
    });

    return sanitized;
  }

  findInputNodeByIdentifier(identifier) {
    const inputs = this.getAllInputs();

    for(let i = 0; i < inputs.length; i++) {
      if(inputs[i].getAttribute('identifier') === String(identifier)) {
        return inputs[i];
      }
    }
  }
  
  getType(item) {
    return Array.isArray('item') ? 'array' : typeof item;
  }

  /*
  * @DEPRICATED
  */
  validateAnswer(inputNode, questionNode) {
    console.log('QTIValidator.validateAnswer() is depricated and will be removed in next versions');
    console.log('QTIValidator.isValidUserAnswer() replaces QTIValidator.validateAnswer()');

    let result;
    
    if(!inputNode || !questionNode) {
      return false;
    }
    
    const answer = QTIParser.extractAnswerValue(questionNode);
    const userAnswer = this.extractUserAnswer(inputNode);
    
    if(this.getType(answer) !== this.getType(userAnswer)) {
      return false;
    }
    
    if(Array.isArray(answer)) {
      if(answer.length !== userAnswer.length) {
        return false;
      }
      
      for(let i = 0; i < userAnswer.length; i++) {
        if(userAnswer.indexOf(answer[i]) === -1) {
          return false;
        }
      }
      
      return true;
    }
    
    return this.uniformatValue(answer) === this.uniformatValue(userAnswer);
  }
  
  uniformatValue(value, caseSensitive = false) {
    value = String(value);              // stringify
    value = value.replace(/ /g, '');    // remove spaces
    value = caseSensitive ? value : value.toLowerCase();
    
    //flatten different types of comma
    value = value.replace(/\‚/g, ',');
    
    // replace decimal separator
    if(this.decimalSeparator !== '.') {
      const decimalRegex = new RegExp(`${this.decimalSeparator}`, 'g');
      value = value.replace(decimalRegex, '.');
    }

    // remove preceeding zeros
    value = value.replace(/^0+/, '');
    // remove trailing zeros after last decimal separator
    value = value.replace(/\.(?=[^.]*$)(.*[^0])0+$/, '.$1');
    // remove trailing decimal separators and zeros
    value = value.replace(/(\.+(0+)?)$/, '');
    
    // replace emdash & endash with normal dash
    value = value.replace(/[\u2013-\u2014]/g, '-');
    
    return isFinite(parseFloat(value)) ? value : urlify(value);
  }
  
  meritsASecondChance(inputNode) {
    let inputNodes;
    let rating = 0;
    
    if(Array.isArray(inputNode)) {
      inputNodes = inputNode;
    }
    else {
      inputNodes = this.getInputsFromNode(inputNode);
    }

    // loop through all input fields to build a final second chance rating
    inputNodes.forEach(inputNode => {
      const questionType = inputNode.getAttribute('question-type');
      
      switch(questionType) {
        // text box inputs get a rating equal to the minimal
        // for a second chance
        case QTIElements.extendedTextInteraction.IDENTIFIER:
        case QTIElements.textEntryInteraction.IDENTIFIER:
          rating += MINIMAL_SECOND_CHANCE_RATING;
          break;
          
        // select fields get a rating equal to the amount of options -1
        // compensating for the empty select option
        case QTIElements.inlineChoiceInteraction.IDENTIFIER:
          const select = inputNode.getElementsByTagName('select')[0];
          rating += select.options.length - 1;
          break;
          
        // checkboxes & radios
        case QTIElements.choiceInteraction.IDENTIFIER:
          const interactionType = inputNode.getAttribute('interaction-type');
          const inputs = inputNode.getElementsByTagName('input');
          
          // radios get a rating that equals the amount of options
          if(interactionType === QTIElements.choiceInteraction.RADIO) {
            rating += inputs.length;
          }
          // checkboxes get rating of 2 power of amount of options
          else {
            rating += Math.pow(2, inputs.length);
          }
          break;
          
        default:
          throw 'The provided inputNode did not contain a question-type';
      }
    });

    return rating >= MINIMAL_SECOND_CHANCE_RATING;      
  }
}

const service = new QTIValidator();
export default service;

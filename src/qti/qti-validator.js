import QTIParser from './qti-parser';
import QTIStyler from './qti-styler';
import * as QTIElements from './qti-elements';
import algebraicEquals from '../helpers/algebraic-equals';

const urlify = require('urlify').create();
const MINIMAL_SECOND_CHANCE_RATING = 4;

class QTIValidator {
  constructor() {
    this.decimalSeparator = '.'; // default decimal separator
    
    // @TODO remove and set per publisher
    this.decimalSeparator = ',';
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
        return inputNode.value;
        
      case QTIElements.inlineChoiceInteraction.IDENTIFIER:
        const select = inputNode.getElementsByTagName('select')[0];
        return select.options[select.selectedIndex].value;
        
      case QTIElements.choiceInteraction.IDENTIFIER:
        return this.getCheckedValues(inputNode);
    }
    
    throw 'The provided inputNode did not contain a question-type';
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
      
      // cast to array
      if(!Array.isArray(answers)) {
        answers = [answers];
      }
      
      return {
        node,
        answers,
        identifier: node.getAttribute('identifier')
      };
    });
  }
  
  findSolutionByIdentifier(solutions, identifier) {
    return solutions.find(s => s.identifier === identifier);
  }
  
  findAnyOrderSolutionValues(solutions) {
    const anyOrder = this.filterAnyOrderSolutions(solutions);
    return anyOrder.map(solution => solution.value);
  }
  
  filterAnyOrderSolutions(solutions) {
    return solutions.filter(solution => solution.anyOrder);
  }
  
  isValidUserAnswer(solutions, userAnswer) {
    let solution = this.findSolutionByIdentifier(solutions, userAnswer.identifier);
    let solutionValues = solution.value;

    if(solution.anyOrder) {
      solutionValues = this.findAnyOrderSolutionValues(solutions);
    }
    
    if( !solution.containsAlternatives && (solution.value.length !== userAnswer.answers.length) ) {
      return false;
    }
    
    return userAnswer.answers.every(answer => {
      return solutionValues.some(value => {
        // @ATTENTION no need to cast to Number!
        // both values are uniform strings and will be equalized!

        const ansA = this.uniformatValue(value, solution.caseSensitive);
        const ansB = this.uniformatValue(answer, solution.caseSensitive);
        if(solution.comparison === 'algebraic') {
          return algebraicEquals(value, answer);
        } else {
          const stringMatch = ansA === ansB;
          const numericMatch = Number(ansA) === Number(ansB);

          return stringMatch || numericMatch;
        }
      });
    });
  }


  validateUserAnswersAgainstSolutions(userAnswers, solutions) {
    userAnswers = this.santizeDuplicateAnyOrderAnswers(userAnswers, solutions);
    return userAnswers.every(this.isValidUserAnswer.bind(this, solutions));
  }

  styleInputs(userAnswers, solutions, hasUsedLastChance) {
    QTIStyler.setInputValidationState(userAnswers, solutions, hasUsedLastChance);
  }
  
  santizeDuplicateAnyOrderAnswers(userAnswers, solutions) {
    const sanitized = [];
    const anyAnswer = [];

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
        // answer was previously entered (look only at first value)
        if(anyAnswer.indexOf(answer.answers[0]) === -1) {
          anyAnswer.push(answer.answers[0]);
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

  validateAnswer(inputNode, questionNode) {
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

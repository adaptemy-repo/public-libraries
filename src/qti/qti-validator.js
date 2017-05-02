import QTIParser from './qti-parser';
import QTIStyler from './qti-styler';
import * as QTIElements from './qti-elements';

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
        const interactionType = inputNode.getAttribute('interaction-type');
        const inputs = inputNode.getElementsByTagName('input');
        const values = [];
        
        for(let i = 0; i < inputs.length; i++) {
          if(inputs[i].checked) {
            values.push(inputs[i].id);
          }
        }
        
        return interactionType === QTIElements.choiceInteraction.RADIO ?
          values[0] : values;
    }
    
    throw 'The provided inputNode did not contain a question-type';
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
  
  isValidUserAnswer(solutions, userAnswer) {
    const solution = solutions.find(s => s.identifier === userAnswer.identifier);
    
    if(solution.value.length !== userAnswer.answers.length) {
      return false;
    }
    
    return userAnswer.answers.every(answer => {
      return solution.value.some(value => {
        // @ATTENTION no need to cast to Number!
        // both values are uniform strings and will be equalized!

        const ansA = this.uniformatValue(value);
        const ansB = this.uniformatValue(answer);
        const stringMatch = ansA === ansB;
        const numericMatch = Number(ansA) === Number(ansB);

        return stringMatch || numericMatch;
      });
    });
  }
  
  setCorrectnessClass(userAnswers, solutions) {
    const isValid = userAnswers.map(this.isValidUserAnswer.bind(this, solutions));
    
    for(let i = 0; i < userAnswers.length; i++) {
      if(userAnswers[i].node.classList) {
        userAnswers[i].node.classList.add(
          isValid[i] ? 'hide-correct' : 'hide-incorrect'
        );
      }
    }
  }

  validateUserAnswersAgainstSolutions(userAnswers, solutions) {
    //this.setCorrectnessClass(userAnswers, solutions);
    QTIStyler.setInputValidationState(userAnswers, solutions);
    return userAnswers.every(this.isValidUserAnswer.bind(this, solutions));
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
  
  uniformatValue(value) {
    value = String(value);              // stringify
    value = value.toLowerCase();        // cast to lowercase
    value = value.replace(/ /g, '');    // remove spaces
    
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

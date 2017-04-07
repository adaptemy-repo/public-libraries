import QTIParser from './qti-parser';
import * as QTIElements from './qti-elements';


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
        const select = inputNode.getElementsByTagName('select');
        return select.options[select.selectedIndex];
        
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

  getAllInputs() {
    return document.getElementsByClassName('qti-interaction');
  }

  findInputNodeByIdentifier(identifier) {
    const inputs = this.getAllInputs();

    for(let i = 0; i < inputs.length; i++) {
      if(inputs[i].getAttribute('identifier') === String(identifier)) {
        return inputs[i];
      }
    }
  }

  validateAnswer(inputNode, questionNode) {
    if(!inputNode || !questionNode) {
      return false;
    }
    
    const answer = QTIParser.extractAnswerValue(questionNode);
    const userAnswer = this.extractUserAnswer(inputNode);
    
    if(typeof answer !== typeof userAnswer) {
      return false;
    }
    
    let result = true;
    if(Array.isArray(answer)) {
      for(let i = 0; i < answer.length; i++) {
        if(userAnswer.indexOf(answer[i]) === -1) {
          result = false;
          break;
        }
      }
    }
    else {
      result = this.uniformatValue(answer) === this.uniformatValue(userAnswer);
    }
    
    return result;
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
    // remove trailing decimal separators
    value = value.replace(/\.+$/, '');
    
    return value;
  }
}

const service = new QTIValidator();
export default service;

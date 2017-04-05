import QTIParser from './qti-parser';
import * as QTIElements from './qti-elements';

class QTIValidator {
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
    
    console.log('inputz', inputNode, questionNode);
    const answers = QTIParser.extractAnswerValue(questionNode);
    const userAnswer = this.extractUserAnswer(inputNode);
    
    if(typeof answers !== typeof userAnswer) {
      return false;
    }
    
    let result = true;
    if(Array.isArray(answers)) {
      for(let i = 0; i < answers.length; i++) {
        if(userAnswers.indexOf(answers[i]) === -1) {
          result = false;
          break;
        }
      }
    }
    else {
      result = String(answers).trim() === String(userAnswer).trim();
    }
    
    return result;
  }
}

const service = new QTIValidator();
export default service;

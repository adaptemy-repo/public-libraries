import QTIValidator from './qti-validator';
import * as QTIElements from './qti-elements';

const CORRECT = 'hide-correct';
const INCORRECT = 'hide-incorrect';

class QTIStyler {
  resetStyles(node) {
    node.classList.remove(CORRECT, INCORRECT);
    return this;
  }
  
  setCorrectnessClass(node, correct = true) {
    this.resetStyles(node);
    node.classList.add(correct ? CORRECT : INCORRECT);
    return this;
  }
  
  disable(node) {
    node.setAttribute('disabled', true);
    return this;
  }
  
  setInputValidationState(userAnswers, solutions, hasUsedLastChance = false) {
    const answerArray = userAnswers.map(QTIValidator.isValidUserAnswer.bind(QTIValidator, solutions));
    let node, isValid, questionType;
    
    for(let i = 0; i < answerArray.length; i++) {
      { node } = userAnswers[i];
      isValid = answerArray[i];
      questionType = node.getAttribute('question-type');
      
      switch(questionType) {
        case QTIElements.extendedTextInteraction.IDENTIFIER:
        case QTIElements.textEntryInteraction.IDENTIFIER:
          return this.validateTextInput(node, isValid, hasUsedLastChance);
          break;
          
        case QTIElements.inlineChoiceInteraction.IDENTIFIER:
          break;
          
        case QTIElements.choiceInteraction.IDENTIFIER:
          break;
          
        default:
          throw 'The provided inputNode did not contain a question-type';
      }
    }
  }
  
  validateTextInput(node, isValid, hasUsedLastChance) {
    const value = node.value.trim();

    // empty incorrect value, do nothing
    if(!value && !isValid) {
      return;
    }
    
    // last attempt or is valid - disable input
    if(hasUsedLastChance || isValid) {
      this.disable(node);
    }
    
    // set correctness class in all cases
    return this.setCorrectnessClass(node, isValid);
  }
}

const service = new QTIStyler();
export default service;

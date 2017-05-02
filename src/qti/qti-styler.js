import QTIValidator from './qti-validator';
import * as QTIElements from './qti-elements';

const CORRECT = 'hide-correct';
const INCORRECT = 'hide-incorrect';

const CORRECT_OPTION = 'hide-correct-value';
const INCORRECT_OPTION = 'hide-incorrect-value';

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
      node = userAnswers[i].node;
      isValid = answerArray[i];
      questionType = node.getAttribute('question-type');
      
      switch(questionType) {
        case QTIElements.extendedTextInteraction.IDENTIFIER:
        case QTIElements.textEntryInteraction.IDENTIFIER:
          return this.validateTextInput(node, isValid, hasUsedLastChance);
          break;
          
        case QTIElements.inlineChoiceInteraction.IDENTIFIER:
          return this.validateSelectInput(node, isValid, hasUsedLastChance);
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
  
  validateSelectInput(node, isValid, hasUsedLastChance) {
    const select = node.getElementsByTagName('select')[0];
    let option;
    
    if(!select) {
      throw 'Select field was not found in the provided inputNode';
    }
    
    // default option selected
    if(select.selectedIndex === 0) {
      return;
    }
    
    for(let i = 0; i < select.options.length; i++) {
      option = select.options[i];
      
      // disable all checkboxes if is valid or was last chance
      if(hasUsedLastChance || isValid) {
        this.disable(option);
      }
      
      // add correctness class to the selected index
      if(i === select.selectedIndex) {
        option.classList.add(isValid ? CORRECT_OPTION : INCORRECT_OPTION);
      }
    }
    
    return this.setCorrectnessClass(select, isValid);
  }
}

const service = new QTIStyler();
export default service;

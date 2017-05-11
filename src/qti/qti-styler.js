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
  
  setCorrectnessClass(node, correct = true, doReset = true) {
    if(doReset) {
      this.resetStyles(node);
    }
    
    const addClass = correct ? CORRECT : INCORRECT;
    if(!node.classList.contains(addClass)) {
      node.classList.add(addClass);
    }
  
    return this;
  }
  
  disable(node) {
    node.setAttribute('disabled', true);
    return this;
  }
  
  setInputValidationState(userAnswers, solutions, hasUsedLastChance = false) {
    let node, isValid, questionType;
    const answerArray = userAnswers.map(
      QTIValidator.isValidUserAnswer.bind(QTIValidator, solutions)
    );
    
    for(let i = 0; i < answerArray.length; i++) {
      node = userAnswers[i].node;
      isValid = answerArray[i];
      questionType = node.getAttribute('question-type');
      
      switch(questionType) {
        case QTIElements.extendedTextInteraction.IDENTIFIER:
        case QTIElements.textEntryInteraction.IDENTIFIER:
          this.validateTextInput(node, isValid, hasUsedLastChance);
          break;
          
        case QTIElements.inlineChoiceInteraction.IDENTIFIER:
          this.validateSelectInput(node, isValid, hasUsedLastChance);
          break;
          
        case QTIElements.choiceInteraction.IDENTIFIER:
          if(QTIValidator.isRadio(node)) {
            this.validateRadioInput(node, isValid, hasUsedLastChance);
          }
          else {
            this.validateCheckboxInput(node, isValid, hasUsedLastChance);
          }
          break;
          
        default:
          throw 'The provided inputNode did not contain a question-type';
      }
    }
  }
  
  validateRadioInput(node, isValid, hasUsedLastChance) {
    const inputs = node.getElementsByTagName('input');
    const value = QTIValidator.getCheckedValues(node);
    
    // empty incorrect value, do nothing
    if(!value && !isValid) {
      return;
    }
    
    // last attempt or is valid - disable input
    for(let i = 0; i < inputs.length; i++) {
      if(isValid || hasUsedLastChance) {
        this.disable(inputs[i]);
      }
      
      if(inputs[i].checked) {
        this.setCorrectnessClass(inputs[i], isValid, false);
      }
    }
  }
  
  validateCheckboxInput(node, isValid, hasUsedLastChance) {
    const inputs = node.getElementsByTagName('input');
    const values = QTIValidator.getCheckedValues(node);

    // empty incorrect value, do nothing
    if(!values.length && !isValid) {
      return;
    }
    
    // last attempt or is valid - disable input
    for(let i = 0; i < inputs.length; i++) {
      if(isValid || hasUsedLastChance) {
        this.disable(inputs[i]);
        
        if(inputs[i].checked) {
          this.setCorrectnessClass(inputs[i], isValid, false);
        }
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

import QTIParser from './qti-parser';
import * as QTIElements from './qti-elements';

const urlify = require('urlify').create();

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

  getAllInputs() {
    return document.getElementsByClassName('qti-interaction');
  }

  getAllUserAnswers(DOMNnode){
    var extractUserAnswer = this.extractUserAnswer;
    var getType = this.getType;
    DOMNnode = DOMNnode || document;
    //get all answers as array
    var allAnswers = [].slice.call(DOMNnode.querySelectorAll('.qti-interaction'));
    var formattedAnswers = allAnswers.map(function(answerNode){
      var ans = extractUserAnswer(answerNode);
      ans = ans || [];
      if (!ans.forEach){ //if not an array
        ans = [ans];
      }
      return {
        node: answerNode,
        answers: ans,
        identifier: answerNode.getAttribute('identifier')
      };
    });
    return formattedAnswers;
  }

  validateUserAnswersAgainstSolutions(userAnswers, solutions){
    var matchesIdentifier = this.matchesIdentifier;
    var self = this;
    var allInteractionsCorrect = true;
    userAnswers.forEach(function(answer){
      var soln = solutions.filter(matchesIdentifier(answer.identifier))[0];
      var thisInteractionCorrect;
      if (soln.value.length !== answer.answers.length){
        thisInteractionCorrect = false;
      }
      else{
        thisInteractionCorrect = answer.answers.every(function(answer){
          return soln.value.some(function(val){
            var stringMatch =  (self.uniformatValue(val) === self.uniformatValue(answer));
            var numberMatch = Number(self.uniformatValue(val)) === Number(self.uniformatValue(answer));
            return stringMatch || numberMatch;
          });
        });  
      }
      
      var answerStatus = thisInteractionCorrect ? 'hide-correct' : 'hide-incorrect';
      if (answer.node.classList){
        answer.node.classList.add(answerStatus);  
      }
      allInteractionsCorrect = allInteractionsCorrect && thisInteractionCorrect;
    });
    return allInteractionsCorrect;
  }

  matchesIdentifier(id){
    return function(soln){
      return soln.identifier === id;
    };
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
    // remove trailing decimal separators
    value = value.replace(/\.+$/, '');
    
    return isFinite(parseFloat(value)) ? value : urlify(value);
  }
}

const service = new QTIValidator();
export default service;

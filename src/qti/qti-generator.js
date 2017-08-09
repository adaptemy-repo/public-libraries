import { extractHTML } from '../helpers/extract-html';

function groupAnswersByIdentifier(answers) {
  let result = {};
  answers.forEach(answer => {
    const { identifier } = answer;
    if(!result.hasOwnProperty(identifier)) {
      result[identifier] = [];
    }
    
    result[identifier].push(answer);
  })
  
  return result;
}

export default class QTIGenerator {
  constructor() {
    this.answers = {};
  }
  
  setAnswers(answers) {
    this.answers = groupAnswersByIdentifier(answers);
  }
  
  toXML() {
    let xml = document.createElement('xml');
    Object.keys(this.answers).forEach(identifier => {
      const answers = this.answers[identifier];
      xml.appendChild(this.generateResponseDeclaration(identifier, answers));
    });
    
    return extractHTML(xml);
  }
  
  generateResponseDeclaration(identifier, answers) {
    const root = document.createElement('responseDeclaration');
    const correctResponse = document.createElement('correctResponse');
    let comparison = 'default';
    
    root.setAttribute('identifier', identifier);
    answers.map(answer => {
      const value = document.createElement('value');
      value.innerHTML = answer.value;
      if(answers.length > 1) {
        value.setAttribute('choiceIdentifier', answer.value);
      }
      
      root.setAttribute('comparison', answer.comparison || 'default');
      if(answer.anyOrder) {
        root.setAttribute('any-order', true);
      }
      
      correctResponse.appendChild(value);
    });
    
    root.appendChild(correctResponse);
    
    return root;
  }
}

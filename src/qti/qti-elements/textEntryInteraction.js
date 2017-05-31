export default class textEntryInteraction {
  static IDENTIFIER = 'textEntryInteraction';

  constructor(node, answers) {
    this.node = node;
    this.className = 'qti-interaction qti-input';

    this.maxLength = node.getAttribute('expectedLength');
    this.name = node.getAttribute('responseIdentifier');
    this.questionType = textEntryInteraction.IDENTIFIER;
    this.answer = answers[this.name].value;
  }
  
  get answerTypeAttribute() {
    const isNumber = isFinite(this.answer);
    const integer = parseInt(this.answer);
    const decimal = parseFloat(this.answer);
    
    if(isNumber && integer === decimal) {
      return integer >= 0 ? 'qti-natural' : 'qti-integer';
    }
    else if(isNumber && integer !== decimal) {
      return 'qti-real';
    }
    else {
      return 'qti-string';
    }
  }

  get answerLength() {
    return String(this.answer).length;
  }

  generateDOMNode() {
    const input = document.createElement('input');
    input.className = this.className;

    input.setAttribute('identifier', this.name);
    input.setAttribute('id', this.name);
    input.setAttribute('type', 'text');
    input.setAttribute('answer-length', this.answerLength);
    input.setAttribute('question-type', this.questionType);
    input.setAttribute(this.answerTypeAttribute, true);

    return input;
  }
}

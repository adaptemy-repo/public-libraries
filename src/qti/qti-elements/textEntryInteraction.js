export default class textEntryInteraction {
  static IDENTIFIER = 'textEntryInteraction';

  constructor(node, answers) {
    this.node = node;
    this.className = 'qti-input';

    this.maxLength = node.getAttribute('expectedLength');
    this.name = node.getAttribute('responseIdentifier');
    this.answer = answers[this.name];
  }

  get answerLength() {
    return String(this.answer).length;
  }

  generateDOMNode() {
    const input = document.createElement('input');
    input.className = this.className;

    input.setAttribute('id', this.name);
    input.setAttribute('type', 'text');
    input.setAttribute('maxlength', this.maxLength);
    input.setAttribute('answer-length', this.answerLength);

    return input;
  }
}

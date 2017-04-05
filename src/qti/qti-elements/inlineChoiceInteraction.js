export default class inlineChoiceInteraction {
  static IDENTIFIER = 'inlineChoiceInteraction';

  constructor(node, answers) {
    this.node = node;

    this.shuffle = node.getAttribute('shuffle') === 'true';
    this.name = node.getAttribute('responseIdentifier');
    this.answer = answers[this.name];
  }

  getOptions() {
    return this.node.getElementsByTagName('inlineChoice');
  }

  generateOption(node) {
    const option = document.createElement('option');
    option.setAttribute('value', node.getAttribute('identifier'));
    option.innerHTML = node.textContent;

    return option;
  }

  generateEmptyOption() {
    const option = document.createElement('option');
    option.setAttribute('value', '');

    return option;
  }

  generateSelectNode() {
    const node = document.createElement('select');
    const options = this.getOptions();

    node.className = 'qti-choice inline';
    node.setAttribute('id', this.name);

    // add an empty option on top, so that the first item isn't auto-selected
    node.appendChild(this.generateEmptyOption());

    for(var i = 0; i < options.length; i++) {
      node.appendChild(this.generateOption(options[i]));
    }

    return node;
  }

  generateDOMNode() {
    const node = document.createElement('span');
    node.className = 'qti-interaction';
    node.setAttribute('question-type', inlineChoiceInteraction.IDENTIFIER);
    node.appendChild(this.generateSelectNode());

    return node;
  }
}

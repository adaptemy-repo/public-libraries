const CHECKBOX = 'checkbox';
const RADIO = 'radio';

export default class choiceInteraction {
  static IDENTIFIER = 'choiceInteraction';

  constructor(node, answers) {
    this.node = node;

    this.shuffle = node.getAttribute('shuffle') === 'true';
    this.name = node.getAttribute('responseIdentifier');
    this.multiple = Number(node.getAttribute('maxChoices')) > 1;
    this.answer = answers[this.name];
  }

  getOptions() {
    return this.node.getElementsByTagName('simpleChoice');
  }

  getPrompt() {
    return this.node.getElementsByTagName('prompt')[0];
  }

  generatePrompt(node) {
    const prompt = document.createElement('h5');
    prompt.className = 'prompt';
    prompt.textContent = node.textContent;

    return prompt;
  }

  getValue(id) {
    const element = document.getElementById(id);
    return element[element.selectedIndex].value;
  }

  get type() {
    return this.multiple ? CHECKBOX : RADIO;
  }
  
  get className() {
    return this.type === RADIO ? 'rf-fancy-radio-buttons' : 'rf-fancy-checkboxes';
  }

  generateOption(node) {
    const container = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const choice = document.createElement('span');
    const identifier = node.getAttribute('identifier');
    
    choice.innerHTML = node.innerHTML;
    container.className = 'margin-bottom';

    // input attributes
    input.setAttribute('type', this.type);
    input.setAttribute('name', this.name);
    input.setAttribute('value', identifier);
    input.setAttribute('id', identifier);
    
    // label attributes
    label.setAttribute('for', identifier);
    label.appendChild(choice);

    container.appendChild(input);
    container.appendChild(label);

    return container;
  }

  generateDOMNode() {
    const options = this.getOptions();
    const prompt = this.getPrompt();

    const container = document.createElement('div');
    container.setAttribute('question-type', choiceInteraction.IDENTIFIER);
    container.className = 'qti-choice-combo ' + this.className;

    if(prompt) {
      container.appendChild(this.generatePrompt(prompt));
    }

    for(let i = 0; i < options.length; i++) {
      container.appendChild(this.generateOption(options[i]));
    }

    return container;
  }
}

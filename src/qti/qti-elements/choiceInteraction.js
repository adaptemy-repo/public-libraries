import { sortArrayRandomly } from '../../helpers/pseudo-rng';

const CHECKBOX = 'checkbox';
const RADIO = 'radio';

export default class choiceInteraction {
  static IDENTIFIER = 'choiceInteraction';
  static RADIO = RADIO;
  static CHECKBOX = CHECKBOX;

  constructor(node, answers, seed) {
    this.node = node;

    this.containsImages = this.isContainingImages(node);
    this.shuffle = node.getAttribute('shuffle') === 'true';
    this.seed = seed;
    this.name = node.getAttribute('responseIdentifier');
    this.multiple = Number(node.getAttribute('maxChoices')) > 1;
    this.answer = answers[this.name].value;
  }

  getOptions() {
    const options = Array.prototype.slice.call(
      this.node.getElementsByTagName('simpleChoice')
    );
    
    return this.seed ? sortArrayRandomly(this.seed, options) : options;
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
    const checkboxLabel = document.createElement('label');
    const input = document.createElement('input');
    const choice = document.createElement('span');
    const accessibilitySpan = document.createElement('span');
    const identifier = node.getAttribute('identifier');
    
    choice.innerHTML = node.innerHTML || new XMLSerializer().serializeToString(node.firstChild);
    container.className = 'margin-bottom';

    // input attributes
    input.setAttribute('type', this.type);
    input.setAttribute('name', this.name);
    input.setAttribute('value', identifier);
    input.setAttribute('id', identifier);
    
    // label attributes
    checkboxLabel.setAttribute('for', identifier);
    label.setAttribute('for', identifier);
    label.appendChild(choice);

    container.appendChild(input);
    if(this.type !== RADIO) {
      container.appendChild(checkboxLabel);
    }
    container.appendChild(label);
    container.appendChild(accessibilitySpan);

    return container;
  }

  generateOptionImg(node) {
    const container = document.createElement('div');
    const containerSpan = document.createElement('span');
    const label = document.createElement('label');
    const labelBG = document.createElement('label');
    const input = document.createElement('input');
    const choice = document.createElement('span');
    const accessibilitySpan = document.createElement('span');
    const identifier = node.getAttribute('identifier');
    
    choice.innerHTML = node.innerHTML || new XMLSerializer().serializeToString(node.firstChild);
    container.className = 'margin-bottom';
    containerSpan.className = 'image-container';
    labelBG.className = 'image-bg';

    // input attributes
    input.setAttribute('type', this.type);
    input.setAttribute('name', this.name);
    input.setAttribute('value', identifier);
    input.setAttribute('id', identifier);
    
    // label attributes
    label.setAttribute('for', identifier);
    labelBG.setAttribute('for', identifier);
    label.appendChild(choice);

    container.appendChild(containerSpan);
    containerSpan.appendChild(input);
    containerSpan.appendChild(label);
    containerSpan.appendChild(labelBG);
    containerSpan.appendChild(accessibilitySpan);

    return container;
  }

  isContainingImages(node) {
    try{
      var result = node.innerHTML.indexOf('<img') !== -1;
      return result;
    }
    catch(e){
      return false;
    }
  }

  generateDOMNode() {
    const options = this.getOptions();
    const prompt = this.getPrompt();

    const container = document.createElement('div');
    container.setAttribute('question-type', choiceInteraction.IDENTIFIER);
    container.setAttribute('interaction-type', this.type);
    container.setAttribute('identifier', this.name);
    
    const optionalImgClass = this.containsImages ? ' with-image' : '';
    container.className = 'qti-interaction qti-choice-combo ' + this.className + optionalImgClass;

    if(prompt) {
      container.appendChild(this.generatePrompt(prompt));
    }

    for(let i = 0; i < options.length; i++) {
      if (this.containsImages && this.type === RADIO){
        container.appendChild(this.generateOptionImg(options[i]));
      }
      else{
        container.appendChild(this.generateOption(options[i]));  
      }
      
    }

    return container;
  }
}

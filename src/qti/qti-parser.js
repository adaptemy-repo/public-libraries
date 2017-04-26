import * as CONVERTABLE_ELEMENTS from './qti-elements';

const XML_MIME_TYPE = 'application/xhtml+xml';
const XML_ARTEFACTS = [
    /mml:/g,
    /\n[ ]*/g // remove needless whitespace (affects parsing)
  ];

const ITEM_IDENTIFIER = 'assessmentItem';
const BODY_IDENTIFIER = 'itemBody';
const BODY_IDENTIFIER_BLOCK = 'itemInteractionBody';
const FEEDBACK_IDENTIFIER = 'feedbackBlock';
const ANSWER_IDENTIFIER = 'responseDeclaration';

class QTIParser {
  constructor() {
    if(!window || !window.DOMParser) {
      throw 'DOMParser is not supported by this browser, please upgrade';
    }

    if(!window || !window.XMLSerializer) {
      throw 'XMLSerializer is not supported by this browser, please upgrade';
    }

    this.xmlParser = new DOMParser();    
  }
  
  escapeXMLString(string) {
    XML_ARTEFACTS.forEach(artefact => {
      string = string.replace(artefact, '');
    });

    return string;
  }
  
  parseXML(xml) {
    return this.xmlParser.parseFromString(xml, XML_MIME_TYPE);
  }
  
  convertStringToQuestions(string) {
    string = this.escapeXMLString(string);
    const xml = this.parseXML(string);
    
    const nodes = xml.getElementsByTagName(ITEM_IDENTIFIER);
    const questions = [];
    
    for(let i = 0; i < nodes.length; i++) {
      questions.push(nodes[i]);
    }
    
    return questions;
  }
  
  convertQuestionToHTML(questionNode) {
    let body = questionNode.getElementsByTagName(BODY_IDENTIFIER)[0] ||
      questionNode.getElementsByTagName(BODY_IDENTIFIER_BLOCK)[0];
      
    if(!body) {
      throw 'Question.' + BODY_IDENTIFIER + ' was not suppied by XML';
    }

    const answers = this.getAnswer(questionNode);
    body = this.replaceConvertableElements(body, answers);

    return this.extractHTML(body);
  }
  
  replaceConvertableElements(node, answers) {
    const clone = node.cloneNode(true);
    
    Object.keys(CONVERTABLE_ELEMENTS).forEach(function(key) {
      let convertable;
      const ConvertableElement = CONVERTABLE_ELEMENTS[key];
      const items = clone.getElementsByTagName(ConvertableElement.IDENTIFIER);
      
      // empty stack from the top, items.length decreases with every iteration
      while(items.length > 0) {
        convertable = new ConvertableElement(items[0], answers);
        items[0].parentNode.replaceChild(convertable.generateDOMNode(), items[0]);
      }
    });
    
    return clone;
  }
  
  extractHTML(node) {
    const clone = node.cloneNode(true);
    const container = document.createElement('div');

    while(clone.childNodes.length > 0) {
      container.appendChild(clone.childNodes[0]);
    }

    return container.innerHTML;
  }
  
  getAnswer(questionNode, humanReadable = false) {
    const nodes = questionNode.getElementsByTagName(ANSWER_IDENTIFIER);
    let key, value, answer = {};
    
    for(let i = 0; i < nodes.length; i++) {
      key = nodes[i].getAttribute('identifier');
      value = this.extractAnswerValue(nodes[i], questionNode, humanReadable);
      answer[key] = value;
    }
    
    return answer;
  }

  getAnswerArray(questionNode, humanReadable = false) {
    const answers = this.getAnswer(questionNode, humanReadable);
    
    return Object.keys(answers).map(identifier => {
      let value = answers[identifier];
      
      if(!Array.isArray(value)) {
        value = [value];
      }
      
      return { identifier, value };
    });
  }
  
  extractAnswerValue(answerNode, questionNode, humanReadable = false) {
    const nodes = answerNode.getElementsByTagName('value');
    let node, value;
    
    // no answer, this is probably an authoring error
    if (nodes.length === 0){
      value = 'meerkat';
    }
    // single answer, most questions are in here
    else if (nodes.length === 1){
      node = nodes[0];
      value = this.extractAnswerValueFromNode(node, questionNode, humanReadable);
    }
    // multiple answers
    else {
      value = [];
      for(let i = 0; i < nodes.length; i++) {
        value.push(
          this.extractAnswerValueFromNode(nodes[i], questionNode, humanReadable)
        )
      }
    }

    return value;
  }
  
  extractHumanReadableChoice(questionNode, identifier) {
    const node = questionNode.querySelector(`[identifier="${identifier}"]`);
    return this.extractHTML(node);
  }
  
  extractAnswerValueFromNode(node, questionNode, humanReadable) {
    let value;
    
    if(node.attributes.hasOwnProperty('choiceIdentifier')) {
      const identifier = node.getAttribute('choiceIdentifier');
      value = humanReadable ?
        this.extractHumanReadableChoice(questionNode, identifier) :
        identifier;
    }
    else {
      value = this.extractHTML(node);
    }
    
    return value;
  }
  
  getSolution(questionNode) {
    const nodes = questionNode.getElementsByTagName(FEEDBACK_IDENTIFIER);
    const solutionNode = this.findNodeByAttributeValue('identifier', 'SOLUTION', nodes);
    
    return this.extractHTML(solutionNode);
  }
  
  getHint(questionNode) {
    const nodes = questionNode.getElementsByTagName(FEEDBACK_IDENTIFIER);
    const solutionNode = this.findNodeByAttributeValue('identifier', 'HINT', nodes);
    
    if(solutionNode) {
      return this.extractHTML(solutionNode);  
    }
  }
  
  findByAttribute(attribute, value, node) {
    const nodes = node.getElementsByTagName('*');
    return this.findNodeByAttributeValue(attribute, value, nodes);
  }
  
  findNodeByAttributeValue(attribute, value, nodes) {
    for(let i = 0; i < nodes.length; i++) {
      if(nodes[i].getAttribute(attribute) === value) {
        return nodes[i];
      }
    }
  }
}

const parser = new QTIParser();
export default parser;

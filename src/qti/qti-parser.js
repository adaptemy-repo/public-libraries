import * as CONVERTABLE_ELEMENTS from './qti-elements';
import { extractHTML } from '../helpers/extract-html'; 

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
  
  convertQuestionToHTML(questionNode, seed) {
    let body = questionNode.getElementsByTagName(BODY_IDENTIFIER)[0] ||
      questionNode.getElementsByTagName(BODY_IDENTIFIER_BLOCK)[0];
      
    if(!body) {
      throw 'Question.' + BODY_IDENTIFIER + ' was not suppied by XML';
    }

    const answers = this.getAnswer(questionNode);
    body = this.replaceConvertableElements(body, answers, seed);

    return this.extractHTML(body);
  }
  
  replaceConvertableElements(node, answers, seed) {
    const clone = node.cloneNode(true);
    
    Object.keys(CONVERTABLE_ELEMENTS).forEach(function(key) {
      let convertable;
      const ConvertableElement = CONVERTABLE_ELEMENTS[key];
      const items = clone.getElementsByTagName(ConvertableElement.IDENTIFIER);
      
      // empty stack from the top, items.length decreases with every iteration
      while(items.length > 0) {
        convertable = new ConvertableElement(items[0], answers, seed);
        items[0].parentNode.replaceChild(convertable.generateDOMNode(), items[0]);
      }
    });
    
    return clone;
  }
  
  extractHTML(node) {
    return extractHTML(node);
  }
  
  getAnswer(questionNode, humanReadable = false) {
    const nodes = questionNode.getElementsByTagName(ANSWER_IDENTIFIER);
    let answer = {};
    for(let i = 0; i < nodes.length; i++) {
      let key = nodes[i].getAttribute('identifier');
      let comparison = nodes[i].getAttribute('comparison') || 'default';
      answer[key] = {
        comparison,
        value: this.extractAnswerValue(nodes[i], questionNode, humanReadable),
        anyOrder: nodes[i].getAttribute('any-order') === 'true',
        containsAlternatives: this.containsAlternatives(nodes[i])
      };
    }
    return answer;
  }

  containsAlternatives(qnNode){
    return qnNode.getElementsByTagName('mapping').length >= 1;
  }

  getAnswerArray(questionNode, humanReadable = false) {
    const answers = this.getAnswer(questionNode, humanReadable);
    return Object.keys(answers).map(identifier => {
      let value = answers[identifier].value;
      let containsAlternatives = answers[identifier].containsAlternatives;
      if(!Array.isArray(value)) {
        value = [value];
      }
      
      return {
        identifier,
        value,
        comparison: answers[identifier].comparison,
        containsAlternatives,
        anyOrder: answers[identifier].anyOrder
      };
    });
  }
  
  extractAnswerValue(answerNode, questionNode, humanReadable = false) {
    const valueTags = answerNode.getElementsByTagName('value');
    var values = [];
    
    if(!valueTags.length) {
      values.push('meerkat');
    }
    // multiple answers
    else {
      const mapEntries = answerNode.getElementsByTagName('mapEntry');
      let nodes = Array.prototype.slice.call(valueTags);
      nodes = nodes.concat(Array.prototype.slice.call(mapEntries));
      values = nodes.map(node => {
        return this.extractAnswerValueFromNode(
          node,
          questionNode,
          humanReadable
        );
      })
      // filter uniques
      .filter((a, index, arr) => arr.indexOf(a) === index);
    }
    return values;
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
    // <mapping>
    //  <mapEntry makKEy="alternate value"/>
    //  <mapEntry makKEy="alternate value2"/>
    // </mapping>
    else if(node.attributes.hasOwnProperty('mapKey')) {
      value = node.attributes.mapKey;
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

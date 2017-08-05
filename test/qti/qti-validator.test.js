import { QTIParser, QTIValidator, QTIPopulator } from '../../';
import caseSensitiveXmlMock from 'raw-loader!../mocks/caseSensitive.xml';

const caseSensitiveAnswer = {
  identifier: 'test', answers: ['Dublin']
};

const caseInsensitiveAnswer = {
  identifier: 'test', answers: ['dublin']
};

const caseSensitiveSolutions = [
  { identifier: 'test', value: ['Dublin'], caseSensitive: true }
];
const caseInsensitiveSolutions = [
  { identifier: 'test', value: ['Dublin'], caseSensitive: false }
];

describe('QTIValidator', () => {
  let body, questions;

  beforeEach('generate body HTML from XML', () => {
    questions = QTIParser.convertStringToQuestions(caseSensitiveXmlMock);
    body = document.createElement('body');
    
    questions.forEach((questionNode) => {
      body.innerHTML += QTIParser.convertQuestionToHTML(questionNode);
    });
  });
  
  describe('QTIValidator.isValidUserAnswer()', () => {
    it('should validate case-insensitive questions properly', () => {
      expect(QTIValidator.isValidUserAnswer(caseInsensitiveSolutions, caseInsensitiveAnswer)).to.be.true;
      expect(QTIValidator.isValidUserAnswer(caseInsensitiveSolutions, caseSensitiveAnswer)).to.be.true;
    });
    
    it('should validate case-sensitive questions properly', () => {
      expect(QTIValidator.isValidUserAnswer(caseSensitiveSolutions, caseInsensitiveAnswer)).to.be.false;
      expect(QTIValidator.isValidUserAnswer(caseSensitiveSolutions, caseSensitiveAnswer)).to.be.true;
    });
  });
});

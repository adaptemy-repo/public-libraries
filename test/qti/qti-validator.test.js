import { QTIParser, QTIValidator, QTIPopulator } from '../../';
import caseSensitiveXmlMock from 'raw-loader!../mocks/caseSensitive.xml';
import rangeAnswerXmlMock from 'raw-loader!../mocks/rangeAnswer.xml';

const caseSensitiveAnswer = {
  identifier: 'test', answers: ['Dublin']
};

const caseInsensitiveAnswer = {
  identifier: 'test', answers: ['dublin']
};

const emptyAnswers = { identifier: 'test', answers: [] };

const caseSensitiveSolutions = [
  { identifier: 'test', value: ['Dublin'], caseSensitive: true }
];
const caseInsensitiveSolutions = [
  { identifier: 'test', value: ['Dublin'], caseSensitive: false }
];
const containsAlternativesSolutions = [
  { identifier: 'test', value: ['one', 'two'], containsAlternatives: true }
];

const rangeSolution = [
  { identifier: 'test', value: [11, 100], isRange: true }
];

const invalidRangeSolution = [
  { identifier: 'test', value: [100, 11], isRange: true }
];

describe('QTIValidator', () => {
  let body, questions;
  
  describe('QTIValidator.isValidUserAnswer()', () => {
    describe('when validating case sensitivity sensitivity', () => {
      beforeEach('generate body HTML from case-sensitive XML', () => {
        questions = QTIParser.convertStringToQuestions(caseSensitiveXmlMock);
        body = document.createElement('body');
        
        questions.forEach((questionNode) => {
          body.innerHTML += QTIParser.convertQuestionToHTML(questionNode);
        });
      });

      it('should validate case-insensitive questions properly', () => {
        expect(QTIValidator.isValidUserAnswer(caseInsensitiveSolutions, caseInsensitiveAnswer)).to.be.true;
        expect(QTIValidator.isValidUserAnswer(caseInsensitiveSolutions, caseSensitiveAnswer)).to.be.true;
      });
      
      it('should validate case-sensitive questions properly', () => {
        expect(QTIValidator.isValidUserAnswer(caseSensitiveSolutions, caseInsensitiveAnswer)).to.be.false;
        expect(QTIValidator.isValidUserAnswer(caseSensitiveSolutions, caseSensitiveAnswer)).to.be.true;
      });
      
      it('should invalidate answers with no values', () => {
        expect(QTIValidator.isValidUserAnswer(caseSensitiveSolutions, emptyAnswers)).to.be.false;
      });
      
      it('should invalidate containsAlternatives answers with no values', () => {
        expect(QTIValidator.isValidUserAnswer(containsAlternativesSolutions, emptyAnswers)).to.be.false;
      });
    });
    
    describe('when validating range values', () => {
      const answer = val => ({ identifier: 'test', answers: [val] });

      beforeEach('generate body HTML from range XML', () => {
        questions = QTIParser.convertStringToQuestions(rangeAnswerXmlMock);
        body = document.createElement('body');
        
        questions.forEach(questionNode => {
          body.innerHTML += QTIParser.convertQuestionToHTML(questionNode);
        });
      });

      it('should invalidate values outside of the range', () => {
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(0))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(1))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(10.9999))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(100.0001))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(105))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer('a'))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer([]))).to.be.false;
      });

      it('should validate values inside the range', () => {
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(15))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(20))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(25))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(rangeSolution, answer(30))).to.be.true;
      });
    });
  
    describe('when validating against an unsorted solution range', () => {
      const answer = val => ({ identifier: 'test', answers: [val] });

      beforeEach('generate body HTML from range XML', () => {
        questions = QTIParser.convertStringToQuestions(rangeAnswerXmlMock);
        body = document.createElement('body');
        
        questions.forEach(questionNode => {
          body.innerHTML += QTIParser.convertQuestionToHTML(questionNode);
        });
      });

      it('should invalidate properly values outside of the range', () => {
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(0))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(1))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(10.9999))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(100.0001))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(105))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer('a'))).to.be.false;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer([]))).to.be.false;
      });

      it('should validate properly values inside the range', () => {
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(11))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(20))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(25))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(30))).to.be.true;
        expect(QTIValidator.isValidUserAnswer(invalidRangeSolution, answer(100))).to.be.true;
      });
    });

  });
});

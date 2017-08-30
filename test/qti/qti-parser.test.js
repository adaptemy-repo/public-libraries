import { QTIParser, QTIValidator, QTIPopulator } from '../../';
import caseSensitiveXmlMock from 'raw-loader!../mocks/caseSensitive.xml';
import rangeAnswerXmlMock from 'raw-loader!../mocks/rangeAnswer.xml';

describe('QTIParser', () => {
  let body, questions;
  
  describe('.extractRangeValue(questionNode)', () => {
    it('should be undefined for questions without specified range', () => {
      const noRange = QTIParser.convertStringToQuestions(caseSensitiveXmlMock);
      noRange.forEach(question => {
        const range = QTIParser.extractRangeValue(question);
        expect(range).to.be.undefined;
      });
    });
    
    it('should return an array with 2 values', () => {
      const withRange = QTIParser.convertStringToQuestions(rangeAnswerXmlMock);
      withRange.forEach(question => {
        const range = QTIParser.extractRangeValue(question);
        expect(Array.isArray(range)).to.be.true;
        expect(range.length).to.equal(2);
      });
    });
  });

  describe('.convertStringToQuestions(xmlString)', () => {    
    describe('.getAnswer() => .convertStringToQuestions() (DI validation)', () => {
      describe('caseSensitive questions', () => {
        const allowedComparisonTypes = ['case-sensitive', 'default'];
        
        beforeEach('convert case sensitive XML to questions', () => {
          questions = QTIParser.convertStringToQuestions(caseSensitiveXmlMock);
        });
        
        it('caseSensitive questions should export valid properties comparison and range', () => {
          questions.forEach(question => {
            const answers = QTIParser.getAnswer(question);
            Object.keys(answers).forEach(id => {
              expect(allowedComparisonTypes.indexOf(answers[id].comparison)).not.to.equal(-1);
              expect(answers[id].isRange).to.be.false;
            });
          });
        });
      });

      describe('rangeAnswer questions', () => {
        questions = QTIParser.convertStringToQuestions(rangeAnswerXmlMock);
        
        questions.forEach(question => {
          const answers = QTIParser.getAnswer(question);
          Object.keys(answers).forEach(id => {
            const answer = answers[id];

            it('should provide valid range state and value', () => {
              expect(answer.isRange).to.be.true;
              expect(Array.isArray(answer.value)).to.be.true;
              expect(answer.value.length).to.equal(2);
            });
            
            it('provided values should always be numbers', () => {
              expect(Number.isFinite(parseFloat(answer.value[0]))).to.be.true;
              expect(Number.isFinite(parseFloat(answer.value[1]))).to.be.true;
            });
            
            it('range should be extracted properly', () => {
              const answerNode = QTIParser.findAnswerNode(question, id);
              const range = QTIParser.extractRangeValue(answerNode);

              expect(answer.value[0]).to.equal(range[0]);
              expect(answer.value[1]).to.equal(range[1]);
            });
            
            it('values should always be sorted lesser/greater, even when there is an error', () => {
              const [min, max] = answer.value;
              expect(min <= max).to.be.true;
            });
          });
        });
      });
    });
  });
});

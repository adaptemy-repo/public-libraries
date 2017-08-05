import { QTIParser, QTIValidator, QTIPopulator } from '../../';
import caseSensitiveXmlMock from 'raw-loader!../mocks/caseSensitive.xml';

const caseSensitiveIdentifier = '7132aa5d-a68e-4a3a-817f-d471b9723b96';
const caseInsensitiveIdentifier = '7132aa5d-a68e-4a3a-817f-d471b97ffa1d';

describe('QTIParser', () => {
  let body, questions;

  beforeEach('convert XML to questions', () => {
    questions = QTIParser.convertStringToQuestions(caseSensitiveXmlMock);
  });
  
  describe('QTIParser.getAnswer()', () => {
    it('caseSensitive questions should export valid comparison', () => {
      questions.forEach(question => {
        const answer = QTIParser.getAnswer(question);
        if(answer.hasOwnProperty(caseSensitiveIdentifier)) {
          expect(answer[caseSensitiveIdentifier].comparison).to.equal('case-sensitive');
        }
        
        if(answer.hasOwnProperty(caseInsensitiveIdentifier)) {
          expect(answer[caseInsensitiveIdentifier].comparison).to.equal('default');
        }
      });
    });
  });
});

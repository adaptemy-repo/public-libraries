import { QTIParser, QTIPopulator } from '../../';
import DocumentMock from '../mocks/document.mock.json';

const textMockIdentifier = '2157296d-6410-40ef-c128-e4fe8ff0a81f';
const textMockValue = 'very test mock';

const selectMockIdentifier = 'f6d637c5-3e83-4326-d6c7-e0f8ae9b478f';
const selectMockValue = 'id-796035d4-aa73-4f0e-d1c6-b51a89a5f2ee';
const selectMockValueIndex = 2;

const radioMockIdentifier = 'a2758492-37f1-450b-c7cd-d96be29bd89b';
const radioMockValue = 'id-3676f216-b4ff-4695-b7e1-c1cded57ade9';

const checkboxMockIdentifier = '334fd683-f465-45fc-932a-c18051439e57';
const checkboxMockValues = [
  '36c99803-69aa-4463-eae5-38be48a97fde',
  'id-b021adaf-0e01-4fdd-a26f-7de0d4b9f68d'
];

const mockPopulateData = [
  { identifier: textMockIdentifier, answers: [textMockValue] },
  { identifier: selectMockIdentifier, answers: [selectMockValue] },
  { identifier: radioMockIdentifier, answers: [radioMockValue] },
  { identifier: checkboxMockIdentifier, answers: checkboxMockValues },
];

// @TODO add code coveragenpm 
describe('QTIPopulator', () => {
  let body, questions, userAnswers;

  beforeEach('populate questions', () => {
    questions = QTIParser.convertStringToQuestions(DocumentMock.content);
    body = document.createElement('body');
    
    questions.forEach((questionNode) => {
      body.innerHTML += QTIParser.convertQuestionToHTML(questionNode);
    });
  });

  describe('QTIPopulator.getAnswersForLogging()', () => {
    beforeEach('extract user answers', () => {
      userAnswers = QTIPopulator.getAnswersForLogging(body);
    });
    
    it('should have empty answers by default', () => {
      userAnswers.forEach(({ answers }) => {
        expect(Array.isArray(answers)).to.be.true;
        expect(answers.length).to.equal(0);
      });
    });
    
    describe('When a TEXT field is manually populated', () => {
      let textInput;
      
      beforeEach('populate text field', (done) => {
        textInput = body.querySelector(`[identifier="${textMockIdentifier}"]`);
        textInput.value = textMockValue;
        setTimeout(done);
      });
            
      it('should extract the populated value properly', () => {
        userAnswers = QTIPopulator.getAnswersForLogging(body);
        const userAnswer = userAnswers.find(answer => {
          return answer.identifier === textMockIdentifier
        });
        
        expect(Array.isArray(userAnswer.answers)).to.be.true;
        expect(userAnswer.answers.length).to.equal(1);
        expect(userAnswer.answers[0]).to.equal(textMockValue);
      });
    });
    
    describe('When a SELECT question is manually populated', () => {
      let select;
      
      beforeEach('populate select field', (done) => {
        select = body.querySelector(`[id="${selectMockIdentifier}"]`);
        select.selectedIndex = selectMockValueIndex;
        setTimeout(done);
      });
            
      it('should extract the populated value properly', () => {
        userAnswers = QTIPopulator.getAnswersForLogging(body);
        const userAnswer = userAnswers.find(answer => {
          return answer.identifier === selectMockIdentifier
        });

        expect(Array.isArray(userAnswer.answers)).to.be.true;
        expect(userAnswer.answers.length).to.equal(1);
        expect(userAnswer.answers[0]).to.equal(selectMockValue);
      });
    });
    
    
    describe('When a RADIO question is manually populated', () => {
      let radio;
      
      beforeEach('select radio button', (done) => {
        radio = body.querySelector(`[id="${radioMockValue}"]`);
        radio.checked = true;
        setTimeout(done);
      });
            
      it('should extract the populated value properly', () => {
        userAnswers = QTIPopulator.getAnswersForLogging(body);
        const userAnswer = userAnswers.find(answer => {
          return answer.identifier === radioMockIdentifier
        });

        expect(Array.isArray(userAnswer.answers)).to.be.true;
        expect(userAnswer.answers.length).to.equal(1);
        expect(userAnswer.answers[0]).to.equal(radioMockValue);
      });
    });
    
    describe('When a CHECKBOX question is manually populated', () => {
      let checkbox1, checkbox2;
      
      beforeEach('select checkboxes', (done) => {
        checkbox1 = body.querySelector(`[id="${checkboxMockValues[0]}"]`);
        checkbox2 = body.querySelector(`[id="${checkboxMockValues[1]}"]`);
        checkbox1.checked = true;
        checkbox2.checked = true;
        
        setTimeout(done);
      });
            
      it('should extract the populated value properly', () => {
        userAnswers = QTIPopulator.getAnswersForLogging(body);
        const userAnswer = userAnswers.find(answer => {
          return answer.identifier === checkboxMockIdentifier
        });

        expect(Array.isArray(userAnswer.answers)).to.be.true;
        expect(userAnswer.answers.length).to.equal(checkboxMockValues.length);

        checkboxMockValues.forEach(value => {
          expect(userAnswer.answers.indexOf(value)).to.not.equal(-1);
        });
      });
    });
  });

  describe('QTIPopulator.restoreUserAnswers()', () => {
    beforeEach('populate body', done => {
      QTIPopulator.restoreUserAnswers(body, mockPopulateData);
      setTimeout(done);
    });
    
    beforeEach('getAnswers', () => {
      userAnswers = QTIPopulator.getAnswersForLogging(body);
    });
    
    it('should populate data correctly', () => {
      mockPopulateData.forEach(mock => {
        const extractedAnswer = userAnswers.find(answer => answer.identifier === mock.identifier);
        mock.answers.forEach(value => {
          expect(mock.answers.indexOf(value)).to.not.equal(-1);
        });
      });
    });
  });
});

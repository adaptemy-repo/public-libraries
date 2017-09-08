import { QTIGenerator } from '../../';

let generator;
const answersMock = [{
  "identifier": "ebbc53d0-30e0-4719-9c7a-5e5638547f03",
  "value": ["id-431c8ec8-4906-4166-8e91-a15b622a2630"],
  "anyOrder": false,
  "comparison": 'algebraic'
}];

describe('QTIGenerator', () => {
  beforeEach('create a new QTI generator', () => {
    generator = new QTIGenerator();
  });
  
  describe('by default', () => {
    it('QTIGenerator.answers should be an empty object', () => {
      expect(generator.answers).to.be.an('object').and.be.empty;
    });
  });
  
  describe('QTIGenerator.setAnswers(answers)', () => {
    beforeEach('set answers', () => {
      generator.setAnswers(answersMock);
    });
    
    it('should set QTIGenerator.answers grouped by identifier', () => {
      expect(generator.answers).to.be.an('object').and.not.be.empty;
      answersMock.forEach(mock => {
        expect(generator.answers[mock.identifier]).to.be.an('array');
        expect(generator.answers[mock.identifier].indexOf(mock)).to.not.equal(-1);
      });
    });
  });
  
  describe('QTIGenerator.toXML()', () => {
    let xml;
    
    beforeEach('set answers and generate XML', () => {
      generator.setAnswers(answersMock);
      xml = generator.toXML();
    });
    
    it('should produce valid XML content', () => {
      const a = answersMock[0];
      const result = 
        `<responsedeclaration identifier="${a.identifier}" comparison="${a.comparison}">` + 
        `<correctresponse>`+
        `<value>${a.value[0]}</value>`+
        `</correctresponse></responsedeclaration>`;
    
      expect(xml).to.equal(result);
    });
  });
});

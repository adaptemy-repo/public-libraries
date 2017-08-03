import QTIValidator from './qti-validator';

export default class QTIPopulator {
  getAnswersForLogging(inputNode) {
    return QTIValidator
      .getAllUserAnswers(inputNode)
      .map(({ identifier, answers }) => { identifier, answers });
  }
}

import textEntryInteraction from './textEntryInteraction';

export default class extendedTextInteraction extends textEntryInteraction {
  static IDENTIFIER = 'extendedTextInteraction';

  constructor(node, answers, seed) {
    super(node, answers, seed);
    this.className = 'qti-interaction qti-input extended';
    this.questionType = extendedTextInteraction.IDENTIFIER;
  }
}

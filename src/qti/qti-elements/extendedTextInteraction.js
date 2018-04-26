import textEntryInteraction from './textEntryInteraction';

export default class extendedTextInteraction extends textEntryInteraction {
  static IDENTIFIER = 'extendedTextInteraction';

  constructor(node, answers, seed) {
    super(node, answers, seed);
    this.className = 'rf-fancy-input-boxes qti-interaction qti-input extended';
    this.questionType = extendedTextInteraction.IDENTIFIER;
  }
}

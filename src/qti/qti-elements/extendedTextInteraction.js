import textEntryInteraction from './textEntryInteraction';

export default class extendedTextInteraction extends textEntryInteraction {
  static IDENTIFIER = 'extendedTextInteraction';

  constructor(node, answers) {
    super(node, answers);
    this.className = 'qti-interaction qti-input extended';
    this.questionType = extendedTextInteraction.IDENTIFIER;
  }
}

export default class textEntryInteraction {
  static IDENTIFIER = "textEntryInteraction";

  constructor(node, answers, seed) {
    this.node = node;
    this.className =
      "rf-fancy-input-boxes qti-interaction qti-input " + node.tagName;

    this.maxLength = node.getAttribute("expectedLength");
    this.name = node.getAttribute("responseIdentifier");
    this.questionType = textEntryInteraction.IDENTIFIER;
    this.answer = answers[this.name].value;
    this.comparison = answers[this.name].comparison;
  }

  get answerTypeAttribute() {
    const isNumber = isFinite(this.answer);
    const integer = parseInt(this.answer);
    const decimal = parseFloat(this.answer);

    if (isNumber && integer === decimal) {
      return integer >= 0 ? "qti-natural" : "qti-integer";
    } else if (isNumber && integer !== decimal) {
      return "qti-real";
    } else {
      return "qti-string";
    }
  }

  get answerLength() {
    return String(this.answer[0]).length;
  }

  generateDOMNode() {
    var nodetype = this.comparison.includes("latex") ? "div" : "input";
    const input = document.createElement(nodetype);
    input.className = this.className;

    input.setAttribute("identifier", this.name);
    input.setAttribute("id", this.name);
    input.setAttribute("type", "text");
    input.setAttribute("answer-length", this.answerLength);
    input.setAttribute("question-type", this.questionType);
    input.setAttribute("comparison", this.comparison);
    input.setAttribute(this.answerTypeAttribute, true);

    return input;
  }
}

import QTIValidator from "./qti-validator";
import * as QTIElements from "./qti-elements";

class QTIPopulator {
  getAnswersForLogging(inputNode) {
    return QTIValidator.getAllUserAnswers(inputNode).map(
      ({ identifier, answers }) => ({ identifier, answers })
    );
  }

  restoreUserAnswers(inputNode, userAnswers) {
    userAnswers.forEach(answer => {
      let questionNode = inputNode;
      if (inputNode.getAttribute("identifier") !== answer.identifier) {
        questionNode = inputNode.querySelector(
          `[identifier="${answer.identifier}"]`
        );
      }

      this.populateInputNode(questionNode, answer);
    });
  }

  populateInputNode(questionNode, variation) {
    const questionType = questionNode.getAttribute("question-type");
    const { answers, identifier } = variation;

    switch (questionType) {
      case QTIElements.extendedTextInteraction.IDENTIFIER:
      case QTIElements.textEntryInteraction.IDENTIFIER:
        return (questionNode.value = answers[0]);

      case QTIElements.inlineChoiceInteraction.IDENTIFIER:
        const select = questionNode.getElementsByTagName("select")[0];

        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === answers[0]) {
            return (select.selectedIndex = i);
          }
        }
        return;

      case QTIElements.choiceInteraction.IDENTIFIER:
        const inputs = questionNode.getElementsByTagName("input");
        const values = [];

        for (let i = 0; i < inputs.length; i++) {
          if (answers.indexOf(inputs[i].id) !== -1) {
            inputs[i].checked = true;
          }
        }
        return;
    }

    throw "The provided questionNode did not contain a valid question-type";
  }
}

const service = new QTIPopulator();
export default service;

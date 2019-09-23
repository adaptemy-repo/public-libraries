import QTIParser from "../qti-parser";
import replaceVariables from "./replaceVariables";

export default function variabilizeNode(node, variation) {
  const xml = QTIParser.extractHTML(node);
  const assessmentItem = document.createElement("assessmentItem");
  assessmentItem.innerHTML = replaceVariables(xml, variation);

  return assessmentItem;
}

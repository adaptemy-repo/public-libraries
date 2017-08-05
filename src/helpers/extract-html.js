export function extractHTML(node) {
  if (!node){
    return '';
  }
  const clone = node.cloneNode(true);
  const container = document.createElement('div');

  while(clone.childNodes.length > 0) {
    container.appendChild(clone.childNodes[0]);
  }

  return container.innerHTML;
}

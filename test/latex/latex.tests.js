describe('Latex tests', () => {
  it('should be properly defined and namespaced', () => {
    var index = require('../../');
    expect(typeof index.latex.cleanupLatexExpression).to.equal('function');
    expect(typeof index.latex.compareLatexExpressions).to.equal('function');
    expect(typeof index.latex.latexToAlgebraExpression).to.equal('function');
  });
  it('should correctly evaluate a simple fraction', () => {
    var index = require('../../');
    expect(index.latex.compareLatexExpressions('\\frac{1}{2}','\\frac{1}{2}', false, false)).to.be.true;
  });
  it('should ignore case by default', () => {
    var index = require('../../');
    expect(index.latex.compareLatexExpressions('x+y','Y+X', true, false)).to.be.true;
  });
  it('should not ignore case when required', () => {
    var index = require('../../');
    expect(index.latex.compareLatexExpressions('x+y','Y+X', true, true)).to.be.false;
  });
  it('should correctly evaluate a power in a fraction', () => {
    var index = require('../../');
    expect(index.latex.compareLatexExpressions('\\frac{x^2}{x}','x', true, false)).to.be.true;
  });
  it('should correctly evaluate a square root', () => {
    var index = require('../../');
    expect(index.latex.compareLatexExpressions('\\sqrt{x^2}','x', true, false)).to.be.true;
  });
});

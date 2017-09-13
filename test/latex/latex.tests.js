describe('Latex tests', () => {
  it('should be properly defined and namespaced', () => {
    var index = require('../../');
    expect(typeof index.latex.cleanupLatexExpression).to.equal('function');
    expect(typeof index.latex.compareLatexExpressions).to.equal('function');
    expect(typeof index.latex.latexToAlgebraExpression).to.equal('function');
  });
});

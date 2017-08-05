let context = require.context('./test', true, /\.test(s)?\.js/);
context.keys().forEach(context);

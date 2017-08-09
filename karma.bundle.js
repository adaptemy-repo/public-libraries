let context = require.context('./src', true, /\.test(s)?\.js/);
context.keys().forEach(context);

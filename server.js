const createApp = require('./src/app');
const config = require('./src/config/config');

const app = createApp();

app.listen(config.port, () => {
  console.log(`Virtual Event Management Platform listening on port ${config.port}`);
});

const express = require('express');
const { startElection } = require('./services/election');

// We will add routes here as we build them
// const checkRoute = require('./routes/check');
// const rulesRoute = require('./routes/rules');
// const metricsRoute = require('./routes/metrics');
// const demoRoute = require('./routes/demo');

const app = express();
app.use(express.json());

// app.use('/check', checkRoute);
// app.use('/rules', rulesRoute);
// app.use('/', metricsRoute);
// app.use('/demo', demoRoute);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node ${process.env.NODE_ID || 'local'} listening on port ${PORT}`);
    startElection();
});

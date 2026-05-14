const express = require('express');
const { startElection } = require('./services/election');

const checkRoute = require('./routes/check');
const rulesRoute = require('./routes/rules');
const metricsRoute = require('./routes/metrics');
const demoRoute = require('./routes/demo');
const dashboardRoute = require('./routes/dashboard');

const app = express();
app.use(express.json());

app.use('/check', checkRoute);
app.use('/rules', rulesRoute);
app.use('/', metricsRoute);
app.use('/demo', demoRoute);
app.use('/', dashboardRoute);

// Fallback for docker-compose missing {{.Task.Slot}}
if (!process.env.NODE_ID || process.env.NODE_ID === '{{.Task.Slot}}') {
    process.env.NODE_ID = 'node-' + Math.floor(Math.random() * 1000);
}

// Add a crash endpoint for Fault Tolerance & Leader Election Demo
app.post('/crash', (req, res) => {
    console.log('CRASH endpoint hit. Simulating node failure...');
    res.send('Crashing node...');
    setTimeout(() => process.exit(1), 100);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node ${process.env.NODE_ID} listening on port ${PORT}`);
    startElection();
});

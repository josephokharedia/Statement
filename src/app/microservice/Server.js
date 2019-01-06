const express = require('express');
const bodyParser = require('body-parser');
const txBci = require('../../app/microservice/bc/transactions/boundary/TransactionsBci');
const stmtBci = require('../../app/microservice/bc/statements/boundary/StatementsBci');
const instBci = require('./bc/institutions/boundary/InstitutionBci');
const catBci = require('../../app/microservice/bc/categories/boundary/CategoriesBci');
const draftBci = require('../../app/microservice/bc/draft/boundary/DraftsBci');
const healthBci = require('../../app/microservice/bc/health/boundary/HealthBci');
const formidableMiddleware = require('express-formidable');

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({limit: '200mb', extended: true})); // for parsing application/x-www-form-urlencoded

const port = process.env.APP_PORT || 3000;

app.listen(port, () => console.log(`Ekugcineni backend listening on port ${port}!`));

app.use('/', healthBci.router);
app.use('/api/transactions', txBci.router);
app.use('/api/statements', stmtBci.router);
app.use('/api/institutions', instBci.router);
app.use('/api/categories', catBci.router);
app.use('/api/draft', formidableMiddleware(), draftBci.router);

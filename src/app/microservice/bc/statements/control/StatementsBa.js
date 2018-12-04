/*
 * Statements Business adapter
 * Receives an instruction to get statements
 * Generates a mongodb aggregation query pipeline for Statements
 * Invokes Statements External Service interface to execute the pipeline
 */
const parse = require('csv-parse');
const es = require('event-stream');
const hash = require('object-hash');
const stmtEsi = require('../integration/StatementsEsi');
const event = require('../../../shared/EventUtil');
const getStatementsPipeline = require('./pipeline/GetStatementsPipeline');
const getStatementDetailsPipeline = require('./pipeline/GetStatementDetailsPipeline');
const {toObjectId} = require('../../../shared/Utils.js');
const FNBStatementTransformer = require('../control/transformers/FNBStatementTransformer');
const NedbankStatementTransformer = require('../control/transformers/NedbankStatementTransformer');

async function getStatements() {
    try {
        const pipeline = getStatementsPipeline();
        return stmtEsi.getStatements(pipeline);
    } catch (e) {
        throw e;
    }
}

async function getStatementDetails(statementId) {
    try {
        const pipeline = getStatementDetailsPipeline(toObjectId(statementId));
        return stmtEsi.getStatementDetails(pipeline);
    } catch (e) {
        throw e;
    }
}

async function createStatement(csv, institution) {
    try {
        const statementTransformer = getStatementTransformer(institution);
        if (!statementTransformer) {
            throw Error(`No Statement transformer for ${institution}`);
        }

        let createdStatement;
        const csvStatement = await transformCsvToStatement(statementTransformer, csv);
        const statements = await stmtEsi.getStatements([{
            $match: {
                $and: [
                    {accountNumber: csvStatement.accountNumber},
                    {statementNumber: csvStatement.statementNumber}]
            }
        }]);

        if (statements.length) {
            // Statement already exists in db
            console.log(`Statement already exists. Nothing to do here!`);
            createdStatement = statements[0];
        } else {
            createdStatement = await stmtEsi.createStatement(csvStatement);
        }

        event.raise('CreatedStatement', createdStatement);
        return createdStatement;

    } catch (e) {
        throw e;
    }
}

function getStatementTransformer(institution) {
    switch (institution) {
        case 'FNB':
            return new FNBStatementTransformer();
        case 'NEDBANK':
            return new NedbankStatementTransformer();
        default:
            return null;
    }
}

async function transformCsvToStatement(transformer, csv) {
    return new Promise((resolve) => {
        let statement = null;
        // setup the csv parser breakup a comma separated line into an array of values
        const csvParser = parse({relax_column_count: true, ltrim: true, rtrim: true});
        const innerStream = es.readArray([csv]) // read the csv into an event stream
            .pipe(es.split(/(\r?\n)/)) // break up the csv by new line
            .pipe(csvParser) // feed each line into the csv parser to get an array of values
            .pipe(transformer) // feed the line values into a statement transformer that will collate the values from
            // each line and spit out a statement when complete
            .pipe(es.map((_statement, callback) => {
                _statement.hashCode = hash(csv); // set id of statement as hashed value of the csv file
                _statement.raw = csv; // set raw of statement as the raw csv file
                statement = _statement;
                callback();
            }));
        innerStream.on('end', () => {
            if (statement == null) throw Error(`Failed to create statement`);
            resolve(statement);
        });
    });
}


module.exports = {getStatements, getStatementDetails, createStatement};
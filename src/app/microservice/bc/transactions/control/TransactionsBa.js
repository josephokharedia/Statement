/*
 * Transactions Business adapter
 * Receives an instruction to get transactions / search transactions
 * Generates a mongodb aggregation query pipeline for Transactions
 * Invokes Transactions External Service interface to execute the pipeline
 */
const parse = require('csv-parse');
const txEsi = require('../integration/TransactionsEsi');
const {escapeRegExp} = require('../../../shared/Utils.js');
const getTransactionsPipeline = require('./pipeline/GetTransactionsPipeline');
const searchTransactionsPipeline = require('./pipeline/SearchTransactionsPipeline');
const es = require("event-stream");
const FNBTransactionTransformer = require('./transformers/FNBTransactionTransformer');
const NedbankTransactionTransformer = require('./transformers/NedbankTransactionTransformer');
const ObjectId = require('mongodb').ObjectId;
const hash = require('object-hash');
const aggregateCategoriesForStatementPipeline = require('./pipeline/AggregateCategoriesForStatementPipeline');
const aggregateCategoriesForYearPipeline = require('./pipeline/AggregateCategoriesForYearPipeline');
const {toObjectId} = require('../../../shared/Utils');

async function getTransactions(queryOptions) {
    const userQueryOptions = generateUserQueryOptions(queryOptions);
    try {
        const pipeline = getTransactionsPipeline(userQueryOptions);
        const docs = await txEsi.getTransactions(pipeline);
        if (docs.length === 0) {
            return {count: 0, data: []};
        } else {
            return docs[0];
        }
    } catch (e) {
        throw e;
    }
}

async function searchTransactionDescription({q}) {
    if (!q) return [];
    const searchTerm = escapeRegExp(q);
    try {
        const pipeline = searchTransactionsPipeline(searchTerm);
        const docs = await txEsi.getTransactions(pipeline);
        if (docs.length === 0) {
            return [];
        } else {
            return docs.map(r => r.description);
        }
    } catch (e) {
        throw e;
    }
}

async function aggregateCategoriesForYear({year}) {
    const currentYear = new Date().getFullYear();
    const validYear = (yr) => /^\d{4}$/.test(yr); //&& parseInt(yr) >= 2000 && parseInt(yr) <= currentYear;
    year = validYear(year) ? parseInt(year) : currentYear;

    try {
        const pipeline = aggregateCategoriesForYearPipeline(year);
        return txEsi.getTransactions(pipeline);
    } catch (e) {
        throw e;
    }
}

async function aggregateCategoriesForStatement({statementId}) {
    if (!statementId) {
        throw Error(`StatementId cannot be null`);
    }
    try {
        const pipeline = aggregateCategoriesForStatementPipeline(toObjectId(statementId));
        const result = await txEsi.getTransactions(pipeline);
        if (result.length > 0) {
            return result[0].categories;
        } else {
            return [];
        }
    } catch (e) {
        throw e;
    }
}

async function createTransactionsFromStatement(statement) {
    const transformer = getTransactionTransformer(statement.institution);
    if (!transformer) {
        throw Error(`No Transaction transformer for institution ${statement.institution}`);
    }
    let transactions = await transformStatementToTransactions(transformer, statement);

    transactions = await removeDuplicateTransactions(transactions);
    if (transactions.length === 0) {
        return [];
    }

    const {ops: createdTransactions} = await txEsi.createTransactions(transactions);
    return createdTransactions;
}


async function updateTransactionsWithNewCategory(category) {
    return txEsi.updateTransactionsWithNewCategory(category);
}

async function updateTransactionsWithUpdatedCategory(category) {
    await txEsi.removeCategoriesFromTransactions(category._id);
    return txEsi.updateTransactionsWithNewCategory(category);
}

async function updateTransactionsWithDeletedCategory(categoryId) {
    return txEsi.removeCategoriesFromTransactions(toObjectId(categoryId));
}

function generateUserQueryOptions({search, pageSize, pageIndex, fromDate, toDate, sortField, sortDirection, category}) {
    const userQueryOptions = {};
    if (search) {
        userQueryOptions.search = escapeRegExp(search);
    }
    if (/^\d+$/.test(pageSize)) {
        userQueryOptions.pageSize = parseInt(pageSize);
    }
    if (/^\d+$/.test(pageIndex)) {
        userQueryOptions.pageIndex = parseInt(pageIndex);
    }
    if (/[0-9-\/]+/.test(fromDate)) {
        userQueryOptions.fromDate = new Date(fromDate);
    }
    if (/[0-9-\/]+/.test(toDate)) {
        userQueryOptions.toDate = new Date(toDate);
    }
    if (sortField) {
        userQueryOptions.sortField = escapeRegExp(sortField);
    }
    if (sortDirection === 'asc') {
        userQueryOptions.sortDirection = 1;
    }
    if (sortDirection === 'desc') {
        userQueryOptions.sortDirection = -1;
    }
    const categories = category;
    if (categories) {
        if (Array.isArray(categories)) {
            userQueryOptions.categories = categories.map(str => ObjectId(escapeRegExp(str)));
        } else {
            userQueryOptions.categories = [ObjectId(escapeRegExp(categories))];
        }
    }

    return Object.assign({}, DEFAULT_QUERY_OPTIONS, userQueryOptions);
}

const DEFAULT_QUERY_OPTIONS = {
    search: null,
    pageSize: 10,
    pageIndex: 0,
    fromDate: new Date('01-01-2000'),
    toDate: new Date(),
    sortField: 'date',
    sortDirection: 1,
    categories: []
};

function getTransactionTransformer(institution) {
    switch (institution) {
        case 'FNB':
            return new FNBTransactionTransformer();
        case 'NEDBANK':
            return new NedbankTransactionTransformer();
        default:
            return null;
    }
}

async function transformStatementToTransactions(transformer, statement) {
    return new Promise((resolve) => {
        const batchId = String(Date.now());
        const transactions = []; // array to hold all transactions produced from the statement
        // setup the csv parser breakup a comma separated line into an array of values
        const csvParser = parse({relax_column_count: true, ltrim: true, rtrim: true});
        const innerStream = es.readArray([statement.raw]) // read the csv into an event stream
            .pipe(es.split(/(\r?\n)/)) // break up the csv by new line
            .pipe(csvParser) // feed each line into the csv parser to get an array of values
            .pipe(transformer) // feed the line values into a transaction transformer that will collate the values from
            // each line and spit out a transaction when complete
            .pipe(es.map((_transaction, callback) => {
                _transaction.hashCode = hash(_transaction);
                _transaction.batchId = batchId;
                _transaction.statement = statement._id;
                transactions.push(_transaction);
                callback();
            }));
        innerStream.on('end', () => {
            if (transactions.length === 0) throw Error(`No Transactions created from statement`);
            resolve(transactions);
        });
    });
}

async function removeDuplicateTransactions(transactions) {
    const hashCodes = transactions.map(t => t.hashCode);

    // get existing hashCodes from db
    const transactionsInDb = await txEsi.getTransactions([
        {$match: {'hashCode': {$in: hashCodes}}}
    ]);
    const existingHashCodes = [...new Set(transactionsInDb.map(t => t.hashCode))];

    return transactions.filter(t => !existingHashCodes.includes(t.hashCode))
}

module.exports =
    {
        getTransactions,
        searchTransactionDescription,
        createTransactionsFromStatement,
        aggregateCategoriesForYear,
        aggregateCategoriesForStatement,
        updateTransactionsWithNewCategory,
        updateTransactionsWithUpdatedCategory,
        updateTransactionsWithDeletedCategory
    };
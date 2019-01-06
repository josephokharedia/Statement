/*
 * Transactions Business adapter
 * Receives an instruction to get transactions / search transactions
 * Generates a mongodb aggregation query pipeline for Transactions
 * Invokes Transactions External Service interface to execute the pipeline
 */
const {unwrapError} = require('../../../shared/Utils');
const txEsi = require('../integration/TransactionsEsi');
const catBa = require('../../categories/control/CategoriesBa');
const {escapeRegExp} = require('../../../shared/Utils.js');
const getTransactionsPipeline = require('./pipeline/GetTransactionsPipeline');
const searchTransactionsPipeline = require('./pipeline/SearchTransactionsPipeline');
const aggregateCategoriesForStatementPipeline = require('./pipeline/AggregateCategoriesForStatementPipeline');
const aggregateCategoriesForYearPipeline = require('./pipeline/AggregateCategoriesForYearPipeline');
const {toObjectId, hashTransaction} = require('../../../shared/Utils');
const event = require('../../../shared/EventUtil');
const GetTransactionsResultTo = require('./transferobject/GetTransactionsResultTo');
const GetCategoriesPerYearResultTo = require('./transferobject/GetCategoriesPerYearResultTo');
const GetCategoriesPerStatementResultTo = require('./transferobject/GetCategoriesPerStatementResultTo');
const TransactionTo = require('./transferobject/TransactionTo');
const TransactionEntity = require('../entity/TransactionEntity');

const DEFAULT_QUERY_OPTIONS = {
    search: null,
    pageSize: 10,
    pageIndex: 0,
    fromDate: new Date('01-01-2000'),
    toDate: new Date(),
    sortField: 'date',
    sortDirection: 1,
    categories: [],
    hashCode: null,
    statement: null,
    institution: null
};

async function getTransactions(queryOptions) {
    const userQueryOptions = _generateUserQueryOptions(queryOptions);
    try {
        const pipeline = getTransactionsPipeline(userQueryOptions);
        const docs = await txEsi.getTransactions(pipeline);
        if (docs.length === 0) {
            return new GetTransactionsResultTo();
        } else {
            return new GetTransactionsResultTo(docs[0]);
        }
    } catch (e) {
        return unwrapError(`Failed to get transactions`, e);
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
        return unwrapError(`Failed to search transaction`, e);
    }
}

async function aggregateCategoriesForYear({year}) {
    const currentYear = new Date().getFullYear();
    const validYear = (yr) => /^\d{4}$/.test(yr); //&& parseInt(yr) >= 2000 && parseInt(yr) <= currentYear;
    year = validYear(year) ? parseInt(year) : currentYear;

    try {
        const pipeline = aggregateCategoriesForYearPipeline(year);
        const results = await txEsi.getTransactions(pipeline);
        return results.map(r => new GetCategoriesPerYearResultTo(r));
    } catch (e) {
        return unwrapError(`Failed to aggregate categories per year`, e);
    }
}

async function aggregateCategoriesForStatement({statementId}) {
    if (!statementId) {
        throw Error(`StatementId cannot be Null`);
    }
    try {
        const pipeline = aggregateCategoriesForStatementPipeline(toObjectId(statementId));
        const result = await txEsi.getTransactions(pipeline);
        if (result.length > 0) {
            return result[0].categories.map(c => new GetCategoriesPerStatementResultTo(c));
        } else {
            return [];
        }
    } catch (e) {
        return unwrapError(`Failed to aggregate categories per statement`, e);
    }
}

async function createTransactions(transactions = [], statementId) {
    try {
        if (!statementId) {
            throw Error(`StatementId cannot be Null`)
        }

        const uniqueTransactionsTo = [];
        for (const t of transactions) {
            const dbTransactions = await txEsi.getTransactions([{$match: {hashCode: hashTransaction(t)}}]);
            if (dbTransactions.length === 0) {
                uniqueTransactionsTo.push(new TransactionEntity(t, statementId));
            }
        }

        if (!uniqueTransactionsTo.length) {
            return [];
        }

        const {ops} = await txEsi.createTransactions(uniqueTransactionsTo);
        const createdTransactions = ops.map(t => new TransactionTo(t));
        event.raise('CreatedTransactions', createdTransactions);
        return createdTransactions;
    } catch (e) {
        return unwrapError(`Failed to create ${transactions && transactions.length} transactions`, e);
    }
}

async function categorizeTransactions(category = null, transactions = []) {
    try {
        let categories;
        if (category) {
            categories = [category];
        } else {
            categories = await catBa.getCategories();
        }

        const transactionIds = transactions.map(t => t._id);
        for (let _category of categories) {
            await deCategorizeTransactions(_category.id, transactionIds);
            await txEsi.categorizeTransactions(_category.id, _category.regex, transactionIds);
        }
    } catch (e) {
        return unwrapError(`Failed to categorize new transactions`, e)
    }
}

async function deCategorizeTransactions(categoryId, transactionIds = []) {
    try {
        await txEsi.deCategorizeTransactions(toObjectId(categoryId), transactionIds);
    } catch (e) {
        return unwrapError(`Failed to update transactions with deleted category`, e)
    }
}

function _generateUserQueryOptions(
    {
        search, pageSize, pageIndex, fromDate, toDate, sortField, sortDirection, category,
        hashCode, statement, institution
    }) {
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
            userQueryOptions.categories = categories.map(str => toObjectId(escapeRegExp(str.toString())));
        } else {
            userQueryOptions.categories = [toObjectId(escapeRegExp(categories.toString()))];
        }
    }

    if (hashCode) {
        userQueryOptions.hashCode = escapeRegExp(hashCode);
    }

    if (statement) {
        userQueryOptions.statement = toObjectId(statement);
    }

    const institutions = institution;
    if (institutions) {
        if (Array.isArray(institutions)) {
            userQueryOptions.institutions = institutions.map(str => escapeRegExp(str));
        } else {
            userQueryOptions.institutions = [escapeRegExp(institutions)];
        }
    }


    return Object.assign({}, DEFAULT_QUERY_OPTIONS, userQueryOptions);
}

module.exports =
    {
        getTransactions,
        searchTransactionDescription,
        createTransactions,
        aggregateCategoriesForYear,
        aggregateCategoriesForStatement,
        categorizeTransactions,
        deCategorizeTransactions
    };
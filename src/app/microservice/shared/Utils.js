const ObjectId = require('mongodb').ObjectId;
const _ = require('lodash');
const hash = require('object-hash');

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function handleError(err, res, operation, status) {
    console.log('error occurred!', err.stack);
    const msg = ((operation && `Failed to ${operation}. `) || ``).concat(`Unexpected error ${err} occurred!`);
    res && res.status(status || 500).json({msg}).end();
}

function toObjectId(value) {
    if (value instanceof ObjectId) {
        return value;
    } else {
        const paddedValue = _.padStart(value.toString(), 24, '0');
        return ObjectId(paddedValue);
    }
}

function unwrapError(summary, e) {
    console.error(e);
    return {error: {summary, detail: e.message}};
}

function hashStatement(statement) {
    return hash([statement.accountNumber, statement.statementNumber]);
}

function hashTransaction(transaction) {
    return hash([transaction.date, transaction.description, transaction.amount, transaction.balance]);
}


module.exports = {escapeRegExp, handleError, toObjectId, unwrapError, hashStatement, hashTransaction};
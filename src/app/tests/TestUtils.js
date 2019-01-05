const {hashStatement, hashTransaction} = require('../microservice/shared/Utils');

function addHashCodeToTransactions(transactions) {
    transactions.forEach(t => t.hashCode = hashTransaction(t));
}

function addHashCodeToStatements(statements) {
    statements.forEach(s => s.hashCode = hashStatement(s));
}

module.exports = {addHashCodeToTransactions, addHashCodeToStatements};
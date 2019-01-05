const hash = require('object-hash');
const TransactionTo = require('./TransactionTo');
module.exports = class GetTransactionsResultTo {
    constructor(transaction) {
        this.count = (transaction && transaction.count) || 0;
        this.data = (transaction && transaction.data) || [];
        if (!transaction) {
            return;
        }
        this.data = this.data.map(d => new TransactionTo(d));
    }
};
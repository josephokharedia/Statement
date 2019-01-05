const moment = require('moment');
const {toObjectId, hashTransaction} = require('../../../shared/Utils');
module.exports = class TransactionEntity {
    constructor(transaction, statementId) {
        this.validate(transaction);
        this.date = transaction.date;
        this.description = transaction.description;
        this.amount = transaction.amount;
        this.balance = transaction.balance;
        this.statement = toObjectId(statementId);
        this.hashCode = hashTransaction(this);
    }

    validate({date, description, amount, balance}) {
        const validDate = date instanceof Date && moment(date).isValid();
        const validDescription = typeof description === 'string' && description.trim().length;
        const validAmount = typeof amount === 'number';
        const validBalance = typeof balance === 'number';

        if (!validDate) {
            throw Error(`Error creating transaction. Incorrect date ${date}`);
        }
        if (!validDescription) {
            throw Error(`Error creating transaction. Incorrect description ${description}`);
        }
        if (!validAmount) {
            throw Error(`Error creating transaction. Incorrect amount ${amount}`);
        }
        if (!validBalance) {
            throw Error(`Error creating transaction. Incorrect balance ${balance}`);
        }
    }
};
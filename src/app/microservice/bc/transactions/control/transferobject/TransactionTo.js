module.exports = class TransactionTo {
    constructor(transaction) {
        this.id = transaction._id;
        this.date = transaction.date;
        this.description = transaction.description;
        this.amount = transaction.amount;
        this.balance = transaction.balance;
        this.categories = transaction.categories;
        this.statement = transaction.statement
    }
};
module.exports = class StatementDetailsTo {
    constructor(statement) {
        this.id = statement._id;
        this.accountNumber = statement.accountNumber;
        this.statementNumber = statement.statementNumber;
        this.accountDescription = statement.accountDescription;
        this.institution = statement.institution;
        this.hashCode = statement.hashCode;
        this.openingBalance = statement.openingBalance;
        this.closingBalance = statement.closingBalance;
        this.fromDate = statement.fromDate;
        this.toDate = statement.toDate;
        this.totalCredit = statement.totalCredit;
        this.totalDebit = statement.totalDebit;
        this.transactionGroups = new TransactionGroups(statement.transactions);
    }
};

class TransactionGroups {
    constructor(transactions) {
        this.credits = [];
        this.debits = [];
        this.data = [];

        transactions.credits.forEach(c => this.credits.push(new Transaction(c)));
        transactions.debits.forEach(d => this.debits.push(new Transaction(d)));
        transactions.data.forEach(d => this.data.push(new Transaction(d)));
    }
}

class Transaction {
    constructor(transaction) {
        this.id = transaction._id;
        this.date = transaction.date;
        this.description = transaction.description;
        this.amount = transaction.amount;
        this.balance = transaction.balance;
        this.hashCode = transaction.hashCode;
    }
}
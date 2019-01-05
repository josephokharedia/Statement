module.exports = class DraftTo {
    constructor(draft, statement, transactions = []) {
        this.id = draft._id;
        this.institution = draft.institution;
        this.filename = draft.filename;
        this.statement = {
            accountNumber: statement.accountNumber,
            accountDescription: statement.accountDescription,
            statementNumber: statement.statementNumber,
        };
        if (statement.id) {
            this.statement.id = statement.id
        }
        if (statement.duplicate) {
            this.statement.duplicate = statement.duplicate
        }

        this.transactions = [];
        transactions.forEach(t => {
            const transaction = {
                date: t.date,
                description: t.description,
                amount: t.amount,
                balance: t.balance,
            };
            if (t.id) {
                transaction.id = t.id;
            }
            if (t.duplicate) {
                transaction.duplicate = t.duplicate;
            }
            this.transactions.push(transaction);
        });

        const dates = this.transactions.map(t => t.date);
        dates.sort((left, right) => left.getTime() - right.getTime());
        this.statement.fromDate = dates[0];
        this.statement.toDate = dates[dates.length - 1];
    }
};
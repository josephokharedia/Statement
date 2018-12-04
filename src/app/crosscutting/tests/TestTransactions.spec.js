const {expect, assert} = require('chai');
const txBa = require('../../microservice/bc/transactions/control/TransactionsBa');
const txEsi = require('../../microservice/bc/transactions/integration/TransactionsEsi');
const createTestDatabase = require('./CreateTestDatabase.spec');
const moment = require('moment');
const {toObjectId} = require('../../microservice/shared/Utils');


describe('Get Transactions with query options', () => {
    beforeEach(createTestDatabase);

    it('should return transactions matching search term', async () => {
        const search = 'description 1';
        const queryOptions = {search};
        const {count, data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(2);
        data.forEach(d => expect(d).to.have.property('description').to.include(search));
        expect(count).to.equal(2);
    });

    it('should return no transactions with non-matching search term', async () => {
        const queryOptions = {search: 'Lorem Ipsum'};
        const {count, data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(0);
        expect(count).to.equal(0);
    });

    it('should return all transactions with missing search term', async () => {
        const queryOptions = {search: ''};
        const {count, data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(10);
        expect(count).to.equal(10);
    });

    it('should return transactions between dates', async () => {
        const fromDate = moment.utc('2018-01-02').toDate();
        const toDate = moment.utc('2018-01-04').toDate();
        const queryOptions = {fromDate, toDate};
        const {count, data} = await txBa.getTransactions(queryOptions);
        data.forEach(d => expect(d).to.have.property('date').within(fromDate, toDate));
        expect(data).to.have.lengthOf(3);
        expect(count).to.equal(3);
    });

    it('should return transactions with categories', async () => {
        const category = [toObjectId(1).toString()];
        const queryOptions = {category};
        const {count, data} = await txBa.getTransactions(queryOptions);
        data.forEach(d => expect(d).to.have.property('categories').to.include('Category 1'));
        expect(data).to.have.lengthOf(3);
        expect(count).to.equal(3);
    });

    it('should return first paged of transactions', async () => {
        const pageSize = 3;
        const pageIndex = 0;
        const queryOptions = {pageSize, pageIndex};
        const {count, data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(3);
        expect(count).to.equal(10);
    });

    it('should return next page of transactions', async () => {
        const pageSize = 4;
        const pageIndex = 1;
        const queryOptions = {pageSize, pageIndex};
        const {count, data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(4);
        expect(count).to.equal(10);
    });

    it('should return transactions sorted by date asc', async () => {
        const sortField = 'date';
        const sortDirection = 'asc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(1));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(10));
    });

    it('should return transactions sorted by date desc', async () => {
        const sortField = 'date';
        const sortDirection = 'desc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(10));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(1));
    });

    it('should return transactions sorted by description asc', async () => {
        const sortField = 'description';
        const sortDirection = 'asc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(1));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(9));
    });

    it('should return transactions sorted by description desc', async () => {
        const sortField = 'description';
        const sortDirection = 'desc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(9));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(1));
    });

    it('should return transactions sorted by amount asc', async () => {
        const sortField = 'amount';
        const sortDirection = 'asc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(10));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(1));
    });

    it('should return transactions sorted by amount desc', async () => {
        const sortField = 'amount';
        const sortDirection = 'desc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(1));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(10));
    });

    it('should return transactions sorted by balance asc', async () => {
        const sortField = 'balance';
        const sortDirection = 'asc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(10));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(1));
    });

    it('should return transactions sorted by balance desc', async () => {
        const sortField = 'balance';
        const sortDirection = 'desc';
        const queryOptions = {sortField, sortDirection};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.deep.nested.property('0.id', toObjectId(1));
        expect(data).to.have.deep.nested.property(`${data.length - 1}.id`, toObjectId(10));
    });

});

describe('Search transaction description with search term', () => {
    beforeEach(createTestDatabase);

    it('should return transactions matching search term', async () => {
        const q = 'description 1';
        const searchTerm = {q};
        const result = await txBa.searchTransactionDescription(searchTerm);
        expect(result).to.have.lengthOf(2);
        result.forEach(d => expect(d).to.have.string(q));
    });

    it('should return transactions non-matching search term', async () => {
        const q = 'Lorem Ipsum';
        const searchTerm = {q};
        const result = await txBa.searchTransactionDescription(searchTerm);
        expect(result).to.have.lengthOf(0);
    });

});

describe('Add transactions from statement', function () {
    before(createTestDatabase);

    it('should add transactions from statement', async function () {
        const raw = `
        2,123456,MR JOE SOAP,TEST ACCOUNT\n
        3,01,01 'January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Test Statement","Transaction 01","",100.00,1000.00,\n
        5,2,'02 Jan',"Test Statement","Transaction 02","",-200.00,1000.00,\n
        5,3,'01 Feb',"Test Statement","Transaction 03","",300.00,-1000.00,\n
        `;
        const institution = 'FNB';
        const statement = {raw, institution, _id: toObjectId('abcdef')};

        await txBa.createTransactionsFromStatement(statement);
        const transactions = await txEsi.getTransactions([{$match: {statement: statement._id}}]);
        expect(transactions).to.have.lengthOf(3);
        transactions.forEach(t => {
            expect(t).to.have.property('statement').eql(toObjectId('abcdef'));
            expect(t).to.have.property('_id');
            expect(t).to.have.property('hashCode');
            expect(t).to.have.property('batchId');
            assert(moment(t.date).isValid());
        });
        transactions.sort((a, b) => moment(a.date).diff(moment(b.date)));

        expect(transactions).to.have.deep.nested.property('0.description', 'Test Statement, Transaction 01, ');
        expect(transactions).to.have.deep.nested.property('0.amount', 100.00);
        expect(transactions).to.have.deep.nested.property('0.balance', 1000.00);
        assert(moment(transactions[0].date).isSame(moment.utc('2018-01-01')));

        expect(transactions).to.have.deep.nested.property('1.description', 'Test Statement, Transaction 02, ');
        expect(transactions).to.have.deep.nested.property('1.amount', -200.00);
        expect(transactions).to.have.deep.nested.property('1.balance', 1000.00);
        assert(moment(transactions[1].date).isSame(moment.utc('2018-01-02')));

        expect(transactions).to.have.deep.nested.property('2.description', 'Test Statement, Transaction 03, ');
        expect(transactions).to.have.deep.nested.property('2.amount', 300.00);
        expect(transactions).to.have.deep.nested.property('2.balance', -1000.00);
        assert(moment(transactions[2].date).isSame(moment.utc('2018-02-01')));
    });

});

describe('Aggregate categories', function () {
    beforeEach(createTestDatabase);

    it('should aggregate categories for a specific statement', async function () {
        const statementId = toObjectId(1);
        const query = {statementId};
        const result = await txBa.aggregateCategoriesForStatement(query);
        expect(result).to.have.lengthOf(2);
        result.forEach(d => expect(d).to.have.keys(['id', 'name', 'count', 'amount']));
        result.sort((a, b) => a.id - b.id);
        expect(result).to.have.deep.nested.property('0.id').to.eql(toObjectId(1));
        expect(result).to.have.deep.nested.property('0.name', 'Category 1');
        expect(result).to.have.deep.nested.property('0.count', 3);
        expect(result).to.have.deep.nested.property('0.amount', -800);
        expect(result).to.have.deep.nested.property('1.id').to.eql(toObjectId(2));
        expect(result).to.have.deep.nested.property('1.name', 'Category 2');
        expect(result).to.have.deep.nested.property('1.count', 1);
        expect(result).to.have.deep.nested.property('1.amount', -200);
    });

    it('should aggregate categories for a specific year', async function () {
        const year = 2018;
        const query = {year};
        const result = await txBa.aggregateCategoriesForYear(query);
        expect(result).to.have.length(2);
        result.sort((a, b) => a.date.month - b.date.month);
        result[0]['categories'].sort((a, b) => a.id - b.id);
        expect(result).to.have.deep.nested.property('0.date.year', 2018);
        expect(result).to.have.deep.nested.property('0.date.month', 1);
        expect(result).to.have.deep.nested.property('0.categories.0.id').eql(toObjectId(1));
        expect(result).to.have.deep.nested.property('0.categories.0.name', 'Category 1');
        expect(result).to.have.deep.nested.property('0.categories.0.count', 1);
        expect(result).to.have.deep.nested.property('0.categories.0.amount', -200);
        expect(result).to.have.deep.nested.property('0.categories.1.id').eql(toObjectId(2));
        expect(result).to.have.deep.nested.property('0.categories.1.name', 'Category 2');
        expect(result).to.have.deep.nested.property('0.categories.1.count', 1);
        expect(result).to.have.deep.nested.property('0.categories.1.amount', -200);
        expect(result).to.have.deep.nested.property('1.date.year', 2018);
        expect(result).to.have.deep.nested.property('1.date.month', 2);
        expect(result).to.have.deep.nested.property('1.categories.0.id').eql(toObjectId(1));
        expect(result).to.have.deep.nested.property('1.categories.0.name', 'Category 1');
        expect(result).to.have.deep.nested.property('1.categories.0.count', 1);
        expect(result).to.have.deep.nested.property('1.categories.0.amount', -500);
    });
});

describe('Update Transactions based on changes in Categories', function () {
    beforeEach(createTestDatabase);

    it('update transactions on CreatedCategory', async function () {
        const category = {
            _id: toObjectId(4),
            name: 'Category 4',
            tags: ['description'],
            regex: [/description 1/i]
        };
        await txBa.updateTransactionsWithNewCategory(category);
        const transactionIdsWithCategoryPipeline = [
            {$unwind: {path: '$categories'}},
            {$match: {categories: toObjectId(4)}},
            {$group: {_id: null, transactionIds: {$addToSet: '$_id'}}},
            {$project: {_id: 0, transactionIds: 1}}
        ];
        const result = await txEsi.getTransactions(transactionIdsWithCategoryPipeline);
        const ids = result && result.length > 0 ? result[0].transactionIds : [];
        expect(ids).to.have.lengthOf(2);
        expect(ids).to.include.deep.members([toObjectId(10), toObjectId(1)]);
    });

    it('update transactions on UpdatedCategory', async function () {
        const category = {
            _id: toObjectId(1),
            regex: [/description 9/i]
        };
        await txBa.updateTransactionsWithUpdatedCategory(category);
        const transactionIdsWithCategoryPipeline = [
            {$unwind: {path: '$categories'}},
            {$match: {categories: toObjectId(1)}},
            {$group: {_id: null, transactionIds: {$addToSet: '$_id'}}},
            {$project: {_id: 0, transactionIds: 1}}
        ];
        const result = await txEsi.getTransactions(transactionIdsWithCategoryPipeline);
        const ids = result && result.length > 0 ? result[0].transactionIds : [];
        expect(ids).to.have.lengthOf(1);
        expect(ids).to.include.deep.members([toObjectId(9)]);
    });

    it('update transactions on DeletedCategory', async function () {
        await txBa.updateTransactionsWithDeletedCategory(1);
        const transactionIdsWithCategoryPipeline = [
            {$unwind: {path: '$categories'}},
            {$match: {categories: toObjectId(1)}},
            {$group: {_id: null, transactionIds: {$addToSet: '$_id'}}},
            {$project: {_id: 0, transactionIds: 1}}
        ];
        const result = await txEsi.getTransactions(transactionIdsWithCategoryPipeline);
        const ids = result && result.length > 0 ? result[0].transactionIds : [];
        expect(ids).to.have.lengthOf(0);
    });

});

describe('Add transactions from a statement with duplicates', function () {
    before(createTestDatabase);

    const statementId = toObjectId('abcdef');
    const institution = 'FNB';
    it('should add duplicate transactions that are in the same batch', async function () {
        const raw = `
        2,123456,MR JOE SOAP,TEST ACCOUNT\n
        3,99,01 'January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Test Statement 1","","",-100.00,1000.00,\n
        5,2,'02 Jan',"Test Statement 2","","",-200.00,1000.00,\n
        5,3,'02 Jan',"Test Statement 2","","",-200.00,1000.00,\n
        `;
        const statement = {raw, institution, _id: statementId};

        await txBa.createTransactionsFromStatement(statement);
        const transactions = await txEsi.getTransactions([{$match: {statement: statement._id}}]);
        expect(transactions).to.have.lengthOf(3);
    });

    it('should not add duplicate transactions that are not in the same batch', async function () {
        const raw = `
        2,123456,MR JOE SOAP,TEST ACCOUNT\n
        3,99,01 'January 2018', '01 February 2019'\n
        5,4,'02 Jan',"Test Statement 2","","",-200.00,1000.00,\n
        5,5,'03 Jan',"Test Statement 3","","",-300.00,1000.00,\n
        5,6,'04 Jan',"Test Statement 4","","",-400.00,1000.00,\n
        5,7,'04 Jan',"Test Statement 4","","",-400.00,1000.00,\n
        `;

        const statement = {raw, institution, _id: statementId};

        await txBa.createTransactionsFromStatement(statement);
        const transactions = await txEsi.getTransactions([{$match: {statement: statement._id}}]);
        expect(transactions).to.have.lengthOf(6);
    });

    it('should not add duplicate transactions when re-uploading the same batch', async function () {
        const raw = `
        2,123456,MR JOE SOAP,TEST ACCOUNT\n
        3,99,01 'January 2018', '01 February 2019'\n
        5,4,'02 Jan',"Test Statement 2","","",-200.00,1000.00,\n
        5,5,'03 Jan',"Test Statement 3","","",-300.00,1000.00,\n
        5,6,'04 Jan',"Test Statement 4","","",-400.00,1000.00,\n
        5,7,'04 Jan',"Test Statement 4","","",-400.00,1000.00,\n
        `;

        const statement = {raw, institution, _id: statementId};

        await txBa.createTransactionsFromStatement(statement);
        const transactions = await txEsi.getTransactions([{$match: {statement: statement._id}}]);
        expect(transactions).to.have.lengthOf(6);
    });
});


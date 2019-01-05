const {expect, assert} = require('chai');
const txBa = require('../microservice/bc/transactions/control/TransactionsBa');
const createTestDatabase = require('./CreateTestDatabase.spec');
const moment = require('moment');
const {toObjectId} = require('../microservice/shared/Utils');
const event = require('../microservice/shared/EventUtil');
const sinon = require('sinon');


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
            id: toObjectId(4),
            name: 'Category 4',
            tags: ['description'],
            regex: [/description 1/i]
        };
        await txBa.categorizeTransactions(category);
        const queryOptions = {category: '4'};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(2);
        expect(data.map(d => d.id)).to.include.deep.members([toObjectId(10), toObjectId(1)]);
    });

    it('update transactions on UpdatedCategory', async function () {
        const category = {
            id: toObjectId(1),
            regex: [/description 9/i]
        };
        await txBa.categorizeTransactions(category);
        const queryOptions = {category: '1'};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(1);
        expect(data.map(d => d.id)).to.include.deep.members([toObjectId(9)]);
    });

    it('update transactions on DeletedCategory', async function () {
        await txBa.deCategorizeTransactions(2);
        const queryOptions = {category: '2'};
        const {data} = await txBa.getTransactions(queryOptions);
        expect(data).to.have.lengthOf(0);
    });

});

describe('Add transactions', function () {
    const createdTransactionsEventHandlerSpy = sinon.spy();
    let createdTransactions;
    before(async function () {
        await createTestDatabase();
        event.on('CreatedTransactions', createdTransactionsEventHandlerSpy);
    });

    it('should add duplicate transactions that are in the same batch', async function () {
        const statementId = toObjectId(99);
        const transactions = [
            {
                date: moment.utc('2018-01-01').toDate(),
                amount: 100.00,
                balance: 101.00,
                description: 'Test transaction 1',
            },
            {
                date: moment.utc('2018-01-02').toDate(),
                amount: 200.00,
                balance: 201.00,
                description: 'Test transaction 2',
            },
        ];

        createdTransactions = await txBa.createTransactions(transactions, statementId);
        expect(createdTransactions).to.have.lengthOf(2);
        createdTransactions.forEach(t => {
            expect(t).to.have.property('id');
        });
    });

    it('should check that CreatedTransactions event was invoked', function () {
        assert(createdTransactionsEventHandlerSpy.withArgs(createdTransactions).calledOnce);
    });

    it('should not add duplicate transactions that are not in the same batch', async function () {
        const statementId = toObjectId(99);
        const transactions = [
            {
                date: moment.utc('2017-01-01').toDate(),
                description: 'Test description 1',
                amount: -100,
                balance: 1000,
            },
            {
                date: moment.utc('2018-01-02').toDate(),
                amount: 300.00,
                balance: 301.00,
                description: 'Test transaction 3',
            },
        ];

        const createdTransactions = await txBa.createTransactions(transactions, statementId);
        expect(createdTransactions).to.have.lengthOf(1);
        createdTransactions.forEach(t => {
            expect(t).to.have.property('id');
            expect(t).to.have.property('description', 'Test transaction 3');
        });
    });
});


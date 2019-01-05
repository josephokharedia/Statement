const {addHashCodeToTransactions, addHashCodeToStatements} = require('./TestUtils');
const {expect, assert} = require('chai');
const stmtBa = require('../microservice/bc/statements/control/StatementsBa');
const createTestDatabase = require('./CreateTestDatabase.spec');
const moment = require('moment');
const {toObjectId} = require('../microservice/shared/Utils');

describe('Get Statements', function () {
    beforeEach(createTestDatabase);

    it('should return all statements', async function () {
        const statements = await stmtBa.getStatements();
        expect(statements).to.have.lengthOf(2);
        statements.forEach(s => {
            expect(s).to.have.property('id');
            expect(s).to.have.property('statementNumber');
            expect(s).to.have.property('institution');
            assert(moment(s.fromDate).isValid());
            assert(moment(s.toDate).isValid());
        });
    });
});

describe('Create Statement', function () {
    beforeEach(createTestDatabase);

    it('should create statement successfully', async function () {

        const statement = {
            accountNumber: '123456',
            accountDescription: 'TEST ACCOUNT',
            statementNumber: '01',
            institution: 'FNB',
            attachment: '',
        };
        const createdStatement = await stmtBa.createStatement(statement);
        expect(createdStatement).to.have.property('id');
        expect(createdStatement).to.have.property('accountDescription', 'TEST ACCOUNT');
    });

    it('Ensure statements matching on hashCode is not duplicated', async function () {
        const statement = {
            accountNumber: '100',
            accountDescription: 'DUPLICATE TEST ACCOUNT',
            statementNumber: '01',
            institution: 'FNB',
            attachment: '',
        };
        const createdStatement = await stmtBa.createStatement(statement);
        expect(createdStatement).to.have.property('id');
        expect(createdStatement).to.have.property('accountDescription', 'Test Account');
    })
});

describe('Get Statement details', function () {
    beforeEach(createTestDatabase);

    it('should get statement details successfully', async function () {
        const statementId = 1;
        const statementDetails = await stmtBa.getStatementDetails({statementId});
        const expectedResult = {
            openingBalance: 1000,
            closingBalance: 600,
            fromDate: moment.utc('2017-01-01').toDate(),
            toDate: moment.utc('2018-02-01').toDate(),
            totalCredit: 0,
            totalDebit: -1500,
            id: toObjectId(1),
            accountNumber: '100',
            statementNumber: '01',
            accountDescription: 'Test Account',
            institution: 'Test Bank',
            transactionGroups: {
                credits: [],
                debits: [
                    {
                        id: toObjectId(1),
                        date: moment.utc('2017-01-01').toDate(),
                        description: 'Test description 1',
                        amount: -100,
                        balance: 1000,
                    },
                    {
                        id: toObjectId(2),
                        date: moment.utc('2018-01-02').toDate(),
                        description: 'Test description 2',
                        amount: -200,
                        balance: 900,
                    },
                    {
                        id: toObjectId(3),
                        date: moment.utc('2018-01-03').toDate(),
                        description: 'Test description 3',
                        amount: -300,
                        balance: 800,
                    },
                    {
                        id: toObjectId(4),
                        date: moment.utc('2018-01-04').toDate(),
                        description: 'Test description 4',
                        amount: -400,
                        balance: 700,
                    },
                    {
                        id: toObjectId(5),
                        date: moment.utc('2018-02-01').toDate(),
                        description: 'Test description 5',
                        amount: -500,
                        balance: 600,
                    }],
                data: [
                    {
                        id: toObjectId(1),
                        date: moment.utc('2017-01-01').toDate(),
                        description: 'Test description 1',
                        amount: -100,
                        balance: 1000,
                    },
                    {
                        id: toObjectId(2),
                        date: moment.utc('2018-01-02').toDate(),
                        description: 'Test description 2',
                        amount: -200,
                        balance: 900,
                    },
                    {
                        id: toObjectId(3),
                        date: moment.utc('2018-01-03').toDate(),
                        description: 'Test description 3',
                        amount: -300,
                        balance: 800,
                    },
                    {
                        id: toObjectId(4),
                        date: moment.utc('2018-01-04').toDate(),
                        description: 'Test description 4',
                        amount: -400,
                        balance: 700,
                    },
                    {
                        id: toObjectId(5),
                        date: moment.utc('2018-02-01').toDate(),
                        description: 'Test description 5',
                        amount: -500,
                        balance: 600,
                    }
                ]
            }
        };

        addHashCodeToStatements([expectedResult]);
        addHashCodeToTransactions(expectedResult.transactionGroups.credits);
        addHashCodeToTransactions(expectedResult.transactionGroups.debits);
        addHashCodeToTransactions(expectedResult.transactionGroups.data);
        expect(statementDetails).to.deep.equal(expectedResult);
    });
});
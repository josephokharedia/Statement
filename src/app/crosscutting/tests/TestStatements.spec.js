const {expect, assert} = require('chai');
const stmtBa = require('../../microservice/bc/statements/control/StatementsBa');
const createTestDatabase = require('./CreateTestDatabase.spec');
const event = require('../../microservice/shared/EventUtil');
const moment = require('moment');
const hash = require('object-hash');
const sinon = require('sinon');
const {toObjectId} = require('../../microservice/shared/Utils');

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
        })
    });
});

describe('Add Statement', function () {
    const createdStatementEventHandlerSpy = sinon.spy();
    let createdStatement;
    before(async function () {
        await createTestDatabase();
        event.on('CreatedStatement', createdStatementEventHandlerSpy);
    });

    it('should add FNB statement successfully', async function () {
        const csv = `
        2,123456,MR JOE SOAP,TEST ACCOUNT\n
        3,01,01 'January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Test Statement","Transaction 01","",100.00,1000.00,\n
        5,2,'02 Jan',"Transaction Statement","Transaction 02","",-200.00,1000.00,\n
        5,3,'01 Feb',"Transaction Statement","Transaction 03","",300.00,-1000.00,\n
        `;
        const institution = 'FNB';
        const statement = await stmtBa.createStatement(csv, institution);

        expect(statement).to.have.property('_id');
        expect(statement).to.have.property('hashCode', hash(csv));
        expect(statement).to.have.property('accountNumber', '123456');
        expect(statement).to.have.property('accountDescription', 'TEST ACCOUNT');
        expect(statement).to.have.property('statementNumber', '01');
        expect(statement).to.have.property('institution', institution);
        expect(statement).to.have.property('raw', csv);
        createdStatement = statement;
    });

    it('should check that CreatedStatement event was invoked', function () {
        assert(createdStatementEventHandlerSpy.withArgs(createdStatement).calledOnce);
    });

    it('Ensure statements matching on accountNumber and statementNumber is not duplicated', async function () {
        const csv = `
        2,123456,MR JOE SOAP,DUPLICATE TEST ACCOUNT\n
        3,01,01 'January 2018', '01 February 2019'\n
        5,1,'01 Jan',"Duplicate Test Statement","Duplicate Transaction 01","",200.00,2000.00,\n
        `;
        const institution = 'FNB';
        const statement = await stmtBa.createStatement(csv, institution);
        expect(statement).to.eql(createdStatement);
    })
});

describe('Get Statement details', function () {
    beforeEach(createTestDatabase);

    it('should get statement details successfully', async function () {
        const statementDetails = await stmtBa.getStatementDetails(toObjectId(1));
        const expectedResult = {
            openingBalance: 1000,
            closingBalance: 600,
            fromDate: moment.utc('2017-01-01').toDate(),
            toDate: moment.utc('2018-02-01').toDate(),
            totalCredit: 0,
            totalDebit: -1500,
            id: toObjectId(1),
            accountNumber: '100',
            accountDescription: 'Test Account',
            institution: 'Test Bank',
            transactions: {
                credits: [],
                debits: [{
                    _id: toObjectId(1),
                    date: moment.utc('2017-01-01').toDate(),
                    description: 'Test description 1',
                    amount: -100,
                    balance: 1000,
                    hashCode: '1'
                },
                    {
                        _id: toObjectId(2),
                        date: moment.utc('2018-01-02').toDate(),
                        description: 'Test description 2',
                        amount: -200,
                        balance: 900,
                        hashCode: '2'
                    },
                    {
                        _id: toObjectId(3),
                        date: moment.utc('2018-01-03').toDate(),
                        description: 'Test description 3',
                        amount: -300,
                        balance: 800,
                        hashCode: '3'
                    },
                    {
                        _id: toObjectId(4),
                        date: moment.utc('2018-01-04').toDate(),
                        description: 'Test description 4',
                        amount: -400,
                        balance: 700,
                        hashCode: '4'
                    },
                    {
                        _id: toObjectId(5),
                        date: moment.utc('2018-02-01').toDate(),
                        description: 'Test description 5',
                        amount: -500,
                        balance: 600,
                        hashCode: '5'
                    }],
                data: [{
                    _id: toObjectId(1),
                    date: moment.utc('2017-01-01').toDate(),
                    description: 'Test description 1',
                    amount: -100,
                    balance: 1000,
                    hashCode: '1'
                },
                    {
                        _id: toObjectId(2),
                        date: moment.utc('2018-01-02').toDate(),
                        description: 'Test description 2',
                        amount: -200,
                        balance: 900,
                        hashCode: '2'
                    },
                    {
                        _id: toObjectId(3),
                        date: moment.utc('2018-01-03').toDate(),
                        description: 'Test description 3',
                        amount: -300,
                        balance: 800,
                        hashCode: '3'
                    },
                    {
                        _id: toObjectId(4),
                        date: moment.utc('2018-01-04').toDate(),
                        description: 'Test description 4',
                        amount: -400,
                        balance: 700,
                        hashCode: '4'
                    },
                    {
                        _id: toObjectId(5),
                        date: moment.utc('2018-02-01').toDate(),
                        description: 'Test description 5',
                        amount: -500,
                        balance: 600,
                        hashCode: '5'
                    }]
            }
        };

        expect(statementDetails).to.deep.equal(expectedResult);
    });
});
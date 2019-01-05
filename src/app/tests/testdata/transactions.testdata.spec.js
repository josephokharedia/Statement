const moment = require('moment');
const {toObjectId} = require('../../microservice/shared/Utils');

module.exports = [
    {
        _id: toObjectId(1),
        date: moment.utc('2017-01-01').toDate(),
        description: 'Test description 1',
        amount: -100,
        balance: 1000,
        statement: toObjectId(1),
        categories: [toObjectId(1)]
    },
    {
        _id: toObjectId(2),
        date: moment.utc('2018-01-02').toDate(),
        description: 'Test description 2',
        amount: -200,
        balance: 900,
        statement: toObjectId(1),
        categories: [toObjectId(1), toObjectId(2)]
    },
    {
        _id: toObjectId(3),
        date: moment.utc('2018-01-03').toDate(),
        description: 'Test description 3',
        amount: -300,
        balance: 800,
        statement: toObjectId(1)
    },
    {
        _id: toObjectId(4),
        date: moment.utc('2018-01-04').toDate(),
        description: 'Test description 4',
        amount: -400,
        balance: 700,
        statement: toObjectId(1)
    },
    {
        _id: toObjectId(5),
        date: moment.utc('2018-02-01').toDate(),
        description: 'Test description 5',
        amount: -500,
        balance: 600,
        categories: [toObjectId(1)],
        statement: toObjectId(1)
    },
    {
        _id: toObjectId(6),
        date: moment.utc('2018-02-06').toDate(),
        description: 'Test description 6',
        amount: -600,
        balance: 500,
        statement: toObjectId(2)
    },
    {
        _id: toObjectId(7),
        date: moment.utc('2018-02-07').toDate(),
        description: 'Test description 7',
        amount: -700,
        balance: 400,
        statement: toObjectId(2)
    },
    {
        _id: toObjectId(8),
        date: moment.utc('2018-02-08').toDate(),
        description: 'Test description 8',
        amount: -800,
        balance: 300,
        statement: toObjectId(2)
    },
    {
        _id: toObjectId(9),
        date: moment.utc('2018-03-01').toDate(),
        description: 'Test description 9',
        amount: -900,
        balance: 200,
        statement: toObjectId(2)
    },
    {
        _id: toObjectId(10),
        date: moment.utc('2018-03-02').toDate(),
        description: 'Test description 10',
        amount: -1000,
        balance: 100,
        statement: toObjectId(2)
    }
];
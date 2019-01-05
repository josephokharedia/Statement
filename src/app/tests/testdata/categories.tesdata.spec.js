const {toObjectId} = require('../../microservice/shared/Utils');
module.exports = [
    {
        _id: toObjectId(1),
        name: 'Category 1',
        tags: ['Category 1'],
        regex: [/Category 1/i]
    },
    {
        _id: toObjectId(2),
        name: 'Category 2',
        tags: ['Category 2'],
        regex: [/Category 2/i]
    },
    {
        _id: toObjectId(3),
        name: 'Category 3',
        tags: ['Category 3'],
        regex: [/Category 3/i]
    },
];
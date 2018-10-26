const express = require('express');
const bodyParser = require('body-parser');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;


const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, {useNewUrlParser: true});
const dbName = 'ekugcineni';
const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
const port = process.env.PORT || 3000;
const defaultFromDate = new Date('01-01-2000');
const defaultPageSize = 10;


function run(db) {

    const categoriesDb = db.collection('categories');
    const transactionsDb = db.collection('transactions');

    app.get('/api/transactions', (req, res) => {

        const search = req.query['search'] || '';
        const pageSize = isNaN(req.query['pageSize']) ? defaultPageSize : parseInt(req.query['pageSize']);
        const pageIndex = isNaN(req.query['pageIndex']) ? 0 : parseInt(req.query['pageIndex']);
        const fromDate = req.query['fromDate'] && /[0-9-\/]+/.test(req.query['fromDate']) && new Date(req.query['fromDate']) || defaultFromDate;
        const toDate = req.query['toDate'] && /[0-9-\/]+/.test(req.query['toDate']) && new Date(req.query['toDate']) || new Date(Date.now());
        const sortField = req.query['sortField'] || 'date';
        const sortDirection = req.query['sortDirection'] === 'asc' ? -1 : +1;

        const sort = {};
        sort[sortField] = sortDirection;

        let categories = req.query['category'] || [];
        categories = Array.isArray(categories) ? categories : [categories];
        categories = categories.map(val => ObjectId(val));


        const filterStr = `search:${search}, pageSize:${pageSize}, pageIndex:${pageIndex}, 
        fromDate:${fromDate}, toDate:${toDate}, sortField:${sortField}, sortDirection:${sortDirection}, categories:${categories}`;
        console.log(filterStr);


        transactionsDb.aggregate([
            {
                $match: {
                    $and: [
                        {description: {$regex: `${search}`, $options: 'i'}},
                        {date: {$gt: fromDate}},
                        {date: {$lt: toDate}},
                        {categories: categories}
                    ]
                }
            },
            {$skip: (pageIndex * pageSize)},
            {$sort: sort},
            { $group: { _id: {_id:$_id}, count: { $sum: 1 } } },
            {$limit: pageSize},
            {$lookup: {from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories'}},
            {$project: {date: 1, description: 1, amount: 1, balance: 1, categories: 1}},
        ])
            .toArray()
            .then(docs => res.json(docs).end())
            .catch(err => handleError(err, res, `Find results with filter: ${filterStr}`));
    });

    app.get('/api/categories', (req, res) => {
        categoriesDb.find({}, {regex: 0}).toArray()
            .then(docs => res.json(docs).end())
            .catch(err => handleError(err, res));
    });

    app.post('/api/category', (req, res) => {
        const category = req.body;
        category.tags = category.tags.filter(t => t && t.length).map(t => escapeRegExp(t));
        category.regex = [];
        for (let i = 0; i < category.tags.length; i++) {
            category.regex.push(new RegExp([category.tags[i]].join(""), "i"));
        }

        console.log(`category:`, category);

        if (category.regex.length === 0) {
            handleError(`Invalid Request`, res, `process tags ${category.tags.join(", ")}`, 400);
            return;
        }

        categoriesDb.insertOne(category)
            .then(result => Promise.resolve(result.insertedId))
            .then(categoryId => transactionsDb.updateMany({description: {$in: category.regex}}, {$addToSet: {categories: categoryId}}))
            .then(result => res.json(result).end())
            .catch(err => handleError(err, res));

    });

    app.patch('/api/category', (req, res) => {
        const category = req.body;
        category.tags = category.tags.filter(t => t && t.length).map(t => escapeRegExp(t));
        category.regex = [];
        for (let i = 0; i < category.tags.length; i++) {
            category.regex.push(new RegExp([category.tags[i]].join(""), "i"));
        }

        const categoryId = ObjectId(`${category._id}`);
        categoriesDb.findOneAndUpdate(
            {_id: categoryId},
            {$set: {name: category.name, tags: category.tags, regex: category.regex}},
            {returnNewDocument: true})
            .then(() => transactionsDb.updateMany({categories: categoryId}, {$pull: {categories: categoryId}}))
            .then(() => transactionsDb.updateMany({description: {$in: category.regex}}, {$addToSet: {categories: categoryId}}))
            .then(() => res.status(200).end())
            .catch(err => handleError(err, res));
    });

    app.delete('/api/category/:categoryId', (req, res) => {
        if (!req.params.categoryId) {
            handleError(`Invalid Request`, res, `process category-id`, 400);
            return;
        }

        const categoryId = ObjectId(`${req.params.categoryId}`);
        transactionsDb.updateMany({categories: categoryId}, {$pull: {categories: categoryId}})
            .then(() => categoriesDb.deleteOne({_id: categoryId}))
            .then(() => res.status(202).end())
            .catch(err => handleError(err, res));
    });
}


client.connect((err) => {
    assert.equal(null, err);
    process.on('SIGINT', () => {
        console.log('disconnecting mongodb ...');
        client && client.close();
        process.exit();
    });

    app.listen(port, () => console.log(`Ekugcineni backend listening on port ${port}!`));
    const db = client.db(dbName);
    run(db);
});

const handleError = (err, res, operation, status) => {
    console.log('error occurred!', err.stack);
    const msg = ((operation && `Failed to ${operation}. `) || ``).concat(`Unexpected error ${err} occurred!`);
    res && res.status(status || 500).json({msg}).end();
};

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
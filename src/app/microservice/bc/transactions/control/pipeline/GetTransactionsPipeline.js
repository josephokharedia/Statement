module.exports = function getTransactionsPipeline(options) {
    const matchQuery = [];
    if (options.search) {
        matchQuery.push({description: {$regex: `${options.search}`, $options: 'i'}});
    }

    if (options.hashCode) {
        matchQuery.push({'hashCode': {$in: [options.hashCode]}});
    }

    if (options.statement) {
        matchQuery.push({'statement': {$in: [options.statement]}});
    }

    matchQuery.push({date: {$gte: options.fromDate}});
    matchQuery.push({date: {$lte: options.toDate}});
    if (options.categories && options.categories.length) {
        matchQuery.push
        (
            {
                $expr: {
                    $and: [
                        {$isArray: ["$categories"]},
                        {$setIsSubset: [options.categories, "$categories"]}
                    ]
                }
            }
        );
    }

    const dataStartIndex = (options.pageIndex * options.pageSize);
    const dataEndIndex = options.pageSize;
    // const skip = {$skip: (options.pageIndex * options.pageSize)};
    const match = {$match: {$and: [...matchQuery]}};
    let matchInstitution = {$match: {}};
    if (options.institutions && options.institutions.length) {
        matchInstitution = {
            $match: {
                $expr: {
                    $setIsSubset: [options.institutions, ['$data.statement.institution']]
                }
            }
        };
    }
    const sortField = `data.${options.sortField}`;
    const sort = {[sortField]: options.sortDirection, 'data.id': 1};
    return [
        match,
        {
            $group: {
                _id: null,
                count: {
                    $sum: 1
                },
                data: {
                    $push: "$$CURRENT"
                }
            }
        },
        {
            $project: {
                _id: 0,
                count: 1,
                data: {
                    $slice: [
                        "$data", dataStartIndex, dataEndIndex
                    ]
                }
            }
        },
        {
            $unwind: {
                path: "$data",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                count: 1,
                "data._id": 1,
                "data.date": 1,
                "data.description": 1,
                "data.amount": 1,
                "data.balance": 1,
                "data.categories": 1,
                "data.statement": 1
            }
        },
        {
            $lookup: {
                from: 'statements',
                localField: 'data.statement',
                foreignField: '_id',
                as: 'data.statement'
            }
        },
        {
            $unwind: {
                path: "$data.statement"
            }
        },
        matchInstitution,
        {
            $project: {
                count: 1,
                data: {
                    _id: "$data._id",
                    date: "$data.date",
                    description: "$data.description",
                    amount: "$data.amount",
                    balance: "$data.balance",
                    categories: "$data.categories",
                    statement: {
                        id: "$data.statement._id",
                        accountNumber: "$data.statement.accountNumber",
                        accountDescription: "$data.statement.accountDescription",
                        institution: "$data.statement.institution"
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'data.categories',
                foreignField: '_id',
                as: 'data.categories'
            }
        },
        {
            $unwind: {
                path: "$data.categories",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                count: 1,
                data: {
                    _id: "$data._id",
                    date: "$data.date",
                    description: "$data.description",
                    amount: "$data.amount",
                    balance: "$data.balance",
                    categories: "$data.categories.name",
                    statement: "$data.statement"
                }
            }
        },
        {
            $group: {
                _id: {
                    count: "$count",
                    data: {
                        _id: "$data._id",
                        date: "$data.date",
                        description: "$data.description",
                        amount: "$data.amount",
                        balance: "$data.balance",
                        statement: "$data.statement"
                    }
                },
                categories: {
                    $push: "$data.categories"
                }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$_id.count",
                data: {
                    _id: "$_id.data._id",
                    date: "$_id.data.date",
                    description: "$_id.data.description",
                    amount: "$_id.data.amount",
                    balance: "$_id.data.balance",
                    categories: "$categories",
                    statement: "$_id.data.statement"
                }
            }
        },
        {
            $sort: sort
        },
        {
            $group: {
                _id: {
                    count: "$count"
                },
                data: {
                    $push: "$data"
                }
            }
        },
        {
            $project: {
                _id: 0,
                count: "$_id.count",
                data: 1
            }
        }
    ];
};
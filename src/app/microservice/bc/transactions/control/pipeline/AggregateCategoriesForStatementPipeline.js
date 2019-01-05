module.exports = function getCategoriesSummaryForStatement(statementId) {
    return [
        {
            $match: {$and: [{"categories.0": {$exists: true}}, {statement: statementId}]}
        },
        {
            $project: {description: 1, amount: 1, categories: 1}
        },
        {
            $unwind: {path: "$categories"}
        },
        {
            $lookup: {from: 'categories', localField: 'categories', foreignField: '_id', as: 'categories'}
        },
        {
            $unwind: {path: "$categories"}
        },
        {
            $project: {"categories.tags": 0, "categories.regex": 0}
        },
        {
            $group: {
                _id: {categories: "$categories"},
                count: {$sum: 1},
                amount: {$sum: "$amount"}
            }
        },
        {
            $group: {
                _id: null,
                categories: {
                    $push: "$$CURRENT"
                }
            }
        },
        {
            $unwind: {path: "$categories"}
        },
        {
            $project: {
                "categories": {
                    _id: "$categories._id.categories._id",
                    name: "$categories._id.categories.name",
                    count: "$categories.count",
                    amount: "$categories.amount"
                }
            }
        },
        {
            $group: {
                _id: null,
                categories: {
                    $push: "$categories"
                }
            }
        },
        {
            $project: {_id: 0}
        }
    ];
};
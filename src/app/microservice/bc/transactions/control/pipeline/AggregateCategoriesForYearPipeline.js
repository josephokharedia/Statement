module.exports = function categoriesSummaryByYear(year) {
    return [
        {
            $match: {
                "categories.0": {
                    $exists: true
                }
            }
        }, {
            $project: {
                description: 1,
                amount: 1,
                categories: 1,
                year: {
                    $year: "$date"
                },
                month: {
                    $month: "$date"
                },
                day: {
                    $dayOfMonth: "$date"
                }
            }
        }, {
            $match: {
                year: {
                    $eq: year
                }
            }
        }, {
            $unwind: {
                path: "$categories"
            }
        }, {
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories'
            }
        }, {
            $unwind: {
                path: "$categories"
            }
        }, {
            $project: {
                "categories.tags": 0,
                "categories.regex": 0
            }
        }, {
            $group: {
                _id: {
                    year: "$year",
                    month: "$month",
                    categories: "$categories"
                },
                count: {
                    $sum: 1
                },
                amount: {
                    $sum: "$amount"
                }
            }
        }, {
            $group: {
                _id: {
                    year: "$_id.year",
                    month: "$_id.month"
                },
                categories: {
                    $push: "$$CURRENT"
                }
            }
        }, {
            $unwind: {
                path: "$categories"
            }
        }, {
            $project: {
                "categories": {
                    _id: "$categories._id.categories._id",
                    name: "$categories._id.categories.name",
                    count: "$categories.count",
                    amount: "$categories.amount"
                }
            }
        }, {
            $group: {
                _id: {
                    year: "$_id.year",
                    month: "$_id.month"
                },
                categories: {
                    $push: "$categories"
                }
            }
        }, {
            $project: {
                _id: 0,
                date: "$_id",
                categories: 1
            }
        }
    ];
};
module.exports = function getStatementDetails(statementId) {

    return [
        {
            $match: {
                _id: statementId
            }
        }, {
            $project: {
                raw: 0,
                id: 0
            }
        }, {
            $lookup: {
                from: 'transactions',
                localField: '_id',
                foreignField: 'statement',
                as: 'transactions'
            }
        }, {
            $unwind: {
                path: "$transactions"
            }
        }, {
            $project: {
                "transactions.id": 0,
                "transactions.statement": 0,
                "transactions.tags": 0,
                "transactions.categories": 0
            }
        }, {
            $sort: {
                "transactions.date": 1,
                "transactions._id": 1
            }
        }, {
            $group: {
                _id: {
                    id: "$_id",
                    accountNumber: "$accountNumber",
                    accountDescription: "$accountDescription",
                    institution: "$institution"
                },
                openingBalance: {
                    $first: "$transactions.balance"
                },
                closingBalance: {
                    $last: "$transactions.balance"
                },
                fromDate: {
                    $first: "$transactions.date"
                },
                toDate: {
                    $last: "$transactions.date"
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            {
                                $gte: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions.amount", 0
                        ]
                    }
                },
                totalDebit: {
                    $sum: {
                        $cond: [
                            {
                                $lte: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions.amount", 0
                        ]
                    }
                },
                credits: {
                    $push: {
                        $cond: [
                            {
                                $gte: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions", null
                        ]
                    }
                },
                debits: {
                    $push: {
                        $cond: [
                            {
                                $lt: [
                                    "$transactions.amount", 0
                                ]
                            }, "$transactions", null
                        ]
                    }
                },
                data: {
                    $push: "$transactions"
                }
            }
        }, {
            $project: {
                _id: 0,
                id: "$_id.id",
                accountNumber: "$_id.accountNumber",
                accountDescription: "$_id.accountDescription",
                institution: "$_id.institution",
                openingBalance: 1,
                closingBalance: 1,
                totalCredit: 1,
                totalDebit: 1,
                fromDate: 1,
                toDate: 1,
                transactions: {
                    credits: {
                        $filter: {
                            input: "$credits",
                            as: "itm",
                            cond: {
                                $ne: [
                                    "$$itm", null
                                ]
                            }
                        }
                    },
                    debits: {
                        $filter: {
                            input: "$debits",
                            as: "itm",
                            cond: {
                                $ne: [
                                    "$$itm", null
                                ]
                            }
                        }
                    },
                    data: "$data"
                }
            }
        }
    ];
};
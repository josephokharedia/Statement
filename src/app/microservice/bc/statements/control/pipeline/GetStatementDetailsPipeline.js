module.exports = function getStatementDetails(statementId) {

    return [
        {
            $match: {
                _id: statementId
            }
        },
        {
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
        },
        {
            $sort: {
                "transactions.date": 1,
                "transactions._id": 1
            }
        }, {
            $group: {
                _id: {
                    id: "$_id",
                    accountNumber: "$accountNumber",
                    statementNumber: "$statementNumber",
                    accountDescription: "$accountDescription",
                    institution: "$institution",
                    hashCode: '$hashCode',
                    attachment: '$attachment'
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
                _id: "$_id.id",
                accountNumber: "$_id.accountNumber",
                statementNumber: "$_id.statementNumber",
                accountDescription: "$_id.accountDescription",
                institution: "$_id.institution",
                hashCode: '$_id.hashCode',
                attachment: '$_id.attachment',
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
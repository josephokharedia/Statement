const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');
const readline = require('readline');
const dateFormat = require('dateformat');
const FNBStatement = require('./FNBStatement');
const NedbankStatement = require('./NedbankStatement');
const util = require('util');

const parser = parse({
    relax_column_count: true,
    ltrim: true,
    rtrim: true
});

const fnbStatement = new NedbankStatement();
parser.on('data', (chunk) => {
    if (chunk && (chunk instanceof Array) && chunk.length) {
        fnbStatement.process(chunk);
    }
});

parser.on('end', () => {
    console.log(util.inspect(fnbStatement, false, null, true));
    console.log(fnbStatement.statement.transactions.length);
});


const csvReadStream = fs.createReadStream(path.join(__dirname, '/Nedbank-Statement.csv'));
const rl = readline.createInterface({input: csvReadStream});

rl.on('line', (line) => {
    parser.write(line);
    parser.write('\n');
});

rl.on('close', () => parser.end());

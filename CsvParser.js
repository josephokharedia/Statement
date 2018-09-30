const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');
const readline = require('readline');
const dateFormat = require('dateformat');

const parser = parse({
    relax_column_count: true,
    ltrim: true,
    rtrim: true
});

parser.on('data', (chunk) => {
    if (chunk && (chunk instanceof Array) && chunk.length && /[0-9]{2}[a-zA-Z]{3}[0-9]{4}/.test(chunk[0])) {
        chunk[0] = dateFormat(new Date(chunk[0]), "dd-mm-yyyy");
        chunk.unshift(hash(chunk, {algorithm: 'md5'}));
        console.log(chunk);
    }
});


const csvReadStream = fs.createReadStream(path.join(__dirname, '/Statement.csv'));
const rl = readline.createInterface({input: csvReadStream});

rl.on('line', (line) => {
    parser.write(line);
    parser.write('\n');
});

// csvReadStream.pipe(parser);

# word2vec-stream
Process your massive **word2vec** binary model file as a readable stream of records.

## Purpose

Word2vec models are typically distributed as massive binary files (for instance, the [standard GoogleNews set](https://drive.google.com/file/d/0B7XkCwpI5KDYNlNUTTlSS21pQmM/edit) is several gigs once unzipped).
In some cases, you may wish to process these models and persist all or part of their contents to a database or other source, without hitting the considerable memory usage needed to read it all into memory at once. 

This tiny library is merely a handy function that parses the binary format and offers a readable stream of objects containing the word and the value (array of vectors).

## Usage

The function exported by `word2vec-stream` returns a promise, which resolves to a readable stream:

```js
const word2vecStream = require('word2vec-stream');

word2vecStream('./path-to-your-model.bin').then((vectorStream) => { 
  let myRecords = [];

  const readInOne = () => {
    const nextWord = vectorStream.read();
    if (nextWord===null) return;

    myRecords.push(nextWord);  // just pushing onto an array here, but normally you'd write to a db, etc
    readInOne();
  }

  vectorStream.on('readable', () => {
    readInOne();
  });

  vectorStream.on('end', () => {
    // you've processed all words now
  });
});
```

A single word object looks like this:

```js
{ word: 'runs',
  values: [
     -0.03380169719457626,
     0.05194384977221489,
     -0.03704818710684776,
     0.016614392399787903,
     0.0660756304860115,
     0.030364234000444412,
     -0.028072593733668327,
     -0.16270646452903748,
     -0.038575947284698486,
     0.12756797671318054,
     // ... as many vectors as dimensions here
  }
}
```


Or examine and run the demo.js file for a quick example (dumping records to console). Included tests also demonstrate basic invocation.

```
$ node demo.js
```

Thanks to [node-word2vec](https://github.com/Planeshifter/node-word2vec) for illustrating the basic syntax of parsing the binary format in node.


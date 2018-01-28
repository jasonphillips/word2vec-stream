const word2vecStream = require('./');

word2vecStream('./fixture/test.bin')
  .then(stream => {

    const readMore = () => {
      const nextObj = stream.read();
      if (nextObj===null) return;

      console.log(nextObj);
      readMore();
    }

    stream.on('readable', () => {
      readMore();
    });

    stream.on('end', () => {
      console.log('END')
    });
  });


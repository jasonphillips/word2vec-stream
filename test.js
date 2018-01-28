const expect = require('chai').expect;
const Stream = require('stream');
const word2vecStream = require('./');

describe('word2vec-stream', () => {
  it('returns a promise resolving a readable stream', () => {
    return word2vecStream('./fixture/test.bin').then((response) => {
      expect(response).to.be.instanceOf(Stream.Readable);
      response.destroy();
    });
  });

  it('rejects properly on file error', (done) => {
    word2vecStream('./fixture/not_a_file.bin')
      .then(() => done('should have rejected'))
      .catch(() => done());
  });

  it('resolves each word as a keyed object with {word, values}', (done) => {
    word2vecStream('./fixture/test.bin').then((vectorStream) => {
      // ensure just once
      let read = false;

      vectorStream.on('readable', () => {
        if (read) return;
        read = true;

        const readOne = vectorStream.read();
        expect(readOne).to.have.keys('word', 'values');
        expect(readOne.values).to.be.instanceOf(Float32Array);

        vectorStream.destroy();
        done();
      });
    });
  });

  it('closes correctly after sending all records', (done) => {
    word2vecStream('./fixture/test.bin').then((vectorStream) => { 
      let myRecords = [];

      const readInOne = () => {
        const nextWord = vectorStream.read();
        if (nextWord===null) return;

        myRecords.push(nextWord);
        readInOne();
      }
      
      vectorStream.on('readable', () => {
        readInOne();
      });

      vectorStream.on('end', () => {
        expect(myRecords).to.have.length(34);
        expect(myRecords[0]).to.have.keys('word', 'values');
        expect(myRecords[33]).to.have.keys('word', 'values');
        done();
      });

    });
  });
});
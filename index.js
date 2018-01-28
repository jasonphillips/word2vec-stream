const fs = require('fs');
const Stream = require('stream');
const MAX_STRING = 100;

/**
 * streamBinaryModel
 * 
 * @param {String} binpath - path to word2vector binary model file
 * @returns {Promise} - resolves to readable string of (object) records
 */

function streamBinaryModel(binpath) {    
  return new Promise(function(resolve, reject) {
    const outstream = new Stream.Readable({objectMode: true});    
    const instream = fs.createReadStream(binpath);
    // metadata
    let arr, words, size, pos;

    instream.on('error', reject);

    instream.on('end', () => outstream.emit('end'));

    const readNext = function() {
      let wordBuffer = instream.read(MAX_STRING + size * 4);
      let off = 0; // offset
      if (wordBuffer===null) return;
                    
      let word = wordBuffer.toString().split(' ')[0];

      if (!word || word.length===0) {
        // we must have eaten a dead space at beginning
        wordBuffer = wordBuffer.slice(1);
        off += 1;
      }

      const values = new Float32Array(size);
                  
      off += word.length + 1;
      for (let i = 0; i < size; i++) {
        try {
          values[i] = wordBuffer.readFloatLE(off);
        } catch(e) { 
          // our data must be at an end, return early
          return;
        }
        off += 4;
      }
                
      // normalize 
      const len = Math.sqrt(values.reduce(function (added, val) { return added + val * val }, 0));
      
      for (let a = 0; a < size; a++) {
        values[a] = values[a] / len;
      }
        
      // we read too much, push remainder back onto stack
      const actualLength = word.length + 1 + size * 4;
      if (actualLength < wordBuffer.length) {
          instream.unshift(wordBuffer.slice(actualLength));
      }
      
      outstream.push({word: word.trim(), values: values});
    }
    
    instream.on('readable', function() { 
      if (size) {
        // already read metadata; simply notify to resume
        readNext();
        return;
      }

      // read metadata once 
      const buffer = instream.read(50);
      if (!buffer) outstream.push(null);

      arr = buffer.toString().split(/[ \n]/);
      words = parseInt( arr[0], 10 );
      size = parseInt( arr[1], 10 );
      pos = arr[0].length + arr[1].length + 2;
      
      if (pos < 50) instream.unshift(buffer.slice(pos));
            
      outstream._read = readNext;
        
      resolve(outstream);
    });
  });
}

module.exports = streamBinaryModel;
import {Transform} from 'node:stream'

const streamData = new Transform({
  objectMode: true,
});

streamData._transform = function (chunk, encoding, callback) {
  callback(null, JSON.stringify(chunk))
}

export default streamData;
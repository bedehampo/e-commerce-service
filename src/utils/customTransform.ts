import { Transform } from 'stream';

export class CustomTransform extends Transform {
  isWritten = false;

  constructor(options?: any) {
    super({ objectMode: true, ...options });
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    if (!this.isWritten) {
      this.isWritten = true;
      callback(null, '[' + JSON.stringify(chunk));
    } else {
      callback(null, ',' + JSON.stringify(chunk));
    }
  }

  _flush(callback: Function) {
    callback(null, ']');
  }
}
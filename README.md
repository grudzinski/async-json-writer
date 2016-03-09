# async-json-writer

## Install

```bash
npm install async-json-writer
```

## Use

```js
'use strict';

const asyncJsonWriter = require('async-json-writer')
const fs = require('fs');

const hugeObject = {};
const out = fs.createWriteStream('out.json');

asyncJsonWriter(out, hugeObject, function(err) {
  if (err) {
    console.error('Error', err);
    return;
  }
  console.log('Done');
});
```

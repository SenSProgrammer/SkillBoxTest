//скрипт создает или перезаписывает файл с хеш суммой для файла переданного первым параметром

// Importing crypto module
const crypto = require('crypto');
const fs = require('fs');

// Getting the current file path
const filename = process.argv[2];

fs.readFile(filename,"utf8" , (err, data) =>{
  if (err) {
    console.error(err);
    process.exit(100);
  }
  console.log(data);
 });

// Creting hash for current path using secret
const hash = crypto.createHash('sha256');

const input = fs.createReadStream(filename);
input.on('readable', () => {
   // Reading single element produced by hash stream.
   const val = input.read();

   if (val)
      hash.update(val);
   else {
       //записываем сумму хеша
       fs.writeFileSync(filename+'.sha256',`${hash.digest('hex')}`,'utf8'); //синхронная
    }
});


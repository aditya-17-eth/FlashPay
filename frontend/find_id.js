const { StrKey } = require('@stellar/stellar-sdk');
const str = 'CBZOXJQRU2V3XYXF45H32X4I4S24OQRKVZVZ6W7I3B3GVKR3F4Z7AIF';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
for (let i = 0; i <= str.length; i++) {
  for (const char of alphabet) {
    const candidate = str.slice(0, i) + char + str.slice(i);
    try {
      StrKey.decodeContract(candidate);
      console.log('Found valid ID: ' + candidate);
      process.exit(0);
    } catch (e) {}
  }
}
console.log('None found');

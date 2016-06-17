const test = require('tape')
const umlGen = require('../')

test('tally output', function(t) {
  var input = {
    accounts: {
      '0x0a': {
        address: '0x0a',
        nickname: 'theDAO',
      },
      '0x0b': {
        address: '0x0b',
        nickname: 'theAttacker',
      },
    },
    calls: [{
      sequence: 0,
      fromAddress: '0x0a',
      toAddress: '0x0b',
      value: '0x01',
      gasLimit: '0x01',
      inOffset: '0x01',
      inLength: '0x01',
      outOffset: '0x01',
      outLength: '0x01',
    }],
  }
  const output = umlGen(input)

  console.dir(output)

})

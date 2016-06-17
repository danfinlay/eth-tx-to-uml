const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

var valueTable = {
  wei:   '1000000000000000000',
  kwei:  '1000000000000000',
  mwei:  '1000000000000',
  gwei:  '1000000000',
  szabo: '1000000',
  finney:'1000',
  ether: '1',
  kether:'0.001',
  mether:'0.000001',
  gether:'0.000000001',
  tether:'0.000000000001',
}

// This module takes a transaction analysis object
// and returns UML for displaying a graph of its activity.

/* The analysis object should follow this pattern:
 nodes[] are contracts
      (id) address
edges[] are calls
      from: (originator)
      gasLimit: step.stack.pop(),
      toAddress: step.stack.pop(),
      value: step.stack.pop(),
      inOffset: step.stack.pop(),
      inLength: step.stack.pop(),
      outOffset: step.stack.pop(),
      outLength: step.stack.pop(),
*/

var nodes, edges
module.exports = function(transaction) {
  nodes = []
  for(let acct in transaction.accounts) {
    nodes.push(transaction.accounts[acct])
  }
  edges = transaction.calls

  var result = nodes.map(node => `[${node.address}]`).join('\n')
  result += '\n'

  var edgeTally = generateEdgeTally(nodes, edges)

  result += edgeTally.map(tally => `[${tally.from}]${tally.ethStr()}:=>[${tally.toAddress}]\n`)

  return result
}

// Generate Edge Tally
// Takes nodes and edges, returns an array of objects of this form:
/*  [{
 *    from: '0x...',
 *    toAddress: '0x...',
 *    totalValue: '0x...',
 *    calls: [ edge indexes... ]
 *  }]
 */
function generateEdgeTally (nodes, edges) {
  var result = []

  edges.forEach((edge, i, edges) => {
    let tallyFound = false

    result.forEach((tally) => {
      if (result.from === edge.fromAddress &&
          result.toAddress === edge.toAddress) {
        tallyFound = true
        tally.calls++
        tally.totalValue.add(new BN(edge.value, 16), 16)
      }
    })

    if (!tallyFound) {
      let tally = {
        from: edge.fromAddress,
        toAddress: edge.toAddress,
        totalValue: new BN(edge.value, 16),
        calls: [i],
        ethStr: function() {
          console.log(this.totalValue.toString(10))
          return `${formatBalance(this.totalValue.toString(10, 18), 2)} over ${this.calls.length} txs`
        },
      }
      result.push(tally)
    }
  })

  return result
}




// Takes wei hex, returns "None" or "${formattedAmount} ETH"
function formatBalance(balance, decimalsToKeep) {
  var parsed = parseBalance(balance)
  var beforeDecimal = parsed[0]
  var afterDecimal = parsed[1]
  var formatted = "None"
  if(decimalsToKeep === undefined){
    if(beforeDecimal === '0'){
      if(afterDecimal !== '0'){
        var sigFigs = afterDecimal.match(/^0*(.{2})/) //default: grabs 2 most significant digits
        if(sigFigs){afterDecimal = sigFigs[0]}
        formatted = '0.' + afterDecimal + ' ETH'
      }
    }else{
      formatted = beforeDecimal + "." + afterDecimal.slice(0,3) + ' ETH'
    }
  }else{
    afterDecimal += Array(decimalsToKeep).join("0")
    formatted = beforeDecimal + "." + afterDecimal.slice(0,decimalsToKeep) + ' ETH'
  }
  return formatted
}

// Takes  hex, returns [beforeDecimal, afterDecimal]
function parseBalance(balance) {
  if (!balance || balance === '0x0') return ['0', '0']
  var wei = numericBalance(balance).toString(10)
  var eth = String(wei/valueTable['wei'])
  var beforeDecimal = String(Math.floor(eth))
  var afterDecimal
  if(eth.indexOf('.') > -1){
    afterDecimal = eth.slice(eth.indexOf('.') + 1)
  }else{
    afterDecimal = '0'
  }
  return [beforeDecimal, afterDecimal]
}

// Takes wei Hex, returns wei BN, even if input is null
function numericBalance(balance) {
  if (!balance) return new ethUtil.BN(0, 16)
  var stripped = ethUtil.stripHexPrefix(balance)
  return new ethUtil.BN(stripped, 16)
}

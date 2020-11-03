const ping = require('ping');

var conf = {
  timeout: 10,
  extra: ['-i', '3']
}

module.exports = {
  checkLife: host => {
    return new Promise((resolve, _) => {
      ping.sys.probe(host, isAlive => {
        resolve(isAlive);
      }, conf);
    })
  }
}
const snmp = require('net-snmp');

exports.options = {
  port: 161,
  retries: 3,
  timeout: 5000,
  transport: "udp4",
  trapPort: 162,
  version: snmp.Version3,
  idBitsSize: 32,
  context: ""
};

exports.user = {
  name: "admin-teste",
  level: snmp.SecurityLevel.authPriv,
  authProtocol: snmp.AuthProtocols.md5,
  authKey: "cisco-write",
  privProtocol: snmp.PrivProtocols.des,
  privKey: "cisco-write"
};

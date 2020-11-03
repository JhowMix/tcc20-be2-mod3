const snmp = require('net-snmp');

const name = (session, name) => {
  let varbinds = [
    {
      oid: '1.3.6.1.2.1.1.5.0',
      type: snmp.ObjectType.OctetString,
      value: name
    }
  ];

  return new Promise((resolve, reject) => {
    session.set(varbinds, (error, res) => {
      if(error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

const interfaceState = (session, ifIndex, state) => {
  let varbinds = [
    {
      oid: `1.3.6.1.2.1.2.2.1.8.${ifIndex}`,
      type: snmp.ObjectType.Integer,
      value: state
    }
  ];

  return new Promise((resolve, reject) => {
    session.set(varbinds, (error, res) => {
      if(error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
};

module.exports = {
  name,
  interfaceState
};
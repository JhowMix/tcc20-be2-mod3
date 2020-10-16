const snmp = require('net-snmp');
const user = require('./settings/snmp').user;
const options = require('./settings/snmp').options;
const fetchRouter = require('./snmp/routerFactory');
const client = require('./settings/dbase');

var session1 = snmp.createV3Session("172.20.0.200", user, options);
var session2 = snmp.createV3Session("200.0.0.2", user, options);
var session3 = snmp.createV3Session("200.0.0.6", user, options);


client.connect(err => {
  const collection = client.db("tcc_dev").collection("devices");

  if (err) {
    console.error(err);
  } else {
    setInterval(() => {
      Promise.all([
        fetchRouter(session1),
        fetchRouter(session2),
        fetchRouter(session3)])
        .then(results => {
          console.log('\nOperation at: ' + new Date());
          results.forEach(value => {
            collection.findOneAndUpdate(
              { engineID: value.engineID },
              { $set: value },
              { upsert: true },
              (err, doc) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log('Router w/EnID: ' + doc.value.engineID);
                }
              });
          });
        });
    }, 5000);
  }
});




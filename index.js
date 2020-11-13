const express = require('express');
const deviceResource = require('./routes/device');
const snmp = require('net-snmp');

const { fetch } = require('./snmp/router-factory');
const { checkLife } = require('./utils/connection');
const { save, fetchAllLoopback } = require('./repository/device-repository');

const { client } = require('./settings/dbase');
const { user, options } = require('./settings/snmp');

const app = express();
const port = 3000;

client.connect(err => {
  if (err)
    throw Error(`Falha ao conectar-se com a base de dados: ${err}`);

  let db = client.db('tcc_dev');

  setInterval(async () => {
    let loopbks = await fetchAllLoopback(db);

    for(const i of loopbks) {
      let isAlive = await checkLife(i.loopback_addr);
      
      if(isAlive) {
        let session = snmp.createV3Session(i.loopback_addr, user, options)
        fetch(session)
          .then(device => {
            // session.close();
            save(db, device);
          });
      }
    }
  }, 5000)
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/device', deviceResource);

app.listen(port, () => {
  console.log(`Service online at http://172.20.0.221:${port}`);
});

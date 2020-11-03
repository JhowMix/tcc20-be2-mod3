const express = require('express');
const snmp = require('net-snmp');

const { fetch } = require('../snmp/router-factory');
const { checkLife } = require('../utils/connection');
const { save, recordLoopback } = require('../repository/device-repository')

const { client } = require('../settings/dbase');
const { user, options } = require('../settings/snmp');

const router = express.Router();

client.connect(err => {
  if (err)
    throw Error(`Falha ao conectar-se com a base de dados: ${err}`);

  const db = client.db('tcc_dev');

  router.post('/check', async (req, res) => {
    let alive = await checkLife(req.body.ipv4);
    res.json({ alive });
  });

  router.post('/scan', async (req, res) => {
    let session = snmp.createV3Session(req.body.ipv4, user, options)
    let device = await fetch(session);

    await recordLoopback(db, device.engineId, session.target);
    save(db, device)
      .then(result => {
        console.log(result);
        res.json(device);
      })
      .catch(err => {
        throw Error(err);
      })
  });
});


module.exports = router;

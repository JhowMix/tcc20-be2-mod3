module.exports = {
  save: (db, device) => {
    return new Promise((resolve, reject) => {
      let devices = db.collection("devices");

      devices
        .findOneAndUpdate(
          { engineId: device.engineId },
          { $set: device },
          { upsert: true },
          (err, _) => {
            if (err) {
              reject(`Erro ao inserir/atualizar registro: ${err}`);
            } else {
              resolve('Registro inserido/atualizado com sucesso');
            }
          });
    });
  },
  recordLoopback: (db, engineId, addr) => {
    return new Promise((resolve, _) => {
      let devices = db.collection("devices_loopback");
      let loopback = {
        engineId,
        loopback_addr: addr
      };

      devices
        .findOneAndUpdate(
          { engineId: engineId },
          { $set: loopback },
          { upsert: true },
          (err, _) => {
            if (err) {
              throw Error(`Erro ao inserir/atualizar registro: ${err}`);
            } else {
              resolve();
            }
          });
    });
  },
  fetchAllLoopback: db => {
    return new Promise((resolve, _) => {
      let devices = db.collection("devices_loopback");
      let cursor = devices.find({});

      cursor.toArray((err, result) => {
        if (err)
          throw Error(`Erro ao listar: ${err}`);
        resolve(result)
      });
    });
  }
};
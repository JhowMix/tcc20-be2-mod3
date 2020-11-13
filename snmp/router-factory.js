const Port = require('../model/port');
const Address = require('../model/address.js');
const Router = require('../model/device-router.js');

const client = require('../settings/dbase');

const ifNumber = session => {
  let oid = ['1.3.6.1.2.1.2.1.0'];
  let getOp = new Promise((resolve, _) => {
    session.get(oid, (error, varbinds) => {
      if (error) {
        throw error;
      } else {
        resolve(varbinds[0].value);
      }
    });
  });

  return getOp;
}

const listIPv4 = session => {
  let oid = ['1.3.6.1.2.1.4.20.1.2.0'];

  let promise = new Promise((resolve, _) => {
    session.getBulk(oid, (error, varbinds) => {
      if (error) {
        throw error;
      } else {
        resolve(varbinds[0]);
      }
    });
  });

  return promise;
}

const portsInfo = (session, ifNumber) => {
  let oids = [];
  let raw = [
    '1.3.6.1.2.1.2.2.1.8.',     //0 ifOperStatus     
    '1.3.6.1.2.1.2.2.1.16.',    //1 ifOoutOctetcs
    '1.3.6.1.2.1.2.2.1.9.',     //2 ifLastChange
    '1.3.6.1.2.1.2.2.1.5.',     //3 IfSpeed
    '1.3.6.1.2.1.2.2.1.2.',    //4 ifDescr
    '1.3.6.1.2.1.2.2.1.6.'];    //5 IfPhysAddress



  let promise = new Promise((resolve, _) => {
    for (const i of new Array(ifNumber).keys()) {
      let test = [];
      for (const j of raw) {
        test.push(j + (i + 1));
      }
  
      session.get(test, (error, varbinds) => {
        if (error) {
          console.log(error)
          throw error;
        } else {
          oids.push(...varbinds);
        }
      });
  
      if(i === ifNumber - 1) resolve(oids);
    }
  });

  return promise;
}

const listPort = (raw, ifNumber) => {
  let ports = []
  for (let i = 0; i < ifNumber; i++) {
    let pt = new Port();
    let ifIndex = (i + 1);
    let bandwidth = 0;
    let ifOut = 0;
    for (const j of raw) {
      switch (j.oid) {
        case '1.3.6.1.2.1.2.2.1.8.' + ifIndex:
          pt.state = j.value;
          break;
        case '1.3.6.1.2.1.2.2.1.9.' + ifIndex:
          pt.lastChange = j.value;
          break;
        case '1.3.6.1.2.1.2.2.1.2.' + ifIndex:
          pt.name = j.value ? j.value.toString() : undefined;
          break;
        case '1.3.6.1.2.1.2.2.1.6.' + ifIndex:
          pt.phyAddress = j.value ? j.value.toString('hex') : undefined;
          break;
        case '1.3.6.1.2.1.2.2.1.5.' + ifIndex:
          bandwidth = j.value
          break;
        case '1.3.6.1.2.1.2.2.1.16.' + ifIndex:
          ifOut = j.value
      }
    }

    pt.throughput = pt.state == 2 ? 0 : (ifOut / 8) / 1000;
    pt.throughput = isNaN(pt.throughput) ? 0 : pt.throughput;
    pt.index = ifIndex

    bandwidth = 0;
    ifOut = 0;
    ports.push(pt);
  }

  return ports;
}

const deviceInfo = session => {
  let oids = [
    '1.3.6.1.6.3.10.2.1.1.0',           //0 snmpEngineID   
    '1.3.6.1.2.1.1.5.0',                //1 deviceName
    '1.3.6.1.2.1.1.3.0',                //2 upTime
    '1.3.6.1.4.1.9.9.25.1.1.1.2.5',     //3 ciscoImageString
    '1.3.6.1.4.1.9.3.6.3.0',            //4 chassiID
    '1.3.6.1.4.1.9.9.25.1.1.1.2.3',     //5 ciscoDeviceFamily
    '1.3.6.1.4.1.9.9.109.1.1.1.1.10.1']  //6 cpmCPUMonInterval

  let promise = new Promise((resolve, _) => {
    session.get(oids, (error, varbinds) => {
      try {
        if (error) {
          throw Error(`Erro na comunicação com protocolo SNMPv3 c/ alvo: ${session.target}`);
        } else {
          resolve(varbinds);
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  return promise;
}

const rawDevice = raw => {
  let router = new Router();
  router.name = raw[1].value.toString();
  router.engineId = raw[0].value.toString('hex');
  router.deviceFamily = raw[5].value.toString().split('$')[1];
  router.status = 'On';
  router.lastChecking = new Date();
  router.osVersion = raw[3].value.toString().split('$')[1];
  router.upTime = raw[2].value;
  router.cpuUsage = raw[6].value;

  return router;
}

const attachIPv4 = (port, ipv4s) => {
  let inetAddress = new Address();
  for (const i of ipv4s) {
    if (i.oid.includes('1.3.6.1.2.1.4.20.1.2.') && (i.value === port.index)) {
      inetAddress.ipv4 = i.oid.substr(21, i.oid.length - 1);
    }
    if (('1.3.6.1.2.1.4.20.1.3.' + inetAddress.ipv4) === i.oid.toString()) {
      inetAddress.mask4 = i.value.toString();
      break;
    }
  }

  port.addresses.push(inetAddress);
}

const devThroughput = ports => {
  let totalAv = 0.0;
  let counter = 0;

  for (const i of ports) {
    if (i.throughput > 0) {
      totalAv += i.throughput
      counter++;
    }
  }
  return isNaN(parseFloat(totalAv) / parseFloat(counter)) ? 0 : parseFloat(totalAv) / parseFloat(counter);
}

module.exports = {
  fetch: async session => {
    try {
      let infoDev = await deviceInfo(session);
      let ifNumb = await ifNumber(session);
      let infoInt = await portsInfo(session, ifNumb);
      let rawIpv4s = await listIPv4(session);
      let ports = listPort(infoInt, ifNumb);
      let router = rawDevice(infoDev);
      let totalAv = devThroughput(ports);

      for (const i of ports) {
        attachIPv4(i, rawIpv4s);
      }

      router.throughputAverage = totalAv;
      router.ports = ports;

      return router;
    } catch (err) {
      console.error(errr);
    }
    return;
  },
  fillBuffer: device => {
    return new Promise((resolve, reject) => {
      let ports = device.ports;
      let value = {
        engineId: device.engineId,
        addresses: []
      }

      ports.forEach((port, index) => {
        let address =
          port.addresses
            .filter(addr => addr.ipv4.trim().length > 0)
            .map(addr => addr.ipv4);

        if (address.length > 0) {
          value.addresses.push(address[0]);
        }

        if (index == ports.length - 1) {
          resolve(value);
        }
      });
    });
  }
};

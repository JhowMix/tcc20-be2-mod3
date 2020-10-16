class Port {
    index = undefined;
    name = '';
    phyAddress = '00-00-00-00-00-00';
    throughput = undefined;
    state = 2;
    lastChange = 0;
    addresses = [];
}

module.exports = Port;
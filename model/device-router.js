class Router {
    engineID = '';
    name = '';
    deviceFamily = '';
    osVersion = '';
    platform = 'Cisco IOS';
    status = 'off';
    upTime = 0;
    lastChecking = undefined;
    throughputAverage = undefined;
    ports = [];
}

module.exports = Router;
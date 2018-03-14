

const argv = require("optimist")
    .usage("Usage: $0 --xt [倍率] --filter [规则]")
    .default("xt", 1)
    .default("filter", "ip")
    .argv;
const network = require("network");
const Cap = require("cap").Cap;
const Raw = require("raw-socket");

function getDefaultGateway() {
    return new Promise((reslove, reject) => {
        network.get_gateway_ip(function (err, ip) {
            err ? reject(err) : reslove(ip);
        });
    });
}

function getDefaultIp(defaultGateway) {
    return new Promise((reslove, reject) => {
        network.get_gateway_ip(function (err, ip) {
            if (err) {
                return reject(err);
            }

            network.get_interfaces_list(function (err, list) {
                if (err) {
                    return reject(err);
                }
                for (const item of list) {
                    if (item.gateway_ip == defaultGateway) {
                        return reslove(item.ip_address);
                    }
                }
                reslove(null);
            });
        });
    });
}

getDefaultGateway().then(defaultGateway => {
    return getDefaultIp(defaultGateway);
}).then(defaultIp => {
    /* 注册Pcap */
    var cap = new Cap();
    var device = Cap.findDevice(defaultIp);
    var filter = argv.filter;
    var bufSize = 10 * 1024 * 1024;
    var buffer = Buffer.alloc(65535);
    var linkType = cap.open(device, filter, bufSize, buffer);
    cap.setMinBytes && cap.setMinBytes(0);

    /* 注册RawScoket */
    var rawsocket = Raw.createSocket({
        protocol: Raw.Protocol.UDP
    });
    rawsocket.setOption(Raw.SocketLevel.IPPROTO_IP, Raw.SocketOption.IP_HDRINCL, new Buffer([0x00, 0x00, 0x00, 0x01]), 4);

    const xt = parseInt(argv.xt);
    const speaceTtl = 0x7B;

    cap.on("packet", (nbytes) => {
        /* Ethernet + IP/TCP */
        if (nbytes < 34) return;
        if (buffer[22] == speaceTtl) return;
        buffer[22] = speaceTtl;

        var sendingBuffer = buffer.slice(14, nbytes);
        var targetAddress = `${sendingBuffer[16].toString(10)}.${sendingBuffer[17].toString(10)}.${sendingBuffer[18].toString(10)}.${sendingBuffer[19].toString(10)}`;
        if(defaultIp == targetAddress) return;
        for (var i = 1; i < xt; i++) {
            rawsocket.send(sendingBuffer, 0, sendingBuffer.length, targetAddress, function (error, bytes) {
                if (error) {
                    console.error(`Send packet failed: ${error.message}.`);
                }
            });
        }
    })
}).catch(console.error);


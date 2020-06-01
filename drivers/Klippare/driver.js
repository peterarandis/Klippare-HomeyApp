"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class H60Driver extends Homey.Driver {

  onPair(socket) {
	this.log("Pairing started...")
	const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let devicesArray = {};
	let deviceArray = {};

    socket.on('list_devices', (data, callback) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
         this.log("Found device: " + discoveryResult.address + " " + discoveryResult.id);
	     // push discovered device to temporary array with all discovered devices
		 devicesArray[discoveryResult.id]={
            name: 'KLIPP ['+ discoveryResult.address +']',
            data: {
              id: discoveryResult.id,
            },
            settings: {
              address  : discoveryResult.address
            }
          };

			return {
				name: 'KLIPP ['+ discoveryResult.address +']',
				data: {
					id: discoveryResult.id,
					}
			};
      });
      callback(null, devices);
    });

    socket.on('list_devices_selection', (data, callback) => { // Lists deiscovereed decices
	  callback();
      selectedDeviceId = data[0].data.id;
	  this.log("Selected device: " + selectedDeviceId)
	   // push the selected device to a temporary array which can be used for pairing
      deviceArray= devicesArray[selectedDeviceId];
    });
    

    socket.on('get_device', (data, callback) => {
	  callback(false, deviceArray);
      this.log("get_device done ");  
	});

  }

}

module.exports = H60Driver;

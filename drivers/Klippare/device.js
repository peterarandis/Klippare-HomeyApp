'use strict';
/*  FLOWS
Distance <9 och Klippstatus!=Charging 				   then  Klippstatus = Charging: skicka notis. Klippare Laddar
Distance >8 och Distance < 13 och Klippstatus!=Standby then  Klippstatus = Standby:  skicka notis. Klippare Standby
Distance >13 och Klippstatus!=Running                  then  Klippstatus = Running:  skicka notis. Klippare Kör
*/

const Homey = require('homey');
const util = require('/lib/util.js');
const DEBOUNCE_RATE = 500;
 
											 
class H60Device extends Homey.Device {
  
	
  onInit() {
    var interval = this.getSetting('polling') || 5;
	this.pollDevice(interval);
    this.setAvailable();
    this.log("onInit - address: " + this.getSetting('address'));   
	
	    
    // Register capabilities setting
	//this.registerMultipleCapabilityListener([ 'target_temperature' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	//this.registerMultipleCapabilityListener([ 'target_temperature.outdoor' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	
	// register flow triggers
	new Homey.FlowCardTriggerDevice('distance_changed').register();   
	new Homey.FlowCardTriggerDevice('status_changed').register();   
	
	
  }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }
  
  pollDevice(interval) {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    
    this.pollingInterval = setInterval(() => {
    	
	  //this.log("pollDevice " + this.getSetting('address') + " hp type: " + H60_Cable );
	  util.sendCommand('/api/alldata', this.getSetting('address'))
	    .then(result => {
			
			var v=0 ;
			var j=0;
			var s;
							
			v = result.distance; 
			v = Number(v);
	
			
			if (v != this.getCapabilityValue("DISTANCE")) {
				                                            this.setCapabilityValue("DISTANCE", v); 
															this.log("Distance = " + v); 
														    Homey.ManagerFlow.getCard('trigger', 'distance_changed').trigger(this, {distance_changed: v}, {});
												 		  }
			s = result.status; 											  
			if (s != this.getCapabilityValue("STATUS")) {
				                                            this.setCapabilityValue("STATUS", s); 
															this.log("Status = " + s); 
														    Homey.ManagerFlow.getCard('trigger', 'status_changed').trigger(this, {status_changed: s}, {});
												 		  }
			
		}
	)
	 
		  
        .catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
	 	
    }, 1000 * interval);
	
  }

  async onSetTargetTemperature(data, opts) {
    
	let value = data['target_temperature'];
    this.log('setting target temperature to', value);
    value = value * 10;
	util.sendCommand('/api/set?idx=0203&val=' + value, this.getSetting('address'))
	  .then(result => {
		  this.log('response Klippare: ' + result.response);
		  
	  })
	 
	.catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
	   
  }
  
  
  pingDevice() {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
	this.log("pingDevice " + this.getSetting('address'));

    this.pingInterval = setInterval(() => {
      util.sendCommand('/status', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
        .then(result => {
          this.setAvailable();
          var interval = this.getSetting('polling') || 5;
          this.pollDevice(interval);
        })
        .catch(error => {
          this.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');
        })
    }, 63000);
  }

}

module.exports = H60Device;

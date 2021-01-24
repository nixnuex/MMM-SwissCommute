/* global Module */

/* Magic Mirror
 * Module: MMM-SwissCommute
 *
 * By nixnuex
 * based on MMM-swisstransport (https://github.com/Bangee44/MMM-swisstransport)
 *
 * MIT Licensed.
 */

Module.register("MMM-SwissCommute",{
	// Define module defaults
	defaults: {
		updateInterval: 2 * 60 * 1000, // Update every 2 minutes. Note: search.ch API limit is 1000 requests per day
		animationSpeed: 2000,
		fade: false,
		fadePoint: 0.5, // Start on 1/4th of the list.
        initialLoadDelay: 0, // start delay seconds.

        domRefresh: 1000 * 30, // Refresh Dom each 30 s
		
        apiBase: 'http://fahrplan.search.ch/api/route.json',
        from: '',
        to: '',
		maximumEntries: 5, // Total Maximum Entries
        minWalkingTime: -1,
        hideTrackInfo: 0,
                
//		titleReplace: {
//			"Zeittabelle ": ""
//		}
	},
	
	requiresVersion: "2.1.0", // Required version of MagicMirror

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

        this.trains = [];
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		// Update DOM seperatly and not only on schedule Update
		var self = this;
		setInterval(function() {
			self.updateDom(this.config.animationSpeed);
		}, this.config.domRefresh);

		this.updateTimer = null;

	},   
	
	// Define required scripts.
	getStyles: function() {
		return ["MMM-SwissCommute.css", "font-awesome.css", "icomoon.css"];
        
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	}, 
    
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		var currentTime = moment();
		
		if (!this.config.from) {
			wrapper.innerHTML = "Invalid starting point";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		
		if (!this.config.to) {
			wrapper.innerHTML = "Invalid destination";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		
		if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.message) {
			wrapper.innerHTML = this.message;
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		
		var table = document.createElement("table");
		table.className = "small";

		for (var t in this.trains) {
			var trains = this.trains[t];

			var row = document.createElement("tr");
			table.appendChild(row);

			// Number & Icon
            var icon = "";
            switch(trains.type) {
                case "train":
                    icon = "icon2-zug";
                    break;
                case "strain":
                    icon = "icon2-zug";
                    break;
                case "bus":
                    icon = "icon2-bus";
                    break;
                case "post":
                    icon = "icon2-bus";
                    break;
                case "tram":
                    icon = "icon2-tram";
                    break;
                case "ship":
                    icon = "fa-ship";
                    break;
                case "cableway":
                    icon = "icon2-cc";
                    break;
				case "funicular":
					icon = "icon2-cc";
					  break;
                default:
                icon = "icon2-zug";
            }

			var trainNumberCell = document.createElement("td");
			trainNumberCell.innerHTML = "&nbsp; <i class=\"fa " + icon + "\"></i> " + trains.number;
			trainNumberCell.className = "type align-left border linie" + trains.number;
			row.appendChild(trainNumberCell);
			
			var trainNumber2Cell = document.createElement("td");
			trainNumber2Cell.innerHTML = ""
			trainNumber2Cell.className = "traintodist";
			row.appendChild(trainNumber2Cell);
			
			// Effektive Abfahrt, ab +3' in rot
			var departureCell = document.createElement("td");
			if((trains.delay > 0) && (trains.delay <= 2)) {
			var departure = moment(trains.departureTimestampRaw).add(trains.delay, 'm').format("HH:mm")
			departureCell.className = "departure";
			departureCell.innerHTML = departure;
			} else if(trains.delay > 2.1) {
			var departure = moment(trains.departureTimestampRaw).add(trains.delay, 'm').format("HH:mm")
			departureCell.className = "departure red";
			departureCell.innerHTML = departure;
			} else {
			departureCell.className = "departure";
			departureCell.innerHTML = trains.departureTimestamp;
			}
			row.appendChild(departureCell);

			// Time
			// var dTime = moment(trains.departureTimestampRaw);
		//	var diff = dTime.diff(currentTime, 'minutes');
//
	//		var depCell = document.createElement("td");
	//		depCell.className = "align-left departuretime";
	//		depCell.innerHTML = trains.departureTimestamp;
//
	//		if (diff <= this.config.minWalkingTime ){
	//			row.className = "red";
	//		}
//
	//		row.appendChild(depCell);
//
	//		// Delay
          //  var delayCell = document.createElement("td");
 //           if(trains.delay > 0) {
//                delayCell.className = "delay red";
//                delayCell.innerHTML = "+" + trains.delay + " min";
//            } else {
//              delayCell.className = "delay red";
//                delayCell.innerHTML = ""; //trains.delay;
//            }
 //           row.appendChild(delayCell);

			// Direction
			var trainToCell = document.createElement("td");
			trainToCell.innerHTML = trains.to;
			trainToCell.className = "align-left trainto";
			row.appendChild(trainToCell);

			
            
            // Track
            if (!this.config.hideTrackInfo) {
	            var trackCell = document.createElement("td");
    	        trackCell.innerHTML = trains.track;
				trackCell.className = "align-right track";
        	    if(trains.trackChange) trackCell.className = "align-right track red";
            	row.appendChild(trackCell);
            }
           
           // Infozeile Ankunft und 166
           //var information2row = document.createElement("tr");
			//var information2Cell = document.createElement("td");
			//information2Cell.colSpan = 5;
			//information2Cell.innerHTML = "<i class=\"fa fa-clock\"></i> Ankunft: " + moment(trains.arrivalTimestampRaw).add(trains.arrivaldelay, 'm').format("HH:mm") ;
			//information2Cell.className = "align-left infozeile";
			//information2row.appendChild(information2Cell);
			//table.appendChild(information2row);
           
           // Infozeile bei Abfahrt ab anderer Station (mit Wegzeit) 
            var informationrow = document.createElement("tr");
			var informationCell = document.createElement("td");
			informationCell.colSpan = 5;
			if(trains.arrivaldelay > 0) {
			arrivalinfo = moment(trains.arrivalTimestampRaw).add(trains.arrivaldelay, 'm').format("HH:mm")
			} else {
			var arrivalinfo = trains.arrivalTimestamp;
			};
			if (trains.walkto != 0 ){
			informationCell.innerHTML = "<i class=\"fa fa-walking\"></i>&nbsp;Ab&nbsp;" + trains.walkto + " (" + trains.walktime + "')&nbsp;&nbsp;" + "<i class=\"fa fa-clock\"></i> Ankunft " + moment(trains.arrivalTimestampRaw).add(trains.arrivaldelay, 'm').format("HH:mm");
			informationCell.className = "align-left infozeile"; }
			else {
				informationCell.innerHTML = "<i class=\"fa fa-clock\"></i> Ankunft " + moment(trains.arrivalTimestampRaw).add(trains.arrivaldelay, 'm').format("HH:mm");
			informationCell.className = "align-left infozeile"; }
			informationrow.appendChild(informationCell);
			table.appendChild(informationrow);



			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.trains.length * this.config.fadePoint;
				var steps = this.trains.length - startingPoint;
				if (t >= startingPoint) {
					var currentStep = t - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
					if (trains.walkto != 0) { informationrow.style.opacity = 1 - (1 / steps * currentStep); }
				}
			}

		}

		return table;
	},

	/* getData(compliments)
	 * Calls processData on succesfull response.
	 */
	getData: function() {
		var url = this.config.apiBase + this.getParams();
		var self = this;
		var retry = true;

		var trainRequest = new XMLHttpRequest();
		trainRequest.open("GET", url, true);
		trainRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.config.station = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect waht so ever...");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load trains.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		trainRequest.send();
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?show_delays=1&show_trackchanges=1&";
        params += "from=" + this.config.from;
        params += "&to=" + this.config.to;
		params += "&num=" + this.config.maximumEntries;
                
		return params;
	},

	/* processData(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processData: function(data) {
		this.trains = [];
		this.message = "";
		if ('connections' in data) {
			for (var i = 0, count = data.connections.length; i < count; i++) {
				var trains = data.connections[i];
				{
				if("Fussweg" != trains.legs[0].type_name && "departure" in trains.legs[0] && "terminal" in trains.legs[0] && "line" in trains.legs[0]) {
					var conn = {
						departureTimestampRaw: trains.legs[0].departure,
						departureTimestamp: moment(trains.legs[0].departure).format("HH:mm"),
						delay: parseInt(trains.dep_delay),
						to: trains.legs[0].terminal,
						type: trains.legs[0].type,
						number: trains.legs[0].line,
						track: trains.legs[0].track,
						information: trains.disruptions,
						walkto: 0,
						arrivalTimestampRaw: trains.arrival,
						arrivalTimestamp: moment(trains.arrival).format("HH:mm"),
						arrivaldelay: parseInt(trains.arr_delay)
					} 
					
					} 
					else if 
					("departure" in trains.legs[1] && "terminal" in trains.legs[1] && "line" in trains.legs[1])
					 {
					var conn = {
						departureTimestampRaw: trains.legs[1].departure,
						departureTimestamp: moment(trains.legs[1].departure).format("HH:mm"),
						delay: parseInt(trains.dep_delay),
						to: trains.legs[1].terminal,
						type: trains.legs[1].type,
						number: trains.legs[1].line,
						track: trains.legs[1].track,
						information: trains.disruptions,
						walktime: trains.legs[0].runningtime / 60,
						walkto: trains.legs[0].terminal,
						arrivalTimestampRaw: trains.arrival,
						arrivalTimestamp: moment(trains.arrival).format("HH:mm"),
						arrivaldelay: parseInt(trains.arr_delay)
						
					}} else 
					{
						Log.warn("Eine Verbindung übersprungen");
						continue};
				//	if (typeof conn.line != 'null') {
			//			conn.number = conn.linedesc
			//		}
			//		else {
			//			conn.number = conn.linedesc + conn.linedescn
			//		}
			

					
			
					if (typeof conn.track != 'undefined') {
						conn.trackChange = conn.track.indexOf("!") > 0;
					}
					else {
						conn.track = "";
						conn.trackChange = 0;
					}
					if (typeof conn.information != 'undefined') {
						conn.info = 1;
					}
					else {
						conn.info = 0;
					}
								
					this.trains.push(conn);
				}
			}
		}
		else {
			this.message = "Derzeit keine Abfahrten";
		}	

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.getData();
		}, nextLoad);
	},
});

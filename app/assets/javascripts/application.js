// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .


$(document).ready(function() {

	var lastFiveHours = [];
	var today = new Date;
	var isAM = true;
	var readableDate;
	var selectedElement;
	var newMachineModalHTML = $('.newMachineModal');

	var highAlert = -77;
	var lowAlert = -81;
	var maxTemp = 0;
	var temp = 0;
	var timeStamp;
	var date;
	var highAlertCounter = 0;
	var lowAlertCounter = 0;

	var alertsModal = $('.alertsModal');
	var editMenu = $('.editMenu');

	var currentTime = Math.round((today).getTime() / 1000);
	var limit = 1200 //1200 is every data point within the past 5 hours
	var fiveHoursAgo = currentTime-(limit / 240 * 60 * 60);

	var machinesList = [
		'8092d98c-b92f-4343-a8ae-104f90362de8',
	];

	// load up the element data on page load
	$(forceRefresh);

	//hide the edit menu children, this is a
	//temporary solution to a toggle-visibility issue
	editMenu.children().toggle();

	// the high and/or low alert values
	$('#updateTempButton').click(function() {
		if ($(this).siblings('.highTempInput').val()) {
			var newHighTempThreshold = $(this).siblings('.highTempInput').val();
			highAlert = newHighTempThreshold;
		};

		if ($(this).siblings('.lowTempInput').val()) {
			var newLowTempThreshold = $(this).siblings('.lowTempInput').val();
			lowAlert = newLowTempThreshold;
		};

		console.log(highAlert + " " + lowAlert);

		$(this).siblings('.successMessage').animate({'opacity':'1'}).delay(500);
		$(this).siblings('.successMessage').animate({'opacity':'0'});
		setTimeout(openDetailsSidebar, 1000);

		

		// this is kicking back a 404
		// $.ajax({
		// 	type: 'POST',
		// 	url: 'https://api.elementalmachines.io:443/api/alert_settings.json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033&machine_uuid=8092d98c-b92f-4343-a8ae-104f90362de8',
		// 	dataType: 'application/json; charset=utf-8',
		// 	data: 'test'
		// });

		// this is just to prove that the alerts API request url works	
		$.getJSON('https://api.elementalmachines.io:443/api/alert_settings.json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033&machine_uuid=' + machinesList[0], function(data) {
			console.log(data);
		})

		$(forceRefresh);
	});

	//animate the edit menu and update the values there
	$('#editButton').click(function() {
		$(openDetailsSidebar);
	});

	//the same toggle as above, but for the close caret
	$('.hideButton').click(function() {
		$(openDetailsSidebar);
	});

	// update the alert count, and check latest data readings
	$('#alertButton').click(updateTable);

	//this is for opening the 'Alert Details' panel
	$('.elementRow').on('click', '.alertLink', function() {

		//the modal function needs to know if 
		//we're opening a high or low alert modal
		var isHighAlert;
		if ($(this).hasClass('highAlerts')) {
			isHighAlert = true;
		}

		//run the modal render function
		$(tempAlertModal(isHighAlert));
	})

	//close the modal when clicking the X
	$('.closeModal').click(closeModal);

	//add a new machine and close the modal
	$('#newMachineSubmit').click( function() {

		var newUUID = $(this).siblings('input').val();
		console.log(newUUID);

		$(addNewMachine(newUUID));

		$(closeModal);

		//clear the value of the field for next time
		$(this).siblings('input').val('');
	});

	$('#addMachineButton').click( function() {
		$(newMachineModal);
	});


	// -------------------------
	//BEGIN FUNCTION DEFINITIONS
	// -------------------------


	// the modular function to refresh
	function updateTable() {
		var highAlertCounter = 0;
		var lowAlertCounter = 0;
		selectedElement = $(this);

		var highAlertHTML = $(this).siblings(".highAlerts");
		var lowAlertHTML = $(this).siblings(".lowAlerts");
		var tempHTML = $(this).siblings(".elementDatum");
		var machineNameHTML = $(this).siblings(".elementName");
		

		$.getJSON("https://api.elementalmachines.io/api/machines/" + machinesList[0] + "/samples.json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033&from="+fiveHoursAgo+"&limit="+limit, function(data) {
			
				//check to make sure we can receive and parse the API data at all
				console.log("Current temperature is " + data[data.length-1].tempextcal + ", logged at: " + data[data.length-1].sample_date);
				temp = data[data.length-1].tempextcal;
				console.log(temp);

				var i;

				for (i = 0; i < data.length; i++) {
					loopTemp = data[i].tempextcal;
					loopTimeStamp = data[i].sample_epoch;
					loopDate = data[i].sample_date;

					// high temp alert check
					if (Math.abs(loopTemp) < Math.abs(highAlert)) {
						highAlertCounter++;
						//console.log(temp);
					};

					// low temp alert check
					if (Math.abs(loopTemp) > Math.abs(lowAlert)) {
						lowAlertCounter++;
						//console.log(temp);
					};

					if (Math.abs(loopTemp) > maxTemp) {
						maxTemp = data[i].tempextcal;
					};
				};

				console.log("done, data length: " + data.length);
				console.log("There have been " + highAlertCounter + " high-temp alerts and " + lowAlertCounter + " low alerts in the past " + limit / 240 + " hours.");
		}).done( function() {

			//update the page text
			highAlertHTML.html(highAlertCounter);
			lowAlertHTML.html(lowAlertCounter);
			tempHTML.html(temp);

		}).done( function() {

			var highAlertLink = $(selectedElement).siblings('.highAlerts');
			var lowAlertLink = $(selectedElement).siblings('.lowAlerts');

			if (highAlertLink.text() > 0) {
				highAlertLink.addClass('alertLink');
			} else {
				highAlertLink.removeClass('alertLink');
			};

			if (lowAlertLink.text() > 0) {
				lowAlertLink.addClass('alertLink');
			} else {
				lowAlertLink.removeClass('alertLink');
			};
		});

		//update the machine name

		$.getJSON("https://api.elementalmachines.io:443/api/machines/" + machinesList[0] + ".json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033", function(data) {
			machineNameHTML.html(data.name);
		});


		// make the date human-readable

		var hours;

		if (today.getHours() > 12) {
			hours = today.getHours()-12;
			isAM = false;
		} else {
			hours = today.getHours();
		};
		
		var minutes;

		if (today.getMinutes() < 10) {
			minutes = "0" + today.getMinutes()
		} else {
			minutes = today.getMinutes();
		};

		if (isAM) {
			minutes = minutes + " AM"
		} else {
			minutes = minutes + " PM"
		};

		readableDate = today.getMonth()+1 + "/" + today.getDate() + "/" + (today.getYear()-100) + ", " + hours + ":" + minutes;


		//update the page text
		$(this).siblings(".lastUpdate").html(readableDate);
	};

	function forceRefresh() {
	    $('#alertButton').click(function() {
	        //this just simulates a click, running the update function
	        //in case this needs to happen without an actual click from the user
	    }).click();
	};

	//this is the modular function to render and dynamically fill the details modal
	function tempAlertModal(isHighAlert) {
		alertsModal.fadeIn();
		$('.modalOverlay').fadeIn();
		alertsModal.find('.alertsDetail').html('');
		alertsModal.find('#alertsHeader').html('');
		alertsModal.find('.currentTemp').html('');

		$.getJSON("https://api.elementalmachines.io:443/api/machines/" + machinesList[0] + ".json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033", function(data) {
			alertsModal.find('#alertsHeader').html(data.name);
		});

		$.getJSON("https://api.elementalmachines.io/api/machines/" + machinesList[0] + "/samples.json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033&from="+fiveHoursAgo+"&limit="+limit, function(data) {
			
			//check to make sure we can receive and parse the API data at all
			temp = data[data.length-1].tempextcal;
			$('.currentTemp').html('Current Temperature: ' + temp + '°C');
			console.log('working');

			var i;

			for (i = 0; i < data.length; i++) {
				loopTemp = data[i].tempextcal;
				var loopDate = new Date(data[i].sample_epoch*1000);

				if (loopDate.getHours() > 12) {
					hours = loopDate.getHours()-12;
					isAM = false;
				} else {
					hours = loopDate.getHours();
				};
				
				var minutes;

				if (loopDate.getMinutes() < 10) {
					minutes = "0" + loopDate.getMinutes()
				} else {
					minutes = loopDate.getMinutes();
				};

				if (isAM) {
					minutes = minutes + " AM"
				} else {
					minutes = minutes + " PM"
				};

				readableDate = loopDate.getMonth()+1 + "/" + loopDate.getDate() + "/" + (loopDate.getYear()-100) + ", " + hours + ":" + minutes;


				// conditional to check if we're doing a high or low alert modal
				if (isHighAlert) {

					//if the gathered temp is higher (absolute value because jquery sucks at negative numbers)
					//than the alert threshold, we add a div with the details to the details modal's table
					if (Math.abs(loopTemp) < Math.abs(highAlert)) {
						alertsModal.find('.alertsDetail').append('<div class="singleAlertDate">' + readableDate + '</div><div class="singleAlertTemp">' + loopTemp + ' °C </div>');
						//console.log(temp);
					};
				} else {

					//if the gathered temp is lower (absolute value because jquery sucks at negative numbers)
					//than the alert threshold, we add a div with the details to the details modal's table
					if (Math.abs(loopTemp) > Math.abs(lowAlert)) {
						alertsModal.find('.alertsDetail').append('<div class="singleAlertDate">' + readableDate + '</div><div class="singleAlertTemp">' + loopTemp + ' °C </div>');
						//console.log(temp);
					};
				};
			};

			//run the same conditional to check for high or low alert,
			//except this time outside of the for-loop
			if (isHighAlert) {
				alertsModal.find('.modalThresholdText').html('High Temp Threshold: ' + highAlert + '°C');
			} else {
				alertsModal.find('.modalThresholdText').html('Low Temp Threshold: ' + lowAlert + '°C');
			}

		});
	};

	function openDetailsSidebar() {
		editMenu.animate({width:'toggle'},300);
		editMenu.children().toggle();

		$('.highTempInput').attr('placeholder', highAlert);
		$('.lowTempInput').attr('placeholder', lowAlert);

		$.getJSON("https://api.elementalmachines.io:443/api/machines/" + machinesList[0] + ".json?access_token=7eb3d0a32f2ba1e8039657ef2bd1913d95707ff53e37dfd0344ac62ded3df033", function(data) {
			editMenu.find('.editHeader').html(data.name);
		});
	};

	function newMachineModal() {
		$('.modalOverlay').fadeIn();
		newMachineModalHTML.fadeIn();
	};

	function addNewMachine(machineUUID) {

		machinesList.push(machineUUID);

		//just to check we did it right
		console.log(machinesList);
	}

	function closeModal() {
		$('.modal').fadeOut();
		$('.modalOverlay').fadeOut();
		$(forceRefresh);
	}
});


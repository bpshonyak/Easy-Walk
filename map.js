$( document ).ready(function() {
  $("#map-data").hide();
});

function googleInit(){
  var start_input = /** @type {!HTMLInputElement} */(
      document.getElementById('start'));
  var end_input = /** @type {!HTMLInputElement} */(
      document.getElementById('end'));
  var start_autocomplete = new google.maps.places.Autocomplete(start_input);
  var end_autocomplete = new google.maps.places.Autocomplete(end_input);
}

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});



function getLocation(){
  var infoWindow = new google.maps.InfoWindow({map: map});

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      infoWindow.setContent('Location found.');
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
  }
}


$("#getMap").click(function(){
  console.log("Getting Map!");

  initMap();
  $("#map-data").show("slow");

  $('html, body').animate({
    scrollTop: $("#map-data").offset().top
  }, 2000);

});

var mousemarker = null;
var map = null;

function initMap() {

  console.log("Initializing map");

  // Initialize path with random starting location
  var path = [
    {lat: 37.77, lng: -122.447},
    {lat: 37.768, lng: -122.511}];

  var start = $("#start").val();
  var end = $("#end").val();

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: path[0],
    mapTypeId: 'roadmap',
  });

  var directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: true,
    map: map,
    panel: document.getElementById('right-panel')
  });

  var directionsService = new google.maps.DirectionsService;

  // Create an ElevationService.
  var elevator = new google.maps.ElevationService;

  directionsDisplay.setMap(map);

  directionsDisplay.addListener('directions_changed', function() {
    var directions = directionsDisplay.getDirections();
    console.log(directions);

    start_lat = directions.routes[0].legs[0].steps[0].start_location.lat();
    start_lng = directions.routes[0].legs[0].steps[0].start_location.lng();
    end_lat = directions.routes[0].legs[0].steps[0].end_location.lat();
    end_lng = directions.routes[0].legs[0].steps[0].end_location.lng();

    path[0] = {lat: start_lat, lng: start_lng};
    path[1] = {lat: end_lat, lng: end_lng};

    console.log(path);
    // Draw the path, using the Visualization API and the Elevation service.
    displayPathElevation(path, elevator, map);

  });

  displayRoute(start, end, directionsService, directionsDisplay);

}

function displayRoute(origin, destination, service, display) {
  service.route({
    origin: origin,
    destination: destination,
    //waypoints: [{location: 'Cocklebiddy, WA'}, {location: 'Broken Hill, NSW'}],
    travelMode: google.maps.TravelMode.WALKING,
    //avoidTolls: true
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      display.setDirections(response);
    } else {
      alert('Could not display directions due to: ' + status);
    }
  });
}

function displayPathElevation(path, elevator, map) {

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  // Initiate the path request.
  elevator.getElevationAlongPath({
    'path': path,
    'samples': 256
  }, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(elevations, status) {
  var chartDiv = document.getElementById('elevation_chart');
  if (status !== google.maps.ElevationStatus.OK) {
    // Show the error code inside the chartDiv.
    chartDiv.innerHTML = 'Cannot show elevation: request failed because ' +
        status;
    return;
  }
  // Create a new chart in the elevation_chart DIV.
  var chart = new google.visualization.ColumnChart(chartDiv);


  //Cool shit
  google.visualization.events.addListener(chart, 'onmouseover', function(e) {
    if (mousemarker == null) {
      mousemarker = new google.maps.Marker({
        position: elevations[e.row].location,
        map: map,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      });
    } else {
      mousemarker.setPosition(elevations[e.row].location);
    }
  });

  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sample');
  data.addColumn('number', 'Elevation');
  for (var i = 0; i < elevations.length; i++) {
    data.addRow(['', elevations[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  chart.draw(data, {
    height: 150,
    legend: 'none',
    titleY: 'Elevation (m)'
  });
}

// Remove the green rollover marker when the mouse leaves the chart
function clearMouseMarker() {
  if (mousemarker != null) {
    mousemarker.setMap(null);
    mousemarker = null;
  }
}

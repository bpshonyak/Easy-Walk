$( document ).ready(function() {
  $("#map-data").hide();
  $("#getLocation").click(function(){
    console.log("getting location!");
    getLocation();
  });
});

function autoCompleteInit(){
  var start_input = /** @type {!HTMLInputElement} */(
      document.getElementById('start'));
  var end_input = /** @type {!HTMLInputElement} */(
      document.getElementById('end'));
  var start_autocomplete = new google.maps.places.Autocomplete(start_input);
  var end_autocomplete = new google.maps.places.Autocomplete(end_input);
}

function getLocation(){
  //var infoWindow = new google.maps.InfoWindow({map: map});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(savePosition);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
}

function savePosition(position) {
   $("#start").val(position.coords.latitude + ", " + position.coords.longitude);
}

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

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

    var start_lat = directions.routes[0].legs[0].steps[0].start_location.lat();
    var start_lng = directions.routes[0].legs[0].steps[0].start_location.lng();
    var end_lat = directions.routes[0].legs[0].steps[0].end_location.lat();
    var end_lng = directions.routes[0].legs[0].steps[0].end_location.lng();

    var start_add = directions.routes[0].legs[0].start_address;
    var end_add = directions.routes[0].legs[0].end_address;

    console.log(start_add);
    console.log(end_add);

    path[0] = {lat: start_lat, lng: start_lng};
    path[1] = {lat: end_lat, lng: end_lng};

    console.log(path);
    // Draw the path, using the Visualization API and the Elevation service.
    displayPathElevation(start_add, end_add, path, elevator, directionsService, map);

  });

  displayRoute(start, end, directionsService, directionsDisplay);

}

function displayRoute(origin, destination, service, display) {
  service.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING,
    provideRouteAlternatives: true
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      display.setDirections(response);
    } else {
      alert('Could not display directions due to: ' + status);
    }
  });
}

function displayPathElevation(origin, destination, path, elevator, directionsService, map) {

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  // Initiate the path request.

  var request = {
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING,
    provideRouteAlternatives: true
    //waypoints: waypoints
  };

  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      console.log("Response:");
      console.log(response);
      elevator.getElevationAlongPath({
        path: response.routes[0].overview_path,
        samples: 256
      }, plotElevation);
    } else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
      alert("Could not find a route between these points");
    } else {
      alert("Directions request failed");
    }
  });

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

  //Move blue marker when mouse is over elevation chart
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

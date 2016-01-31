// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

function initMap() {

  //var directionsDisplay = new google.maps.DirectionsRenderer;


  // The path array contains the start and end position of a path
  var path = [
    {lat: 37.77, lng: -122.447},   // Haight
    {lat: 37.768, lng: -122.511}]; // Ocean Beach

  var start = {lat: 37.77, lng: -122.447};
  var end = {lat: 37.768, lng: -122.511};

  var map = new google.maps.Map(document.getElementById('map'), {
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
    computeTotalDistance(directions);
    console.log(directions);

    start_lat = directions.routes[0].legs[0].steps[0].start_location.lat();
    start_lng = directions.routes[0].legs[0].steps[0].start_location.lng();
    end_lat = directions.routes[0].legs[0].steps[0].end_location.lat();
    end_lng = directions.routes[0].legs[0].steps[0].end_location.lng();

    path[0] = {lat: start_lat, lng: start_lng};
    path[1] = {lat: end_lat, lng: end_lng};

    console.log(path);

    displayPathElevation(path, elevator, map);

    //calculateAndDisplayRoute(directionsService, directionsDisplay, directions);
  });

  calculateAndDisplayRoute(directionsService, directionsDisplay, path);

  // Draw the path, using the Visualization API and the Elevation service.
  displayPathElevation(path, elevator, map);
}

function computeTotalDistance(result) {
  var total = 0;
  var myroute = result.routes[0];
  for (var i = 0; i < myroute.legs.length; i++) {
    total += myroute.legs[i].distance.value;
  }
  total = total / 1000;
  document.getElementById('total').innerHTML = total + ' km';
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, path) {
//      var selectedMode = document.getElementById('mode').value;
  var selectedMode = "WALKING"
  directionsService.route({
    origin: path[0],  // Haight.
    destination: path[1],  // Ocean Beach.
    travelMode: google.maps.TravelMode[selectedMode]
  }, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
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

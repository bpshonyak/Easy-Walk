// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

function initMap() {

  var directionsDisplay = new google.maps.DirectionsRenderer;
  var directionsService = new google.maps.DirectionsService;

  // The following path marks a path from Mt. Whitney, the highest point in the
  // continental United States to Badwater, Death Valley, the lowest point.
  var path = [
    {lat: 37.77, lng: -122.447},   // Haight
    {lat: 37.768, lng: -122.511}]; // Ocean Beach

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: path[1],
    mapTypeId: 'roadmap',
  });

  // Create an ElevationService.
  var elevator = new google.maps.ElevationService;

  directionsDisplay.setMap(map);

  calculateAndDisplayRoute(directionsService, directionsDisplay);

  // Draw the path, using the Visualization API and the Elevation service.
  displayPathElevation(path, elevator, map);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
//      var selectedMode = document.getElementById('mode').value;
  var selectedMode = "WALKING"
  directionsService.route({
    origin: {lat: 37.77, lng: -122.447},  // Haight.
    destination: {lat: 37.768, lng: -122.511},  // Ocean Beach.
    // Note that Javascript allows us to access the constant
    // using square brackets and a string value as its
    // "property."
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
  // Display a polyline of the elevation path.
//      new google.maps.Polyline({
//        path: path,
//        strokeColor: '#0000CC',
//        opacity: 0.4,
//        map: map
//      });

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

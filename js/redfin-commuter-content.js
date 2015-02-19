//
// Inject the travel time into redfin results
//
//
// Still TODO
// # Handle input of to / from
// # Handle forcing to rush hour commutes
// # Handle list and non-list cases
// # Error conditions

//Keep the results in local storage to avoid hitting API limits
var addToCache = function(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

var getFromCache = function(key) {
  var value = localStorage.getItem(key);
  if (value) {
    return JSON.parse(value);
  }
}

function makeDirectionsRequest(fromAddress, toAddress) {
  if (!toAddress) {
    toAddress = "141 Portland Street, Cambridge MA"
  }

  var maps_key = undefined;
  var url = 'https://maps.googleapis.com/maps/api/directions/json?origin='+encodeURIComponent(fromAddress)+'&destination=' +encodeURIComponent(toAddress)+ '&mode=transit&key='+maps_key;
  
  if (maps_key) {
    url += "&key=" + maps_key
  } else {
    alert("Add your google api key for 'directions api'");
  }

  var cacheResult = getFromCache(url);
  if (cacheResult) {
    return $.Deferred().resolveWith(this, [cacheResult]);
  }
  
  return $.ajax({
    url: url,
    complete: function(data) 
    { 
      if (data && data.responseJSON) {
        data = data.responseJSON;
      }
      addToCache(url, data);
    }
  });
}

// Takes a Redfin style row of data
function rowToAddress(row, state) {
  if (!state) {
    state = "MA";
  }
  var parts = _.map(row.find("td").slice(3,5), function(row, index) { return row.innerText })

  // Clean out 
  // 123 Prospect #212
  // 123 Prospect Unit 5
  // Since they mess up the search

  var aptNumRegex = /\#.*/gi
  var unitRegex = /Unit.*$/gi

  $.each([aptNumRegex, unitRegex], function(index, regex) {
    parts[0] = parts[0].replace(regex, '');
  });

  return _.trim(parts).replace('\n','') + " " + state;
}

function addTimingToRow(row, routeData) {
  var duration = "???"
  if (routeData && routeData.routes && routeData.routes[0]) {
    duration = routeData.routes[0].legs[0].duration.text;
  }
  
  // Replace the "days on redfin" element
  var element = row.find('[idx="10"]')[0]
  if (element) {
    element.innerText = duration;
  } else {
    console.error("Could not set the duration for element", element, duration, row)
  }

}

// Wait for the page to fully populate
window.setInterval(function() {
  var rows = $(".dojoxGridRow");

  $.each(rows, function(index, row) {
    var $row = $(row)
    var address = rowToAddress($row);

    var doneFn = function(data) {
      addTimingToRow($row, data);
    }
    makeDirectionsRequest(address).done(doneFn);
  });

}, 4*1000);
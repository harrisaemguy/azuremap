(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.dc = global.dc || {}, global.dc.azure_map = {})));
})(this, (function (exports) { 'use strict';

  function jsonStrToStrMap(jsonStr) {
    var obj = JSON.parse(jsonStr);
    return objToStrMap(obj);
  }
  function objToStrMap(obj) {
    if (obj instanceof Map) {
      // obj.forEach((v, k, m) => {});
      return obj;
    } else {
      var strMap = new Map();

      for (var _i = 0, _Object$keys = Object.keys(obj); _i < _Object$keys.length; _i++) {
        var k = _Object$keys[_i];
        strMap.set(k, obj[k]);
      }

      return strMap;
    }
  }

  function getAfFieldId(afField) {
    return afField.jsonModel.id || afField.jsonModel.templateId;
  }

  function promise(cssSelector) {
    var visible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return new Promise(function (resolve) {
      var checking = setInterval(function () {
        $(cssSelector).length;

        if (visible && $(cssSelector).is(':visible') || !visible && $(cssSelector).length > 0) {
          clearInterval(checking);
          resolve(true);
        }
      }, 5);
    });
  }
  function yourLocation() {
    return new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(function (position) {
        var userPosition = {
          lng: position.coords.longitude,
          lat: position.coords.latitude
        };
        resolve(userPosition);
      }, function (error) {
        //If an error occurs when trying to access the users position information, display an error message.
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('User denied the request for Geolocation.');
            break;

          case error.POSITION_UNAVAILABLE:
            alert('Position information is unavailable.');
            break;

          case error.TIMEOUT:
            alert('The request to get user position timed out.');
            break;

          case error.UNKNOWN_ERROR:
            alert('An unknown error occurred.');
            break;
        }

        reject(undefined);
      });
    });
  } //ex: getUrlParam('wcmmode')

  var atlasPromise = undefined; //Note that the typeahead parameter is set to true.

  var geocodeServiceUrlTemplate = 'https://{azMapsDomain}/search/{searchType}/json?typeahead=true&api-version=1&query={query}&language={language}&lon={lon}&lat={lat}&countrySet={countrySet}&view=Auto'; // promise load once for all invoker

  var loadAtlas = function loadAtlas() {
    if (atlasPromise) {
      return atlasPromise;
    } else {
      atlasPromise = new Promise(function (resolve) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
        link.type = 'text/css';
        document.head.appendChild(link);
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://code.jquery.com/ui/1.13.0/themes/smoothness/jquery-ui.css';
        link.type = 'text/css';
        document.head.appendChild(link);
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://code.jquery.com/ui/1.13.0/jquery-ui.js';
        document.head.appendChild(script);
        script = document.createElement('script');
        script.type = 'text/javascript';

        script.onload = function () {
          atlas.setView('Auto');
          yourLocation().then(function (yourLoc) {
            resolve(yourLoc);
          });
        };

        script.onreadystatechange = function () {
          // for IE
          resolve({});
        };

        script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
        document.head.appendChild(script);
        var atService = document.createElement('script');
        atService.type = 'text/javascript';
        atService.src = 'https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js';
        document.head.appendChild(atService);
      });
      return atlasPromise;
    }
  }; //used by afFld.initialize
  // ex: dc.azure_map.init(this, '{"postalCode":"extendedPostalCode", "addressline1":"freeformAddress", "city":"municipality", "landmark":"localName", "state":"countrySubdivisionName"}');


  function init(thisInput) {
    var showMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var fldNames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '{"postalCode":"extendedPostalCode", "addressline1":"_LINE1", "city":"municipality", "landmark":"localName", "state":"countrySubdivisionName"}';
    var searchBoxId = getAfFieldId(thisInput);
    var parentPanel = thisInput.parent;
    loadAtlas().then(function (yourLoc) {
      // when textbox available, append mapDiv
      promise("#".concat(searchBoxId)).then(function () {
        var $div = $('<div>', {
          id: "".concat(searchBoxId, "_map"),
          "class": 'mapDiv',
          style: "display:".concat(showMap ? 'block' : 'none')
        });
        $("#".concat(searchBoxId, " input")).after($div);
        var searchInputId = $("#".concat(searchBoxId, " input")).attr('id'); // when mapDiv available and visible

        promise("#".concat(searchBoxId, "_map"), showMap).then(function () {
          var divId = searchBoxId + '_map';
          var map = new atlas.Map(divId, {
            center: [-75.89929097426723, 45.31358572144141],
            zoom: 14,
            view: 'Auto',
            renderWorldCopies: false,
            autoResize: true,
            showLogo: false,
            showFeedbackLink: false,
            style: 'road',
            authOptions: {
              authType: 'subscriptionKey',
              subscriptionKey: '1L_SO0IYB4G2_lXaOkv40jEbUazPbywLfgdGgrgsX6Q'
            }
          });

          var processRequest = function processRequest(url) {
            //This is a reusable function that sets the Azure Maps platform domain, sign the request, and makes use of any transformRequest set on the map.
            return new Promise(function (resolve, reject) {
              //Replace the domain placeholder to ensure the same Azure Maps cloud is used throughout the app.
              url = url.replace('{azMapsDomain}', atlas.getDomain()); //Get the authentication details from the map for use in the request.

              var requestParams = map.authentication.signRequest({
                url: url
              }); //Transform the request.

              var transform = map.getServiceOptions().tranformRequest;

              if (transform) {
                requestParams = transform(url);
              }

              fetch(requestParams.url, {
                method: 'GET',
                mode: 'cors',
                headers: new Headers(requestParams.headers)
              }).then(function (r) {
                return r.json();
              }, function (e) {
                return reject(e);
              }).then(function (r) {
                resolve(r);
              }, function (e) {
                return reject(e);
              });
            });
          };

          map.events.add('ready', function () {
            var datasource = new atlas.source.DataSource();
            map.sources.add(datasource);

            if (yourLoc) {
              // if location service is allowed
              map.setCamera({
                center: [yourLoc.lng, yourLoc.lat]
              });
            } //Add a layer for rendering point data.


            map.layers.add(new atlas.layer.SymbolLayer(datasource));

            $("#".concat(searchInputId)).autocomplete({
              minLength: 3,
              delay: 500,
              source: function source(request, response) {
                var center = map.getCamera().center;
                var countryIso = 'CA,US'; //Create a URL to the Azure Maps search service to perform the search.

                var requestUrl = geocodeServiceUrlTemplate.replace('{query}', encodeURIComponent(request.term)).replace('{searchType}', 'fuzzy').replace('{language}', 'en-US').replace('{lon}', center[0]).replace('{lat}', center[1]).replace('{countrySet}', countryIso); //A comma seperated string of country codes to limit the suggestions to.

                processRequest(requestUrl).then(function (data) {
                  response(data.results);
                });
              },
              select: function select(event, ui) {
                //Remove any previous added data from the map.
                datasource.clear(); //Create a point feature to mark the selected location.

                datasource.add(new atlas.data.Feature(new atlas.data.Point([ui.item.position.lon, ui.item.position.lat]), ui.item)); //Zoom the map into the selected location.

                map.setCamera({
                  bounds: [ui.item.viewport.topLeftPoint.lon, ui.item.viewport.btmRightPoint.lat, ui.item.viewport.btmRightPoint.lon, ui.item.viewport.topLeftPoint.lat],
                  padding: 30
                });
                console.log(ui.item); // allow specify fldNames jsonString

                var mapping = jsonStrToStrMap(fldNames);
                parentPanel.items.forEach(function (item) {
                  if (mapping.get(item.name)) {
                    var key = mapping.get(item.name);

                    if ('_LINE1' === key) {
                      item.value = ui.item.address.streetNumber + ' ' + ui.item.address.streetName;
                    } else {
                      item.value = ui.item.address[key];
                    }
                  }
                });
                event.preventDefault();
                thisInput.value = ui.item.address.freeformAddress;
                return true;
              }
            }).autocomplete('instance')._renderItem = function (ul, item) {
              var suggestionLabel = item.address.freeformAddress;

              if (item.poi && item.poi.name) {
                suggestionLabel = item.poi.name + ' (' + suggestionLabel + ')';
              }

              return $('<li>').append('<a>' + suggestionLabel + '</a>').appendTo(ul);
            };
          });
        });
      });
    });
  }

  exports.init = init;

}));

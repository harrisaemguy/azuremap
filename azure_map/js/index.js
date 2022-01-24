(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.dc = global.dc || {}, global.dc.azure_map = {})));
})(this, (function (exports) { 'use strict';

  // const processChange = debounce(fn);

  function getAfFieldId(afField) {
    return afField.jsonModel.id || afField.jsonModel.templateId;
  }

  function promise(cssSelector, visible = false) {
    return new Promise(function (resolve) {
      let checking = setInterval(() => {
        $(cssSelector).length;

        if (visible && $(cssSelector).is(':visible') || !visible && $(cssSelector).length > 0) {
          clearInterval(checking);
          resolve(true);
        }
      }, 5);
    });
  }
  function yourLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(position => {
        let userPosition = {
          lng: position.coords.longitude,
          lat: position.coords.latitude
        };
        resolve(userPosition);
      }, error => {
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
  }

  let atlasPromise = undefined; //Note that the typeahead parameter is set to true.

  let geocodeServiceUrlTemplate = 'https://{azMapsDomain}/search/{searchType}/json?typeahead=true&api-version=1&query={query}&language={language}&lon={lon}&lat={lat}&countrySet={countrySet}&view=Auto'; // promise load once for all invoker

  const loadAtlas = () => {
    if (atlasPromise) {
      return atlasPromise;
    } else {
      atlasPromise = new Promise(resolve => {
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
        link.type = 'text/css';
        document.head.appendChild(link);
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://code.jquery.com/ui/1.13.0/themes/smoothness/jquery-ui.css';
        link.type = 'text/css';
        document.head.appendChild(link);
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://code.jquery.com/ui/1.13.0/jquery-ui.js';
        document.head.appendChild(script);
        script = document.createElement('script');
        script.type = 'text/javascript';

        script.onload = () => {
          atlas.setView('Auto');
          yourLocation().then(yourLoc => {
            resolve(yourLoc);
          });
        };

        script.onreadystatechange = () => {
          // for IE
          resolve({});
        };

        script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
        document.head.appendChild(script);
        let atService = document.createElement('script');
        atService.type = 'text/javascript';
        atService.src = 'https://atlas.microsoft.com/sdk/javascript/service/2/atlas-service.min.js';
        document.head.appendChild(atService);
      });
      return atlasPromise;
    }
  }; //used by afFld.initialize


  function applyAzureMap(thisInput) {
    let searchBoxId = getAfFieldId(thisInput);
    let parentPanel = thisInput.parent;
    loadAtlas().then(yourLoc => {
      // when textbox available, append mapDiv
      promise(`#${searchBoxId}`).then(() => {
        const $div = $('<div>', {
          id: `${searchBoxId}_map`,
          class: 'mapDiv'
        });
        $(`#${searchBoxId} input`).after($div);
        let searchInputId = $(`#${searchBoxId} input`).attr('id'); // when mapDiv available and visible

        promise(`#${searchBoxId}_map`, true).then(() => {
          let divId = searchBoxId + '_map';
          let map = new atlas.Map(divId, {
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

          const processRequest = url => {
            //This is a reusable function that sets the Azure Maps platform domain, sign the request, and makes use of any transformRequest set on the map.
            return new Promise((resolve, reject) => {
              //Replace the domain placeholder to ensure the same Azure Maps cloud is used throughout the app.
              url = url.replace('{azMapsDomain}', atlas.getDomain()); //Get the authentication details from the map for use in the request.

              let requestParams = map.authentication.signRequest({
                url: url
              }); //Transform the request.

              let transform = map.getServiceOptions().tranformRequest;

              if (transform) {
                requestParams = transform(url);
              }

              fetch(requestParams.url, {
                method: 'GET',
                mode: 'cors',
                headers: new Headers(requestParams.headers)
              }).then(r => r.json(), e => reject(e)).then(r => {
                resolve(r);
              }, e => reject(e));
            });
          };

          map.events.add('ready', function () {
            let datasource = new atlas.source.DataSource();
            map.sources.add(datasource);
            map.setCamera({
              center: [yourLoc.lng, yourLoc.lat]
            }); //Add a layer for rendering point data.

            map.layers.add(new atlas.layer.SymbolLayer(datasource));

            $(`#${searchInputId}`).autocomplete({
              minLength: 3,
              delay: 500,
              source: (request, response) => {
                let center = map.getCamera().center;
                let countryIso = 'CA,US'; //Create a URL to the Azure Maps search service to perform the search.

                let requestUrl = geocodeServiceUrlTemplate.replace('{query}', encodeURIComponent(request.term)).replace('{searchType}', 'fuzzy').replace('{language}', 'en-US').replace('{lon}', center[0]).replace('{lat}', center[1]).replace('{countrySet}', countryIso); //A comma seperated string of country codes to limit the suggestions to.

                processRequest(requestUrl).then(data => {
                  response(data.results);
                });
              },
              select: (event, ui) => {
                //Remove any previous added data from the map.
                datasource.clear(); //Create a point feature to mark the selected location.

                datasource.add(new atlas.data.Feature(new atlas.data.Point([ui.item.position.lon, ui.item.position.lat]), ui.item)); //Zoom the map into the selected location.

                map.setCamera({
                  bounds: [ui.item.viewport.topLeftPoint.lon, ui.item.viewport.btmRightPoint.lat, ui.item.viewport.btmRightPoint.lon, ui.item.viewport.topLeftPoint.lat],
                  padding: 30
                });
                console.log(ui.item);
                let mapping = new Map();
                mapping.set('postalCode', 'extendedPostalCode');
                mapping.set('addressline1', 'freeformAddress');
                mapping.set('city', 'municipality');
                mapping.set('landmark', 'localName');
                mapping.set('state', 'countrySubdivisionName');
                parentPanel.items.forEach(function (item) {
                  if (mapping.get(item.name)) {
                    let key = mapping.get(item.name);
                    item.value = ui.item.address[key];
                  }
                });
                event.preventDefault();
                thisInput.value = ui.item.address.freeformAddress;
                return true;
              }
            }).autocomplete('instance')._renderItem = (ul, item) => {
              let suggestionLabel = item.address.freeformAddress;

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

  exports.applyAzureMap = applyAzureMap;

}));

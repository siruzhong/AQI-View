mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/siruzhong/clmr3ruds027p01pj91ajfoif', // style URL
    center: [116.173553, 40.09068], // starting position [lng, lat]
    zoom: 9 // starting zoom
});


var popup = new mapboxgl.Popup({
    closeOnClick: false,
    closeButton: false,
});

// Display data in popup on mouseover
map.on('mouseenter', '1085-stations-1cyyg4', function (e) {
    const clickedData = e.features[0].properties;

    popup.setLngLat(e.lngLat)
        .setHTML(`
                <div class="popup-header">
                    ${clickedData.name_Chinese} (${clickedData.name_Pinyin})
                </div>
                <div class="popup-body">
                    <p><strong>District ID:</strong> ${clickedData.district_id}</p>
                    <p><strong>Latitude:</strong> ${clickedData.latitude}</p>
                    <p><strong>Longitude:</strong> ${clickedData.longitude}</p>
                </div>
            `)
        .addTo(map);

    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', '1085-stations-1cyyg4', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

/* Given a query in the form "lng, lat" or "lat, lng"
* returns the matching geographic coordinate(s)
* as search results in carmen geojson format,
* https://github.com/mapbox/carmen/blob/master/carmen-geojson.md */
const coordinatesGeocoder = function (query) {
    // Match anything which looks like
    // decimal degrees coordinate pair.
    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    function coordinateFeature(lng, lat) {
        return {
            center: [lng, lat],
            geometry: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature'
        };
    }

    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
};

// Add the control to the map.
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        zoom: 4,
        placeholder: 'Try: -40, 170',
        mapboxgl: mapboxgl,
        reverseGeocode: true
    })
);

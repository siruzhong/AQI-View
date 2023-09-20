// Display map
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/siruzhong/clmr3ruds027p01pj91ajfoif/draft', // style URL
    center: [116.173553, 40.09068], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

// 使用PapaParse将CSV转换为GeoJSON
function csvToGeoJSON(csv) {
    const geojson = {
        type: 'FeatureCollection',
        features: []
    };

    Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            results.data.forEach(row => {
                const feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
                    },
                    properties: row
                };
                geojson.features.push(feature);
            });
        }
    });

    return geojson;
}

function addStationsLayer() {
    // Convert your CSV data to GeoJSON
    const geojsonData = csvToGeoJSON(station_data);

    // Add data source
    map.addSource('stations', {
        type: 'geojson',
        data: geojsonData
    });

    // Add data layer
    map.addLayer({
        id: '1085-stations-1cyyg4',
        type: 'circle',
        source: 'stations',
        paint: {
            'circle-radius': 4,
            'circle-color': '#64b4b9'
        },
    });
}

map.on('load', function () {
    addStationsLayer(); // 当地图首次加载时，添加数据层
});

// 获取所有的菜单项链接
const styleLinks = document.querySelectorAll('.submenu__item a[data-style]');

for (const link of styleLinks) {
    link.addEventListener('click', function (e) {
        e.preventDefault(); // 阻止默认的链接点击行为
        const styleId = this.getAttribute('data-style');
        map.setStyle('mapbox://styles/mapbox/' + styleId);
        map.once('style.load', addStationsLayer); // 当样式加载完成后，重新添加数据层
    });
}

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

// Remove data when mouseleave
map.on('mouseleave', '1085-stations-1cyyg4', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

// Location search box
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

// Add the location search box to the map.
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: coordinatesGeocoder,
        zoom: 4,
        placeholder: 'Search here ...',
        mapboxgl: mapboxgl,
        reverseGeocode: true
    })
);

class AirQualityLegendControl {
    onAdd(map) {
        this.map = map;
        this.container = document.getElementById('airQualityLegend');
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

map.on('click', function (e) {
    // 获取点击的经纬度
    var lngLat = e.lngLat;

    // 检查点击的经纬度是否在指定的范围内
    if (isWithinBounds(lngLat)) {
        // 使用经纬度查询数据
        fetchDataForLocation(lngLat, function (data) {
            // 创建一个信息窗口
            new mapboxgl.Popup()
                .setLngLat(lngLat)
                .setHTML(generatePopupContent(data))  // 将数据转换为HTML格式
                .addTo(map);
        });
    }
});

function isWithinBounds(lngLat) {
    const minLng = 73.683851;
    const maxLng = 135.383069;
    const minLat = 18.424216;
    const maxLat = 53.714166;

    return lngLat.lng >= minLng && lngLat.lng <= maxLng && lngLat.lat >= minLat && lngLat.lat <= maxLat;
}

function fetchDataForLocation(lngLat, callback) {
    // 这里我们使用generateRandomData来模拟真实的数据查询
    var data = generateRandomData();
    callback(data);
}

function generatePopupContent(data) {
    return `
        <div>
            PM2.5: ${data.pm25} μg/m³ <br>
            PM10: ${data.pm10} μg/m³ <br>
            NO2: ${data.no2} ppb <br>
            CO: ${data.co} ppm <br>
            O3: ${data.o3} ppb <br>
            SO2: ${data.so2} ppb <br>
            Rainfall: ${data.rainfall} mm <br>
            Temperature: ${data.temperature} °C <br>
            Pressure: ${data.pressure} hPa <br>
            Humidity: ${data.humidity} % <br>
            Wind Speed: ${data.windSpeed} m/s <br>
            Wind Direction: ${data.windDirection}° <br>
            Weather: ${data.weather}
        </div>
    `;
}

// 创建一个新的控件实例
const airQualityLegend = new AirQualityLegendControl();

// 将控件添加到地图的右下角
map.addControl(airQualityLegend, 'bottom-right');

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Add a scale control to the map
map.addControl(new mapboxgl.ScaleControl());
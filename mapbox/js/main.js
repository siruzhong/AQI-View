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

function getPollutionLevel(pm25) {
    if (pm25 <= 50) {
        return {level: '优', color: '#00FF00'};
    } else if (pm25 <= 100) {
        return {level: '良', color: '#FFFF00'};
    } else if (pm25 <= 150) {
        return {level: '轻度污染', color: '#FFA500'};
    } else if (pm25 <= 200) {
        return {level: '中度污染', color: '#FF4500'};
    } else if (pm25 <= 300) {
        return {level: '重度污染', color: '#FF0000'};
    } else {
        return {level: '严重污染', color: '#8B0000'};
    }
}


function generatePopupContent(data) {
    // 然后在弹出框的HTML内容中加入该色柱和文本：
    const pollution = getPollutionLevel(data.pm25);
    const now = new Date();
    const hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');  // 保证分钟总是两位数
    const amPm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime = `更新于 ${hours}:${minutes} ${amPm}`;
    return `
        <div style="display: grid; grid-template-columns: auto 14px auto;">
            <div style="grid-column: 1 / span 3; display: flex; align-items: center; justify-content: flex-start; margin: 0 0 8px 0">
                <div style="width: 6px; height: 12px; background-color: ${pollution.color};"></div>
                <div style="padding-left: 8px">${pollution.level}</div>
            </div>
            ${generateIndicatorWithColorBox('PM2.5', data.pm25)}
            ${generateIndicatorWithColorBox('PM10', data.pm10)}
            ${generateIndicatorWithColorBox('NO2', data.no2)}
            ${generateIndicatorWithColorBox('CO', data.co)}
            ${generateIndicatorWithColorBox('O3', data.o3)}
            ${generateIndicatorWithColorBox('SO2', data.so2)}
            <div> Rainfall</div> <div><i style="margin: 5px 5px;" class="fas fa-cloud-rain"></i></div> <div style="padding-left: 12px">${data.rainfall} mm</div>
            <div> Temperature</div> <div><i style="margin: 5px 5px;" class="fas fa-thermometer"></i></div> <div style="padding-left: 12px">${data.temperature} °C</div>
            <div> Pressure</div> <div><i style="margin: 5px 5px;" class="fas fa-tachometer-alt"></i></div> <div style="padding-left: 12px">${data.pressure} hPa</div>
            <div> Humidity</div> <div><i style="margin: 5px 5px;" class="fas fa-water"></i></div> <div style="padding-left: 12px">${data.humidity} %</div>
            <div> Wind Speed</div> <div><i style="margin: 5px 5px;" class="fas fa-wind"></i></div> <div style="padding-left: 12px">${data.windSpeed} m/s</div>
            <div> Wind Direction</div> <div><i style="margin: 5px 5px;" class="fas fa-location-arrow"></i></div> <div style="padding-left: 12px">${data.windDirection}°</div>
            <div> Weather</div> <div><i style="margin: 5px 5px;" class="fas fa-smog"></i></div> <div style="padding-left: 12px">${data.weather}</div>
            <div style="grid-column: 1 / span 2; color: steelblue; padding-top: 8px">${formattedTime}</div>
        </div>
    `;
}

function generateIndicatorWithColorBox(indicatorName, value) {
    const color = getColorForValue(value);
    return `
        <div>${indicatorName}</div>
        <div style="width: 12px; height: 12px; background-color: ${color}; margin: 5px 5px;"></div>
        <div style="padding-left: 12px">${value}</div>
    `;
}


function getColorForValue(value) {
    if (value <= 50) return '#00FF00';       // Green
    if (value <= 100) return '#FFFF00';      // Yellow
    if (value <= 150) return '#FFA500';      // Orange
    if (value <= 200) return '#FF4500';      // Light Red
    if (value <= 300) return '#FF0000';      // Red
    return '#8B0000';                        // Dark Red
}

// 创建一个新的控件实例
const airQualityLegend = new AirQualityLegendControl();

// 将控件添加到地图的右下角
map.addControl(airQualityLegend, 'bottom-right');

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Add a scale control to the map
map.addControl(new mapboxgl.ScaleControl());
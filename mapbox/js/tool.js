// 定义坐标地理编码器
const coordinatesGeocoder = function (query) {
    // 匹配任何看起来像十进制度数坐标对的输入
    const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    // 构建坐标特性
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
        // 应该是 lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // 应该是 lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // 否则可以是 lng, lat 或 lat, lng 的任何一个
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
};

// Initialize the geocoder control
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: coordinatesGeocoder,
    zoom: 4,
    placeholder: 'Search here ...',
    mapboxgl: mapboxgl,
    reverseGeocode: true
});

// Append the geocoder to your header
document.getElementById('geocoder-container').appendChild(geocoder.onAdd(map));

// Initialize the fullscreen control
const fullscreen = new mapboxgl.FullscreenControl()

// Append the fullscreen to your header
document.getElementById('fullscreen-container').appendChild(fullscreen.onAdd(map));

// 定义空气质量图例控件
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

// 将空气质量图例控件添加到地图的右下角
map.addControl(new AirQualityLegendControl(), 'bottom-right');

// 将缩放和旋转控件添加到地图
map.addControl(new mapboxgl.NavigationControl());

// 将比例尺控件添加到地图
map.addControl(new mapboxgl.ScaleControl());
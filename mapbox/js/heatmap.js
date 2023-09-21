// 1. 数据离散化
const latRange = [53.714166, 18.424216];
const lngRange = [73.683851, 135.383069];
const gridSize = 1;
const gridData = [];

for (let lat = latRange[1]; lat <= latRange[0]; lat += gridSize) {
    for (let lng = lngRange[0]; lng <= lngRange[1]; lng += gridSize) {
        const pm25Value = getPM25Value(lng, lat);
        gridData.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [lng, lat],
                        [lng + gridSize, lat],
                        [lng + gridSize, lat - gridSize],
                        [lng, lat - gridSize],
                        [lng, lat]
                    ]
                ]
            },
            properties: {
                pm25: pm25Value
            }
        });
    }
}

// 2. 创建GeoJSON数据源
const geojson = {
    type: 'FeatureCollection',
    features: gridData
};

// 3. 在地图加载后添加fill图层
map.on('load', function () {
    addHeapMap(); // 当地图首次加载时，添加数据层
});

function addHeapMap() {
    map.addSource('pm25', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: 'pm25-fill',
        type: 'fill',
        source: 'pm25',
        paint: {
            'fill-color': [
                'interpolate', ['linear'], ['get', 'pm25'],
                0, 'rgba(0, 255, 0, 0.7)',
                50, 'rgba(255, 255, 0, 0.7)',
                100, 'rgba(255, 165, 0, 0.8)',
                150, 'rgba(255, 69, 0, 0.9)',
                200, 'rgba(255, 0, 0, 1)',
                300, 'rgba(139, 0, 0, 1)'
            ],
            'fill-opacity': 0.7
        },
        layout: {
            'visibility': 'none'  // 设置为不可见
        }
    });
}

function getPM25Value(lng, lat) {
    return Math.random() * 300;
}

document.getElementById('heatmapToggle').addEventListener('click', function () {
    const currentVisibility = map.getLayoutProperty('pm25-fill', 'visibility');
    if (currentVisibility === 'visible') {
        map.setLayoutProperty('pm25-fill', 'visibility', 'none');
    } else {
        map.setLayoutProperty('pm25-fill', 'visibility', 'visible');
    }
});

// 定义经纬度范围
const latRange = [51.514166, 18.424216];
const lngRange = [75.383851, 132.383069];

// 初始化格网大小和格网数据数组
let gridSize = 0.09;
const gridData = [];

// Fetch the interpolated PM2.5 data and use it to generate grid data
async function interpolateGridData() {
    try {
        // Fetch the interpolated data
        const response = await fetch('./data/interpolation/pm25_gz_interpolation.json');
        const pm25InterpolatedData = await response.json();

        // Generate grid data using the interpolated PM2.5 values
        pm25InterpolatedData.forEach(item => {
            gridData.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [item.grid_longitude - gridSize / 2, item.grid_latitude - gridSize / 2],
                            [item.grid_longitude + gridSize / 2, item.grid_latitude - gridSize / 2],
                            [item.grid_longitude + gridSize / 2, item.grid_latitude + gridSize / 2],
                            [item.grid_longitude - gridSize / 2, item.grid_latitude + gridSize / 2],
                            [item.grid_longitude - gridSize / 2, item.grid_latitude - gridSize / 2]
                        ]
                    ]
                },
                properties: {
                    pm25: item.pm25
                }
            });
        });

        // Once gridData is populated, update the map source
        map.getSource('pm25').setData({
            type: 'FeatureCollection',
            features: gridData
        });

    } catch (error) {
        console.error('Error fetching or processing interpolated data:', error);
    }
}

// 创建 GeoJSON 数据源
function createGeoJSONSource() {
    map.addSource('pm25', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: gridData
        }
    });
}

// 添加 Heatmap 图层
async function addHeatmapLayer() {
    interpolateGridData(); // 等待 interpolateGridData 函数完成
    createGeoJSONSource(); // 创建 GeoJSON 数据源

    map.addLayer({
        id: 'pm25-fill',
        type: 'fill',
        source: 'pm25',
        paint: {
            'fill-color': [
                'interpolate', ['linear'], ['get', 'pm25'],
                0, '#019c07',
                50, '#70be85',
                100, '#e1c76a',
                150, '#eb9371',
                200, '#b84141',
            ],
            'fill-opacity': 0.4,
            'fill-outline-color': 'rgba(0,0,0,0.1)',
        },
        layout: {
            'visibility': 'none'  // 初始设置为可见
        }
    });
}

// 更新数据和图层
function updateDataAndLayer() {
    gridData.length = 0; // 清空旧数据
    interpolateGridData(); // 使用插值添加新数据
    map.getSource('pm25').setData({ // 更新数据源
        type: 'FeatureCollection',
        features: gridData
    });
}

// 点击切换 heatmap 可见性按钮时的事件监听器
document.getElementById('heatmapToggle').addEventListener('click', function () {
    const currentVisibility = map.getLayoutProperty('pm25-fill', 'visibility');
    if (currentVisibility === 'visible') {
        map.setLayoutProperty('pm25-fill', 'visibility', 'none');
        map.setLayoutProperty('1085-stations-1cyyg4', 'visibility', 'visible');
    } else {
        map.setLayoutProperty('pm25-fill', 'visibility', 'visible');
        map.setLayoutProperty('1085-stations-1cyyg4', 'visibility', 'none');
    }
});

// 初始化时创建数据源和图层
map.on('load', function () {
    addHeatmapLayer();
});

// 点击不同尺度的 heatmap 按钮时，更新数据和图层
document.getElementById('heatmap1km').addEventListener('click', function () {
    gridSize = 0.09;
    updateDataAndLayer();
});

document.getElementById('heatmap2km').addEventListener('click', function () {
    gridSize = 0.18;
    updateDataAndLayer();
});

document.getElementById('heatmap3km').addEventListener('click', function () {
    gridSize = 0.27;
    updateDataAndLayer();
});
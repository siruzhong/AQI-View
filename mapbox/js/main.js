// Display map
mapboxgl.accessToken = 'pk.eyJ1Ijoic2lydXpob25nIiwiYSI6ImNsamJpNXdvcTFoc24zZG14NWU5azdqcjMifQ.W_2t66prRsaq8lZMSdfKzg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/siruzhong/clmr3ruds027p01pj91ajfoif/draft', // style URL
    center: [116.173553, 40.09068], // starting position [lng, lat]
    zoom: 6, // starting zoom
    projection: 'mercator' // starting projection
});

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
        map.once('style.load', addHeatmapLayer); // 当样式加载完成后，重新添加热力图层
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


// 创建一个标志来跟踪是否启用了点击事件
let isClickEnabled = false;

// 获取 <a> 标签元素
const interpolationToggle = document.getElementById('interpolation');

// 初始状态下显示 "Enable Interpolation"
interpolationToggle.textContent = 'Enable Interpolation';

// 点击 <a> 标签来切换点击事件的启用状态
interpolationToggle.addEventListener('click', function (e) {
    e.preventDefault(); // 阻止<a>标签的默认行为
    isClickEnabled = !isClickEnabled; // 切换标志状态

    // 根据 isClickEnabled 的状态更新文本内容
    interpolationToggle.textContent = isClickEnabled ? 'Disable Interpolation' : 'Enable Interpolation';
});

map.on('click', function (e) {
    if (isClickEnabled) {
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
    }
});



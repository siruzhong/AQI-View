// 使用Fetch API获取CSV文件并将其转换为GeoJSON
function csvToGeoJSON(fileUrl, callback) {
    const geojson = {
        type: 'FeatureCollection',
        features: []
    };

    // 使用Fetch API获取CSV文件
    fetch(fileUrl)
        .then(response => response.text())
        .then(csvData => {
            // 使用PapaParse解析CSV数据
            Papa.parse(csvData, {
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
                    callback(null, geojson);
                },
                error: function (error) {
                    callback(error, null);
                }
            });
        })
        .catch(error => {
            callback(error, null);
        });
}

// 添加站点数据图层
function addStationsLayer() {
    // 读取包含新数据的JSON文件
    fetch('./data/hour_data/hour_data.json')
        .then(response => response.json())
        .then(hourData => {
            // 将CSV数据转换为GeoJSON
            csvToGeoJSON('./data/1085_stations.csv', (error, geojsonData) => {
                if (error) {
                    console.error('Error:', error);
                } else {
                    // 更新geojsonData中的pm25值
                    geojsonData.features.forEach((feature, index) => {
                        feature.properties.pm25 = hourData[index].air["PM2.5"];
                        feature.properties.pm10 = hourData[index].air["PM10"];
                        feature.properties.no2 = hourData[index].air["NO2"];
                        feature.properties.co = hourData[index].air["CO"];
                        feature.properties.o3 = hourData[index].air["O3"];
                        feature.properties.so2 = hourData[index].air["SO2"];
                        feature.properties.rainfall = hourData[index].tmp["Rainfall"];
                        feature.properties.temperature = hourData[index].tmp["Temperature"];
                        feature.properties.pressure = hourData[index].tmp["Pressure"];
                        feature.properties.humidity = hourData[index].tmp["Humidity"];
                        feature.properties.windSpeed = hourData[index].tmp["Wind Speed"];
                        feature.properties.windDirection = getWindDirectionDescription(hourData[index].tmp["Wind Direction"]);
                        feature.properties.weather = getWeatherDescription(hourData[index].tmp["Weather"]);
                    });

                    console.log(geojsonData);

                    // 添加数据源
                    map.addSource('stations', {
                        type: 'geojson',
                        data: geojsonData
                    });

                    // 添加数据图层，使用基于PM2.5值的动态圆圈颜色
                    map.addLayer({
                        id: '1085-stations-1cyyg4',
                        type: 'circle',
                        source: 'stations',
                        paint: {
                            'circle-radius': 5,
                            'circle-color': [
                                'case',
                                ['<', ['get', 'pm25'], 50], '#019c07',
                                ['<', ['get', 'pm25'], 100], '#70be85',
                                ['<', ['get', 'pm25'], 150], '#e1c76a',
                                ['<', ['get', 'pm25'], 200], '#eb9371',
                                '#b84141'
                            ],
                            'circle-stroke-color': 'white',
                            'circle-stroke-width': 0.8
                        },
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error reading JSON file:', error);
        });
}

// 获取风向描述
function getWindDirectionDescription(windDirection) {
    switch (windDirection) {
        case 0:
            return "Calm";
        case 1:
            return "East";
        case 2:
            return "West";
        case 3:
            return "South";
        case 4:
            return "North";
        case 9:
            return "Variable";
        case 13:
            return "Southeast";
        case 14:
            return "Northeast";
        case 23:
            return "Southwest";
        case 24:
            return "Northwest";
        default:
            return "Unknown";
    }
}

// 获取天气描述
function getWeatherDescription(weatherClass) {
    switch (weatherClass) {
        case 0:
            return "Clear";
        case 1:
            return "Partly Cloudy";
        case 2:
            return "Overcast";
        case 3:
            return "Rain";
        case 4:
            return "Light Rain";
        case 5:
            return "Moderate Rain";
        case 6:
            return "Heavy Rain";
        case 7:
            return "Torrential Rain";
        case 8:
            return "Thunderstorm";
        case 9:
            return "Freezing Rain";
        case 10:
            return "Snow";
        case 11:
            return "Light Snow";
        case 12:
            return "Moderate Snow";
        case 13:
            return "Heavy Snow";
        case 14:
            return "Fog";
        case 15:
            return "Dust Storm";
        case 16:
            return "Blowing Sand";
        default:
            return "Unknown";
    }
}

// 判断是否在中国范围内
function isWithinBounds(lngLat) {
    const minLng = 73.683851;
    const maxLng = 135.383069;
    const minLat = 18.424216;
    const maxLat = 53.714166;

    return lngLat.lng >= minLng && lngLat.lng <= maxLng && lngLat.lat >= minLat && lngLat.lat <= maxLat;
}

// 模拟真实数据查询
function fetchDataForLocation(lngLat, callback) {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const data = {
        pm25: getRandomInt(0, 500),          // PM2.5的范围: 0-500 μg/m³
        pm10: getRandomInt(0, 1000),         // PM10的范围: 0-1000 μg/m³
        no2: getRandomInt(0, 200),           // NO2的范围: 0-200 ppb
        co: getRandomInt(0, 10),             // CO的范围: 0-10 ppm
        o3: getRandomInt(0, 500),            // O3的范围: 0-500 ppb
        so2: getRandomInt(0, 500),           // SO2的范围: 0-500 ppb
        rainfall: getRandomInt(0, 50),     // 降雨量的范围: 0-50 mm
        temperature: getRandomInt(-30, 50),  // 温度的范围: -30-50 °C
        pressure: getRandomInt(900, 1100),   // 气压的范围: 900-1100 hPa
        humidity: getRandomInt(0, 100),      // 湿度的范围: 0-100 %
        windSpeed: getRandomInt(0, 30),    // 风速的范围: 0-30 m/s
        windDirection: getWeatherDescription(0, 16), // 风向的范围: 0-360°
        weather: getWindDirectionDescription(getRandomInt(0, 4))          // 随机天气情况
    };
    callback(data);
}

// 获取污染水平
function getPollutionLevel(pm25) {
    if (pm25 <= 50) {
        return {level: 'Ideal', color: '#019c07'};
    } else if (pm25 <= 100) {
        return {level: 'Fair', color: '#70be85'};
    } else if (pm25 <= 150) {
        return {level: 'Moderate', color: '#e1c76a'};
    } else if (pm25 <= 200) {
        return {level: 'Poor', color: '#eb9371'};
    } else {
        return {level: 'Severe', color: '#b84141'};
    }
}

// 生成弹出框内容
function generatePopupContent(data, lngLat) {
    function generateIndicatorWithColorBox(indicatorName, value) {
        function getColorForValue(value) {
            if (value <= 50) return '#019c07';       // 绿色
            if (value <= 100) return '#70be85';      // 黄色
            if (value <= 150) return '#e1c76a';      // 橙色
            if (value <= 200) return '#eb9371';      // 红色
            return '#b84141';                        // 深红色
        }

        const color = getColorForValue(value);
        return `
        <div style="margin: 0 0 0 5px">${indicatorName}</div>
        <div style="width: 12px; height: 12px; background-color: ${color}; margin: 5px 5px;"></div>
        <div style="padding-left: 12px">${value}</div>
    `;
    }

    const pollution = getPollutionLevel(data.pm25);
    const now = new Date();
    const hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');  // 保证分钟总是两位数
    const amPm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime = `Update at ${hours}:${minutes} ${amPm}`;

    popupcontent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #fff; color: #333; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 10px; display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 4px 10px; align-items: center;">
        <div style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; background-color: ${pollution.color}; color: #fff; padding: 4px 0; border-radius: 4px;">
            <span style="font-weight: bold;">${pollution.level}</span>
        </div>
        ${generateIndicatorWithColorBox('PM2.5', data.pm25.toFixed(2))}
        ${generateIndicatorWithColorBox('PM10', data.pm10.toFixed(2))}
        ${generateIndicatorWithColorBox('NO2', data.no2.toFixed(2))}
        ${generateIndicatorWithColorBox('CO', data.co.toFixed(2))}
        ${generateIndicatorWithColorBox('O3', data.o3.toFixed(2))}
        ${generateIndicatorWithColorBox('SO2', data.so2.toFixed(2))}
        <div style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-cloud-rain"></i>
                <span>Rainfall: &nbsp;<u>${data.rainfall.toFixed(2)}</u> mm</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                &nbsp;<i style="margin-right: 5px; color: #777;" class="fas fa-thermometer-half"></i>&nbsp;
                <span>Temperature: &nbsp;<u>${data.temperature.toFixed(2)}</u> °C</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-tachometer-alt"></i>
                <span>Pressure: &nbsp;<u>${data.pressure.toFixed(2)}</u> hPa</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-water"></i>
                <span>Humidity: &nbsp;<u>${data.humidity.toFixed(2)}</u> %</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-wind"></i>
                <span>Wind Speed: &nbsp;<u>${data.windSpeed.toFixed(2)}</u> m/s</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-location-arrow"></i>
                <span>Wind Direction: &nbsp;<u>${data.windDirection}</u> °</span>
            </div>
            <div style="margin: 4px 0; display: flex; align-items: center;">
                <i style="margin-right: 5px; color: #777;" class="fas fa-smog"></i>
                <span>Weather: &nbsp;<u>${data.weather}</u> </span>
            </div>
            <div style="font-size:x-small; color: steelblue;">
                <strong>${formattedTime}</strong>
            </div>
            <div style="font-size:x-small; color: steelblue;">
                <strong>Coordinates: (${lngLat.lng.toFixed(3)}°E, ${lngLat.lat.toFixed(3)}°N)</strong>
            </div>
        </div>
    </div>
`
    return popupcontent
}
import json

import numpy as np

data = np.load('air_2018.npy')  # 将文件名改为 'air_2018.npy'

# Assuming data.shape is (time_slices, num_stations, num_features)
time_slices = data.shape[0]
num_stations = data.shape[1]
num_features = data.shape[2]

stations = []

for i in range(time_slices):  # Loop over time_slices
    time_data = []  # Create a list to store station data at this time slice
    for j in range(num_stations):  # Loop over stations
        station_data = {
            'air': {
                'PM2.5': data[i, j, 0].tolist(),
                'PM10': data[i, j, 1].tolist(),
                'NO2': data[i, j, 2].tolist(),
                'CO': data[i, j, 3].tolist(),
                'O3': data[i, j, 4].tolist(),
                'SO2': data[i, j, 5].tolist()
            },
            'tmp': {
                'Rainfall': data[i, j, 6].tolist(),
                'Temperature': data[i, j, 7].tolist(),
                'Pressure': data[i, j, 8].tolist(),
                'Humidity': data[i, j, 9].tolist(),
                'Wind Speed': data[i, j, 10].tolist(),
                'Wind Direction': data[i, j, 11].tolist(),
                'Weather': data[i, j, 12].tolist()
            },
        }
        time_data.append(station_data)
    stations.append(time_data)

with open('hour_data.json', 'w') as json_file:
    json.dump(stations, json_file, indent=4)

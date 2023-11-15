import json

import numpy as np
import pandas as pd
from pykrige.ok import OrdinaryKriging

CHINA_TOP_LEFT = (95.969831, 42.962843)
CHINA_BOTTOM_RIGHT = (124.738385, 20.265389)


def load_station_data(station_file):
    # Load station data from a CSV file, assuming the first row is the header
    stations = pd.read_csv(station_file)
    return stations


def load_hour_data(hour_data_file):
    with open(hour_data_file, 'r') as file:
        hour_data = json.load(file)
    return hour_data


def extract_china_stations(stations, hour_data):
    gz_stations = []
    for index, station in stations.iterrows():
        if (CHINA_TOP_LEFT[0] <= station['longitude'] <= CHINA_BOTTOM_RIGHT[0] and
                CHINA_BOTTOM_RIGHT[1] <= station['latitude'] <= CHINA_TOP_LEFT[1]):
            pm25_value = hour_data[index]['air']['PM2.5']
            gz_stations.append((station['longitude'], station['latitude'], pm25_value))
    return gz_stations


def perform_kriging_interpolation(gz_stations, span_lon, span_lat):
    lons, lats, pm25_values = zip(*gz_stations)  # Unpack tuples
    OK = OrdinaryKriging(lons, lats, pm25_values, variogram_model='gaussian', verbose=True, enable_plotting=False)

    grid_lon = np.arange(CHINA_TOP_LEFT[0], CHINA_BOTTOM_RIGHT[0], span_lon)  # ~150km in longitude
    grid_lat = np.arange(CHINA_TOP_LEFT[1], CHINA_BOTTOM_RIGHT[1], span_lat)  # ~150km in latitude
    z, ss = OK.execute('grid', grid_lon, grid_lat)

    grid_data = []
    for i in range(len(grid_lon)):
        for j in range(len(grid_lat)):
            grid_data.append({
                'grid_longitude': grid_lon[i],
                'grid_latitude': grid_lat[j],
                'pm25': z[j][i] if not np.isnan(z[j][i]) else None
            })
    return grid_data


def main():
    # File paths
    hour_data_file = "../hour_data/hour_data.json"
    station_file = '../1085_stations.csv'

    # Load data
    stations = load_station_data(station_file)
    hour_data = load_hour_data(hour_data_file)

    # Grid sizes with corresponding spans for longitude and latitude
    grid_sizes = [[50, 0.45, -0.45], [100, 0.9, -0.9], [150, 1.35, -1.35]]

    # Extract relevant stations
    gz_stations = extract_china_stations(stations, hour_data)

    # Perform kriging interpolation for each grid size
    for size in grid_sizes:
        span_distance, span_lon, span_lat = size
        grid_data = perform_kriging_interpolation(gz_stations, span_lon, span_lat)

        # Save to JSON file named according to the span distance
        file_name = f'pm25_interpolation_kriging_{span_distance}.json'
        with open(file_name, 'w') as json_file:
            json.dump(grid_data, json_file, indent=4)
        print(f"Saved kriging result to {file_name}")


if __name__ == "__main__":
    main()

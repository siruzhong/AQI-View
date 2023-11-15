import json

import numpy as np
import pandas as pd
from scipy.interpolate import Rbf

CHINA_TOP_LEFT = (75.383851, 51.514166)  # Example: (longitude, latitude)
CHINA_BOTTOM_RIGHT = (132.383069, 18.424216)


def load_station_data(station_file):
    # Load station data from a CSV file
    stations = pd.read_csv(station_file, header=None)
    stations.columns = ['code', 'longitude', 'latitude', 'name_chinese', 'name_english']
    return stations


def load_hour_data(hour_data_file):
    with open(hour_data_file, 'r') as file:
        hour_data = json.load(file)
    return hour_data


def extract_guangzhou_stations(stations, hour_data):
    # Filter for stations within Guangzhou and append PM2.5 values
    gz_stations = []
    for index in range(len(stations)):
        station = stations.iloc[index]  # Use .iloc to safely access the row by index
        try:
            longitude = float(station['longitude'])
            latitude = float(station['latitude'])
            if (CHINA_TOP_LEFT[0] <= longitude <= CHINA_BOTTOM_RIGHT[0] and
                    CHINA_BOTTOM_RIGHT[1] <= latitude <= CHINA_TOP_LEFT[1]):
                pm25_value = hour_data[index]['air']['PM2.5']  # Assuming the order is the same
                gz_stations.append({
                    'longitude': longitude,
                    'latitude': latitude,
                    'pm25': pm25_value
                })
        except ValueError as e:
            print(f"Skipping invalid data: {e}")
            continue
    return gz_stations


def perform_interpolation(gz_stations):
    # Extract points and values for interpolation
    points = np.array([[station['longitude'], station['latitude']] for station in gz_stations])
    values = np.array([station['pm25'] for station in gz_stations])

    # Create grid points
    grid_longitude = np.arange(CHINA_TOP_LEFT[0], CHINA_BOTTOM_RIGHT[0], 0.09)  # 10km in longitude
    grid_latitude = np.arange(CHINA_TOP_LEFT[1], CHINA_BOTTOM_RIGHT[1], -0.09)  # 10km in latitude
    grid_x, grid_y = np.meshgrid(grid_longitude, grid_latitude)

    # Perform RBF interpolation
    rbf = Rbf(points[:, 0], points[:, 1], values, function='linear')
    grid_z = rbf(grid_x, grid_y)

    # Generate JSON data structure
    grid_data = []
    for i in range(grid_x.shape[0]):
        for j in range(grid_x.shape[1]):
            grid_data.append({
                'grid_longitude': grid_x[i, j],
                'grid_latitude': grid_y[i, j],
                'pm25': grid_z[i, j] if not np.isnan(grid_z[i, j]) else None
            })

    # Save to JSON file
    with open('pm25_interpolation.json', 'w') as json_file:
        json.dump(grid_data, json_file, indent=4)


def main():
    # File paths
    hour_data_file = "../hour_data/hour_data.json"
    station_file = '../1085_stations.csv'

    # Load data
    stations = load_station_data(station_file)
    hour_data = load_hour_data(hour_data_file)

    # Extract relevant stations
    gz_stations = extract_guangzhou_stations(stations, hour_data)

    # Perform interpolation
    perform_interpolation(gz_stations)


if __name__ == "__main__":
    main()

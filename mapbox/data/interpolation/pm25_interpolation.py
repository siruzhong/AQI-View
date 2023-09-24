import numpy as np
import pandas as pd
from scipy.interpolate import Rbf


def load_data(hour_data_file, stations_file):
    # Load hourly PM2.5 data from a numpy file
    hour_data = np.load(hour_data_file)

    # Extract PM2.5 values from the hour_data
    hour_pm25 = hour_data[..., 0]

    # Load station data from a CSV file
    stations = pd.read_csv(stations_file)

    # Add PM2.5 data to the stations DataFrame
    stations['pm25'] = hour_pm25

    return stations


def create_grid(top_left, bottom_right, grid_length):
    # Calculate the longitude and latitude spans
    longitude_span = bottom_right[0] - top_left[0]
    latitude_span = top_left[1] - bottom_right[1]

    # Calculate the grid spans in longitude and latitude
    grid_longitude_span = grid_length / (111.12 * np.cos(np.radians(top_left[1])))
    grid_latitude_span = grid_length / 111.12

    # Calculate the number of grid cells in longitude and latitude
    num_longitude_grids = int(np.ceil(longitude_span / grid_longitude_span))
    num_latitude_grids = int(np.ceil(latitude_span / grid_latitude_span))

    # Create an empty grid with zeros
    grids = np.zeros((num_latitude_grids, num_longitude_grids))

    return grids, grid_longitude_span, grid_latitude_span


def interpolate_data(points, values, new_points):
    # Perform interpolation using Radial Basis Function (RBF)
    rbf = Rbf(points[:, 0], points[:, 1], values, function='linear')
    interpolated_values = rbf(new_points[:, 0], new_points[:, 1])

    return interpolated_values


def fill_grid(grids, interpolated_values):
    # Fill in the grid with interpolated values
    mask = grids == 0
    grids[mask] = interpolated_values[:np.sum(mask)]


def main():
    # File paths
    hour_data_file = "../hour_data/hour_data.npy"
    stations_file = '../1085_stations.csv'

    # Define the coordinates of the top-left and bottom-right corners of the region
    top_left = (73.683851, 53.714166)
    bottom_right = (135.383069, 18.424216)

    # Define the grid cell size (1 km)
    grid_length = 1.0

    # Load data
    stations = load_data(hour_data_file, stations_file)

    # Create the grid
    grids, grid_longitude_span, grid_latitude_span = create_grid(top_left, bottom_right, grid_length)

    # Extract points with values and create arrays
    points = []
    values = []

    for index, row in stations.iterrows():
        longitude = row['longitude']
        latitude = row['latitude']
        pm25 = row['pm25']

        if top_left[0] <= longitude <= bottom_right[0] and bottom_right[1] <= latitude <= top_left[1]:
            # Calculate relative coordinates to the top-left corner
            relative_longitude = longitude - top_left[0]
            relative_latitude = top_left[1] - latitude

            # Determine the grid cell
            grid_longitude = int(np.floor(relative_longitude / grid_longitude_span))
            grid_latitude = int(np.floor(relative_latitude / grid_latitude_span))

            grids[grid_latitude][grid_longitude] = pm25

            # Store non-zero values for interpolation
            points.append([grid_latitude, grid_longitude])
            values.append(pm25)

    points = np.array(points)
    values = np.array(values)

    # Remove missing values (NaNs) from the arrays
    mask = ~np.isnan(values)
    points = points[mask]
    values = values[mask]

    # Generate a new set of grid points
    new_points = np.array(np.meshgrid(range(grids.shape[0]), range(grids.shape[1]))).T.reshape(-1, 2)

    # Perform interpolation
    interpolated_values = interpolate_data(points, values, new_points)

    # Fill the grid with interpolated values
    fill_grid(grids, interpolated_values)

    # Assuming 'grids' is your two-dimensional grid array
    # Specify the .npy file path where you want to save the data
    output_npy_file = "grids.npy"

    # Save the 'grids' array as a .npy file
    np.save(output_npy_file, grids)


if __name__ == "__main__":
    main()

import json

import numpy as np

# Load the data
data = np.load('air_2018.npy')  # Load the file

# Assuming data.shape is (time_slices, num_stations, num_features)
# We'll exclude a time slice for a station if any of the relevant features are zero

# Define the indices of the features to check for zero values
features_to_check = [0, 1, 2, 3, 4, 5, 6, 7, 8]  # PM2.5, PM10, NO2, CO, O3, SO2, Rainfall, Temperature, Pressure

# Create a mask where true indicates that none of the features of interest are zero
mask = ~np.any(data[:, :, features_to_check] == 0, axis=2)

# Apply the mask to data, replacing excluded values with NaN
filtered_data = np.where(mask[:, :, None], data, np.nan)

# Calculate mean and variance while ignoring NaNs
mean_values = np.nanmean(filtered_data, axis=(0, 1))
variance_values = np.nanvar(filtered_data, axis=(0, 1))

# Feature names
feature_names = ["PM2.5", "PM10", "NO2", "CO", "O3", "SO2", "Rainfall", "Temperature", "Pressure"]

# Creating a dictionary to hold the results
statistics = {
    feature: {
        "mean": mean_values[i].item(),  # Convert numpy types to native Python types for JSON serialization
        "variance": variance_values[i].item()
    } for i, feature in enumerate(feature_names)
}

# Save to a JSON file
with open('yearly_statistics_excluding_zeros.json', 'w') as json_file:
    json.dump(statistics, json_file, indent=4)

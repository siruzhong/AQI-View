# AQIView: Air Quality Visualization Tool

## Introduction
AQIView is a web-based tool for visualizing air quality data across Mainland China. It offers a user-friendly interface with interactive maps, enabling comprehensive analysis and insights into environmental data.

## Project Structure
- `/assets` - Graphical assets used in the project.
- `/css` - Cascading Style Sheets for styling the web pages.
- `/data` - Data files for air quality indices and related information.
- `/js` - JavaScript files containing the logic and functions of the application:
  - `data.js` - Manages the fetching and organization of air quality data.
  - `heatmap.js` - Generates the heatmap for visualizing data.
  - `interpolation.js` - Handles interpolation for areas without data.
  - `main.js` - The main script that initializes and runs the application.
  - `style.js` - Contains functions related to the dynamic styling of the application.
  - `tool.js` - Includes utility functions used across the application.
- `index.html` - The main entry point for the AQIView application.
- `nginx.conf` - Configuration file for the NGINX server if deployment is needed.
- `.gitignore` - Specifies intentionally untracked files to ignore.

## Getting Started
To run AQIView, simply open `index.html` in your web browser. No additional setup is required for local use.

## Deployment
For deployment, ensure that the NGINX server is configured using `nginx.conf`. Adjust settings according to your deployment environment.
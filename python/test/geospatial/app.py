import pandas as pd
import geopandas as gpd

import folium
from flask import Flask, render_template_string ,request, render_template,jsonify
import geoplot
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import logging
from shapely.geometry import Point
from folium.plugins import HeatMap

app = Flask(__name__)

def assign_color(value, max_value):
    try:
        value = float(value)  # Ensure value is a float
        ratio = value / max_value  # Calculate the ratio of value to max_value
    except (ValueError, TypeError, ZeroDivisionError):
        return '#FFEDA0'  # Return default color for invalid or missing values or in case max_value is 0

    if ratio > 0.875: return '#800026'
    elif ratio > 0.75: return '#BD0026'
    elif ratio > 0.625: return '#E31A1C'
    elif ratio > 0.5: return '#FC4E2A'
    elif ratio > 0.375: return '#FD8D3C'
    elif ratio > 0.25: return '#FEB24C'
    elif ratio > 0.125: return '#FED976'
    else: return '#FFEDA0'


logging.basicConfig(filename='app.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

# Load geospatial data
gdf = gpd.read_file("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/latvian_map_data/Territorial_units_LV_1.2m_(2024.01.01.).shp", encoding='utf-8')
gdf_2 = gpd.read_file("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/latvian_map_data/Administrativas_teritorijas_2021.shp", encoding='utf-8')
df = pd.read_excel("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/raditaji.xlsx")
xls = pd.ExcelFile("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/raditaji.xlsx")

reģions_index = df.columns.get_loc("Reģions")
new_columns_order = df.columns[reģions_index:].tolist()
new_columns_order += df.columns[:reģions_index].tolist()
df = df[new_columns_order]

# Reading all sheets from the Excel file

all_sheets_df = pd.read_excel("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/raditaji.xlsx", sheet_name=None)
sheets_df= {}
for sheet_name in xls.sheet_names:
    # Here, dtype=str ensures all columns are treated as strings
    sheets_df[sheet_name] = pd.read_excel(xls, sheet_name=sheet_name, header=0, dtype=str)
    


 # Check the current CRS
gdf = gdf.to_crs(epsg=4326)
gdf_2 = gdf_2.to_crs(epsg=4326)  # Convert to WGS84 if necessary
# Merge the two dataframes
# Initialize a dictionary to store the merged data for each sheet
# Assume sheets_df is your dictionary of DataFrames from Excel sheets
merged_data_dict = {}

for sheet_name, df in sheets_df.items():
    # Initial merge attempt
    if 'Teritoriālais iedalījums' in df.columns:
        merged_df = gdf.merge(df, left_on='L1_name', right_on='Teritoriālais iedalījums', how='left')
    else:
        merged_df = gdf_2.merge(df, left_on='NOSAUKUMS', right_on='Pašvaldība', how='left')

    # Check and merge unmatched rows using LABEL against Pašvaldība
    unmatched = merged_df[merged_df['Pašvaldība'].isnull()]
    if not unmatched.empty:
        matched_using_label = gdf_2.merge(unmatched, left_on='LABEL', right_on='Pašvaldība', how='inner')
        merged_df.update(matched_using_label)

    # Convert the merged DataFrame to a GeoDataFrame
    merged_data_dict[sheet_name] = gpd.GeoDataFrame(merged_df)

    numeric_columns = df.select_dtypes(include='number').columns.tolist()

    for column in numeric_columns:
        if not pd.api.types.is_numeric_dtype(merged_data_dict[sheet_name][column]):
            merged_data_dict[sheet_name][column] = pd.to_numeric(merged_data_dict[sheet_name][column], errors='coerce')
        

           





#merged_data = gpd.GeoDataFrame(gdf.merge(df, left_on='L1_name', right_on='Teritoriālais iedalījums', how='left'))
merged_data3 = gpd.GeoDataFrame(gdf_2.merge(df, left_on='NOSAUKUMS', right_on='Pašvaldība', how='left'))
year = 2022  # The year you're interested in
year_str = str(year)  # Convert the year to a string




# Define a function for when a feature is highlighted (clicked or hovered over)
highlight_function = lambda x: {'fillColor': '#646464',  # Darker color
                                'color': '#646464',  # Darker outline color
                                'weight': 3,  # Make outline thicker
                                'fillOpacity': 0.1}  # Optional: Change fill opacity





heatmap_data = []


@app.route('/sheets')
def get_sheets():
    return {'sheets': list(sheets_df.keys())}
@app.route('/sheet_data/<path:sheet_name>')
def get_sheet_data(sheet_name):
    try:
        year = request.args.get('year')  # Get the year from the query parameter
        if sheet_name in merged_data_dict:
            merged_geo_df = merged_data_dict[sheet_name]

            if year and year in merged_geo_df.columns:
                # Filter the GeoDataFrame for the selected year
                # Here you could also calculate the min and max values for color scaling
                filtered_df = merged_geo_df[[year, 'geometry']]
                min_value = filtered_df[year].min()
                max_value = filtered_df[year].max()

                # Add min and max values to the GeoJSON properties for client-side use
                for feature in filtered_df.__geo_interface__['features']:
                    feature['properties']['minValue'] = min_value
                    feature['properties']['maxValue'] = max_value

                geojson_str = jsonify(filtered_df.__geo_interface__)
            else:
                # If no year is provided or the year is not in the dataframe, return the whole GeoDataFrame
                geojson_str = merged_geo_df.to_json()

            return app.response_class(response=geojson_str, mimetype='application/json')
        else:
            return jsonify({"error": "Sheet not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


@app.route('/')
def index():
    logging.debug("Index route is called.")
  

    return render_template("map.html" )

if __name__ == '__main__':
    app.run(debug=True, threaded=True) 
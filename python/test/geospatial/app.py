import pandas as pd
import geopandas as gpd
import folium
import glob
import os
from flask import Flask, render_template_string ,request,redirect, render_template,jsonify, url_for , flash
import geoplot
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import logging
from shapely.geometry import Point
from folium.plugins import HeatMap
from werkzeug.utils import secure_filename


#initialize flask app
app = Flask(__name__)
global df
UPLOAD_FOLDER = 'C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/upload/'  # Specify the upload folder path
ALLOWED_EXTENSIONS = {'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB upload limit



def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



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
  # Declare global if these variables are to be updated

logging.basicConfig(filename='app.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')


uploads_dir = "C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/upload/"
# List all files in the uploads directory
files_in_uploads = os.listdir(uploads_dir)

# Filter for any '.xlsx' file
xlsx_files = [file for file in files_in_uploads if file.endswith('.xlsx')]

# Process each '.xlsx' file
for xlsx_file in xlsx_files:
    # Construct the full path to the '.xlsx' file
    xlsx_path = os.path.join(uploads_dir, xlsx_file)
    
    # Load the Excel file
    df = pd.read_excel(xlsx_path)
    xls = pd.ExcelFile(xlsx_path)


# Load geospatial data
gdf = gpd.read_file("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/latvian_map_data/Territorial_units_LV_1.2m_(2024.01.01.).shp", encoding='utf-8')
gdf_2 = gpd.read_file("C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/latvian_map_data/Administrativas_teritorijas_2021.shp", encoding='utf-8')
gdf = gdf.to_crs(epsg=4326)
gdf_2 = gdf_2.to_crs(epsg=4326)  # Convert to WGS84 if necessary
reģions_index = df.columns.get_loc("Reģions")
new_columns_order = df.columns[reģions_index:].tolist()
new_columns_order += df.columns[:reģions_index].tolist()
df = df[new_columns_order]
sheets_df = {}
merged_data_dict = {}





# Path to the directory containing Excel files


# List all Excel files in the directory


# Iterate over each Excel file
excel_files = glob.glob(os.path.join(uploads_dir, '*.xlsx'))
for excel_file in excel_files:
    # Load the Excel file
    xls = pd.ExcelFile(excel_file)
    
    # Get the basename of the file (for use in the dictionary keys)
    base_filename = os.path.basename(excel_file)
    
    # Iterate over each sheet in the Excel file
    for sheet_name in xls.sheet_names:
        # Read the sheet into a DataFrame, ensuring all data is read as strings
        df = pd.read_excel(xls, sheet_name=sheet_name, header=0, dtype=str)
        
        # Create a unique key for the sheet using both the filename and sheet name
        # This avoids overwriting data from sheets with the same name in different files
        key = f'{sheet_name}'
        
        # Store the DataFrame in the dictionary
        sheets_df[key] = df





def calculate_quantiles(df, column):
    """Calculate quantiles for a given column in a DataFrame."""
    # Ensure the column is numeric
    if pd.api.types.is_numeric_dtype(df[column]):
        return df[column].quantile([0.2, 0.4, 0.6, 0.8]).values.tolist()
    else:
        # Return None or an appropriate value if the column is not numeric
        return None

for sheet_name, df in sheets_df.items():
    # Convert columns to string to ensure proper merging
    df = df.astype(str)
    
    # Determine the appropriate GeoDataFrame and merge columns based on the sheet's contents
    if 'Teritoriālais iedalījums' in df.columns:
        merge_columns = ('L1_name', 'Teritoriālais iedalījums')
        gdf_used = gdf
    else:
        merge_columns = ('NOSAUKUMS', 'Pašvaldība')
        gdf_used = gdf_2
    
    # Perform the initial merge
    merged_df = gdf_used.merge(df, left_on=merge_columns[0], right_on=merge_columns[1], how='left')
    
    # If we are using 'NOSAUKUMS' and 'Pašvaldība' as merge columns,
    # check for unmatched rows and perform a secondary merge with gdf_2 using 'LABEL'
    if merge_columns == ('NOSAUKUMS', 'Pašvaldība'):
        # Identify rows in df that didn't match
        unmatched_df = df[~df[merge_columns[1]].isin(merged_df[merge_columns[1]])]
        
        if not unmatched_df.empty:
            matched_using_label = gdf_2.merge(unmatched_df, left_on='LABEL', right_on=merge_columns[1], how='inner')
            # Concatenate the matched rows using LABEL with the main merged DataFrame
            merged_df = pd.concat([merged_df, matched_using_label], ignore_index=True)
    
    # Ensure the result is a GeoDataFrame
    merged_data_dict[sheet_name] = gpd.GeoDataFrame(merged_df, geometry='geometry')

    # Calculate quantiles for numeric columns and store the results
    quantiles_dict = {}
    for column in merged_df.select_dtypes(include='number').columns:
        quantiles_dict[column] = calculate_quantiles(merged_df, column)
    
    # Store the quantiles in the merged_data_dict as well
    merged_data_dict[sheet_name]['quantiles'] = quantiles_dict






quantiles_info = {}  # Global variable to store quantiles

def calculate_quantiles_for_all_columns(df):
    quantiles = {}
    for column in df.select_dtypes(include=[np.number]).columns:
        quantiles[column] = df[column].quantile([0.2, 0.4, 0.6, 0.8]).tolist()
    return quantiles

def update_application_state(new_file_path):
    global sheets_df, quantiles_info  # Access global variables
    try:
            # Path to the directory containing Excel files


        # List all Excel files in the directory
        excel_files = glob.glob(os.path.join(uploads_dir, '*.xlsx'))

        # Iterate over each Excel file
        for excel_file in excel_files:
            # Load the Excel file
            xls = pd.ExcelFile(excel_file)
            
            # Get the basename of the file (for use in the dictionary keys)
            base_filename = os.path.basename(excel_file)
            
            # Iterate over each sheet in the Excel file
            for sheet_name in xls.sheet_names:
                # Read the sheet into a DataFrame, ensuring all data is read as strings
                df = pd.read_excel(xls, sheet_name=sheet_name, header=0, dtype=str)
                
                # Create a unique key for the sheet using both the filename and sheet name
                # This avoids overwriting data from sheets with the same name in different files
                key = f'{sheet_name}'
                
                # Store the DataFrame in the dictionary
                sheets_df[key] = df
        
        for sheet_name, df in sheets_df.items():
            # Convert columns to string to ensure proper merging
            df = df.map(str)
            
            # Determine the appropriate GeoDataFrame and merge columns based on the sheet's contents
            if 'Teritoriālais iedalījums' in df.columns:
                merge_columns = ('L1_name', 'Teritoriālais iedalījums')
                gdf_used = gdf
            else:
                merge_columns = ('NOSAUKUMS', 'Pašvaldība')
                gdf_used = gdf_2
            
            # Perform the initial merge
            merged_df = gdf_used.merge(df, left_on=merge_columns[0], right_on=merge_columns[1], how='left')
            
            # Attempt to merge unmatched rows, if necessary
            if 'LABEL' in df.columns and 'Pašvaldība' in merged_df.columns:
                unmatched = merged_df[merged_df['Pašvaldība'].isna()]
                if not unmatched.empty:
                    matched_using_label = gdf_2.merge(unmatched, left_on='LABEL', right_on='Pašvaldība', how='inner')
                    merged_df.update(matched_using_label)
            
            # Ensure the result is a GeoDataFrame
            merged_data_dict[sheet_name] = gpd.GeoDataFrame(merged_df, geometry='geometry')
            
            # Calculate quantiles for numeric columns and store the results
            quantiles_dict = {}
            for column in merged_df.select_dtypes(include='number').columns:
                quantiles_dict[column] = calculate_quantiles(merged_df, column)
            
            # Assuming you want to store the quantiles in the merged_data_dict as well
            merged_data_dict[sheet_name]['quantiles'] = quantiles_dict        
    except Exception as e:
        logging.error(f"Failed to update application state: {str(e)}")

def get_sheet_data_with_full_name(filename):
    """Scan each sheet in the given Excel file for 'NOSAUKUMS' and return sheet data along with full names."""
    full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    xls = pd.ExcelFile(full_path)
    sheet_full_names = {}

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        
        # Assuming 'NOSAUKUMS' might be in a specific cell at the bottom of the sheet
        # Here, we're scanning the last 10 rows for simplicity; adjust as needed
        nosaukums_row = df.tail(10).apply(lambda row: row.str.contains('NOSAUKUMS', case=False, na=False)).any(axis=1)
        if nosaukums_row.any():
            # Assuming the full name is in the cell immediately following 'NOSAUKUMS'
            full_name_row_index = nosaukums_row[nosaukums_row].index[0]  # Get the index of the first true value
            full_name = df.iloc[full_name_row_index].dropna().values[1]  # Adjust indexing based on actual layout
            sheet_full_names[sheet_name] = full_name

    return sheet_full_names

#
#Routes
#

@app.route('/list-xlsx-files')
def list_xlsx_files():
    uploads_dir = 'C:/Users/riman/OneDrive/Desktop/mag/magister_python/python/test/geospatial/upload/'  # Update this path
    files = [f for f in os.listdir(uploads_dir) if f.endswith('.xlsx')]
    return jsonify(files)
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        flash('No selected file or invalid file type')
        return redirect(request.url)
    
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    # Call the function to update application state
    update_application_state(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200
    #jsonify({'message': 'File uploaded and application state updated successfully'}), 200
  

@app.route('/sheets/<filename>')
def get_sheets(filename):
    # Make sure to validate the filename to prevent path traversal attacks
    safe_filename = secure_filename(filename)
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    try:
        xls = pd.ExcelFile(file_path)
        sheet_names = xls.sheet_names
        return jsonify({'sheets': sheet_names})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/sheet_data/<path:sheet_name>')
def get_sheet_data(sheet_name):
    
    
    year = request.args.get('year')
  
    try:
        year = request.args.get('year')
       # Get the year from the query parameter
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
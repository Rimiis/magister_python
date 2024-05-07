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


app = Flask(__name__)
global df
UPLOAD_FOLDER = './upload/' 
ALLOWED_EXTENSIONS = {'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



logging.basicConfig(filename='app.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')


uploads_dir = "./upload/"

files_in_uploads = os.listdir(uploads_dir)


xlsx_files = [file for file in files_in_uploads if file.endswith('.xlsx')]


for xlsx_file in xlsx_files:
  
    xlsx_path = os.path.join(uploads_dir, xlsx_file)
    
  
    df = pd.read_excel(xlsx_path)
    xls = pd.ExcelFile(xlsx_path)



gdf = gpd.read_file("latvian_map_data/Territorial_units_LV_1.2m_(2024.01.01.).shp", encoding='utf-8')
gdf_2 = gpd.read_file("latvian_map_data/Administrativas_teritorijas_2021.shp", encoding='utf-8')
gdf = gdf.to_crs(epsg=4326)
gdf_2 = gdf_2.to_crs(epsg=4326)  
reģions_index = df.columns.get_loc("Reģions")
new_columns_order = df.columns[reģions_index:].tolist()
new_columns_order += df.columns[:reģions_index].tolist()
df = df[new_columns_order]
sheets_df = {}
merged_data_dict = {}


def calculate_quantiles(df, column):
    """Calculate quantiles for a given column in a DataFrame."""
  
    if pd.api.types.is_numeric_dtype(df[column]):
        return df[column].quantile([0.2, 0.4, 0.6, 0.8]).values.tolist()
    else:
       
        return None


def merge_data(new_sheets_df):
    
    for sheet_name, df in new_sheets_df.items():
     
        df = df.astype(str)
        
        if 'Teritoriālais iedalījums' in df.columns:
            merge_columns = ('L1_name', 'Teritoriālais iedalījums')
            gdf_used = gdf
        else:
            merge_columns = ('NOSAUKUMS', 'Pašvaldība')
            gdf_used = gdf_2
        
     
        merged_df = gdf_used.merge(df, left_on=merge_columns[0], right_on=merge_columns[1], how='left')
        
       
        if merge_columns == ('NOSAUKUMS', 'Pašvaldība'):
           
            unmatched_df = df[~df[merge_columns[1]].isin(merged_df[merge_columns[1]])]
            
            if not unmatched_df.empty:
                matched_using_label = gdf_2.merge(unmatched_df, left_on='LABEL', right_on=merge_columns[1], how='inner')
              
                merged_df = pd.concat([merged_df, matched_using_label], ignore_index=True)
        
        merged_data_dict[sheet_name] = gpd.GeoDataFrame(merged_df, geometry='geometry')

       
        quantiles_dict = {}
        for column in merged_df.select_dtypes(include='number').columns:
            quantiles_dict[column] = calculate_quantiles(merged_df, column)
        
       
        merged_data_dict[sheet_name]['quantiles'] = quantiles_dict


def update_application_state(new_file_path):
    global sheets_df, merged_data_dict 
    try:
        new_sheets_df = {}
        new_merged_data_dict = {}
        
     
        xls = pd.ExcelFile(new_file_path)
        
       
        for sheet_name in xls.sheet_names:
         
            df = pd.read_excel(xls, sheet_name=sheet_name, header=0, dtype=str)
            
         
            new_sheets_df[sheet_name] = df
            
     
        merge_data(new_sheets_df)
        
        sheets_df.update(new_sheets_df)
        merged_data_dict.update(new_merged_data_dict)
    except Exception as e:
        logging.error(f"Failed to update application state: {str(e)}")


def calculate_quantiles_for_all_columns(df):
    """Calculate quantiles for all numeric columns in a DataFrame."""
    quantiles = {}
    for column in df.select_dtypes(include=[np.number]).columns:
        quantiles[column] = df[column].quantile([0.2, 0.4, 0.6, 0.8]).tolist()
    return quantiles


def preprocess_merge_columns(df, columns):
    """Preprocess specified columns in a dataframe for merging."""
    for col in columns:
        if col in df.columns:
            # Convert to string and strip leading/trailing whitespaces
            df[col] = df[col].astype(str).str.strip()
    return df


# Path to the directory containing Excel files
uploads_dir = "./upload/"

# List all Excel files in the directory
excel_files = glob.glob(os.path.join(uploads_dir, '*.xlsx'))

# Iterate over each Excel file
for excel_file in excel_files:
    update_application_state(excel_file)

#
# Routes
#
@app.route('/list-xlsx-files')
def list_xlsx_files():
    uploads_dir = './upload/' 
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
    update_application_state(save_path)
    return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200


@app.route('/sheets/<filename>')
def get_sheets(filename):
    
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
        # Get the year from the query parameter
        if sheet_name in merged_data_dict:
            
            merged_geo_df = merged_data_dict[sheet_name]
            
            if year and year in merged_geo_df.columns:
                # Filter the GeoDataFrame for the selected year
                
                merged_geo_df[year] = merged_geo_df[year].apply(lambda x: round(float(x), 1) if pd.notnull(x) else x)
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

    return render_template("map.html")

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
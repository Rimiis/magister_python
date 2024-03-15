var mymap = L.map('mapid').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

var mymap2 = L.map('mapid2').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap2);


fetch('/sheets').then(response => response.json()).then(data => {
    var select = document.getElementById('sheet-select');
    data.sheets.forEach(sheet => {
        var option = document.createElement('option');
        option.text = sheet;
        option.value = sheet;
        select.add(option);
    });
});

let currentLayer;





var defaultStyle = {
    fillColor: 'green',
    color: 'green',
    weight: 2,
    fillOpacity: 0.5
};

var highlightStyle = {
    fillColor: '#646464',
    color: '#646464',
    weight: 3,
    fillOpacity: 0.8
};

var lastClickedLayer = null;

var currentGeoJSONLayer = null;
function updateGeoJSONLayer(sheetName) {
    // Construct the URL for fetching GeoJSON data based on the selected sheet
    const geojsonUrl = `/sheet_data/${encodeURIComponent(sheetName)}`;

    // Remove the existing GeoJSON layer, if any
    if (currentGeoJSONLayer) {
        mymap.removeLayer(currentGeoJSONLayer);
    }

    // Fetch the new GeoJSON data and create a layer
    currentGeoJSONLayer = new L.GeoJSON.AJAX(geojsonUrl, {
        style: defaultStyle,
        onEachFeature: function(feature, layer) {
            layer.on('click', function(e) {
                if (lastClickedLayer) lastClickedLayer.setStyle(defaultStyle);
                e.target.setStyle(highlightStyle);
                lastClickedLayer = e.target;
                var props = e.target.feature.properties;
                // Assuming you have a function to update the dataTable based on the clicked feature
                updateDataTable(props);
               
            });
            if (feature.properties && feature.properties['Pašvaldība']) {
                layer.bindTooltip(feature.properties['Pašvaldība'], {
                    permanent: false, // Set to true if you want the labels to always be visible
                    direction: 'auto'
                });

            }
            if(feature.properties && feature.properties['Teritoriālais iedalījums']){
                layer.bindTooltip(feature.properties['Teritoriālais iedalījums'], {
                    permanent: false, // Set to true if you want the labels to always be visible
                    direction: 'auto'
                });
            }
        }
    }).addTo(mymap);
}


function fetchSheetData(sheetName) {
    // Fetch data for the selected sheet without filtering by region on the server
    var url = `/sheet_data/${encodeURIComponent(sheetName)}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
          
            const filteredData = data.filter(row => row['Teritoriālais iedalījums'] === selectedRegion);

            // Update the table with the filtered data
            
            updateDataTable(filteredData);
        })
        .catch(error => console.error('Error fetching sheet data:', error));
}
var choroplethLayer;
var heatmapLayer;


function fetchAndCreateChoropleth(url) {
    // Assuming 'url' parameter is the complete URL to fetch the GeoJSON data
    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(geojsonData => {
        // Assuming you have a global variable for the choropleth layer that can be reused
        if (mymap2. choroplethLayer) {
            mymap2.removeLayer(mymap2.choroplethLayer); // Remove the existing choropleth layer if it exists
        }

        let minValue = Infinity;
        let maxValue = -Infinity;
        function onEachFeature(feature, layer) {
            // Check if the feature has the property you want to show in the tooltip
            if (feature.properties && feature.properties['Pašvaldība']) {
                layer.bindTooltip(feature.properties['Pašvaldība'], {
                    permanent: false, // Set to true if you want the labels to always be visible
                    direction: 'auto'
                });
            }
            if (feature.properties && feature.properties['Teritoriālais iedalījums']) {
                layer.bindTooltip(feature.properties['Teritoriālais iedalījums'], {
                    permanent: false, // Set to true if you want the labels to always be visible
                    direction: 'auto'
                });
            }

            

        }
       

        // Create a choropleth layer using the fetched GeoJSON data
        mymap2.choroplethLayer = L.geoJson(geojsonData, {
            style: function(feature) {
                geojsonData.features.forEach(feature => {
                    const value = parseFloat(feature.properties[document.getElementById('year-select').value]);
                    if (!isNaN(value)) {
                        minValue = Math.min(minValue, value);
                        maxValue = Math.max(maxValue, value);
                    }
                   

                   
                });
              
                return {
                    fillColor:  getColor(feature.properties[document.getElementById('year-select').value], minValue, maxValue),
                    weight: 2,
                    opacity: 0.2,
                    label:  `heatmap for ${selectedSheet}`,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
                
            },
            onEachFeature: onEachFeature


        }).addTo(mymap2);
        

        // Function to determine the color based on a property value
      
    })
    .catch(error => console.error('Error fetching sheet data:', error));
}
// Example array of years available in your dataset
const availableYears = [,'2018','2016','2017','2018','2019','2020', '2021', '2022'];

function populateYearSelector(years) {
  const yearSelect = document.getElementById('year-select');
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.innerText = year;
    yearSelect.appendChild(option);
  });
}



function fetchAndDisplayDataForYear(sheetName, selectedYear) {
    const url = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        // Assuming 'data' includes GeoJSON data along with minValue and maxValue for the selected year
        fetchAndCreateChoropleth(url); // Implement this function based on your needs
      })
      .catch(error => console.error('Error fetching data for year:', error));
  }
  
  // Call this function whenever the year or sheet changes
  const yearSelect = document.getElementById('year-select');
  const sheetSelect = document.getElementById('sheet-select'); // Assuming you already have this
  
  yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value;
    const selectedSheet = sheetSelect.value;
    fetchAndDisplayDataForYear(selectedSheet, selectedYear);
  });
  
  // Initially load map with default values
  document.addEventListener('DOMContentLoaded', () => {
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; // Set default year in selector
    fetchAndDisplayDataForYear(initialSheet, initialYear);
  });
// Call this function when your page loads or when you receive the available years from the backend
populateYearSelector(availableYears);

function getColor(value, minValue, maxValue) {
    // Ensure the value is a number.
    const numValue = parseFloat(value);

    // Create a scale with chroma.js
    const scale = chroma.scale(['#fef0d9', '#b30000']).domain([minValue, maxValue]);

    // Use the scale to get the color for the current value.
    return scale(numValue).hex();
}
function createHeatmap(geojsonData) {
    var heatPoints = [];
    geojsonData.features.forEach(function(feature) {
        // Assuming your GeoJSON features have 'latitude' and 'longitude' in their properties
        var lat = feature.geometry.coordinates[1];
        var lng = feature.geometry.coordinates[0];
        var intensity = feature.properties.value; // Use an appropriate property for intensity
        heatPoints.push([lat, lng, intensity]);
    });

    return L.heatLayer(heatPoints, {radius: 25, blur: 15});
}


var selectedSheet;



document.getElementById('sheet-select').addEventListener('change', function() {
    var selectedSheet = this.value;
    updateGeoJSONLayer(selectedSheet);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}`;
    fetchAndCreateChoropleth(url);
    
    fetch(`/sheet_data/${encodeURIComponent(selectedSheet)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            var dataTable = document.getElementById('region-data');
            dataTable.innerHTML = ''; // Clear existing table content

            // Updated to handle both text and numeric data. Assuming data is a JSON array of objects
            if (data && data.length > 0) {
                // Determine headers from the keys of the first object in the array
                var headers = Object.keys(data[0]);

                // Create header row
                var headerRow = document.createElement('tr');
                headers.forEach(header => {
                    var th = document.createElement('th');
                    th.textContent = header; // Set header text
                    headerRow.appendChild(th); // Add the header cell to the header row
                });
                dataTable.appendChild(headerRow); // Add the header row to the table

                // Add data rows
                data.forEach(row => {
                    var tr = document.createElement('tr');
                    headers.forEach(header => {
                        var td = document.createElement('td');
                        td.textContent = row[header] !== null ? row[header] : ''; // Handle null values
                        tr.appendChild(td); // Add the cell to the row
                    });
                    dataTable.appendChild(tr); // Add the row to the table
                });
            }
        })
        .catch(error => console.error('Error fetching sheet data:', error));
});




function updateDataTable(props) {
    // Define the order of the text fields
    const textFieldsOrder = ['Reģions', 'Pašvaldība', 'ATVK', 'Teritoriālais iedalījums'];

    // Determine headers based on predefined text fields and additional keys in props
    var headers = [...textFieldsOrder]; // Start with predefined text fields
    Object.keys(props).forEach(key => {
        if (!textFieldsOrder.includes(key)) {
            headers.push(key); // Add numeric and other fields
        }
    });

    // Create and append the header row
    var dataTable = document.getElementById('region-data');
    dataTable.innerHTML = ''; // Clear existing table content
    var headerRow = document.createElement('tr');
    headers.forEach(header => {
        var th = document.createElement('th');
        th.textContent = header; // Set header text
        headerRow.appendChild(th); // Add the header cell to the header row
    });
    dataTable.appendChild(headerRow); // Add the header row to the table

    // Create and append the data row
    var tr = document.createElement('tr');
    headers.forEach(header => {
        var td = document.createElement('td');
        td.textContent = props[header] || ''; // Set cell text to the value, or empty if undefined
        tr.appendChild(td); // Add the cell to the row
    });
    dataTable.appendChild(tr); // Add the row to the table
}

function displayData(data) {
    if (!data || data.length === 0) return; // Exit if no data or data is not an array

    // Clear existing table content
    var dataTable = document.getElementById('region-data');
    

    // Assuming data is an array of objects where each object is a row of data
    const headers = data.reduce((acc, curr) => {
        Object.keys(curr).forEach(key => {
            if (!acc.includes(key)) acc.push(key);
        });
        return acc;
    }, []);

    // Create header row
    var headerRow = document.createElement('tr');
    headers.forEach(header => {
        var th = document.createElement('th');
        th.textContent = header; // Set header text
        headerRow.appendChild(th); // Add the header cell to the header row
    });
    dataTable.appendChild(headerRow); // Add the header row to the table

    // Create and append data rows
    data.forEach(row => {
        var tr = document.createElement('tr');
        headers.forEach(header => {
            var td = document.createElement('td');
            td.textContent = row[header] || ''; // Set cell text to the value, or empty if undefined
            tr.appendChild(td); // Add the cell to the row
        });
        dataTable.appendChild(tr); // Add the row to the table
    });
}

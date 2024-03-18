var mymap1 = L.map('mapid').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap1);
var mainMap = L.map('mainMapId').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mainMap);
var mymap2 = L.map('mapid2').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap2);
// Create mymap3 with a similar setup to mymap and mymap2
var mymap3 = L.map('mapid3').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap3);
var mymap4 = L.map('mapid4').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap4);

var mymapArray = [];
mymapArray.push(mymap1);
mymapArray.push(mymap2);
mymapArray.push(mymap3);
mymapArray.push(mymap4);




fetch('/sheets').then(response => response.json()).then(data => {
    var select = document.getElementById('sheet-select1');
    var select2 = document.getElementById('sheet-select2');
    var select3 = document.getElementById('sheet-select3');
    var select4 = document.getElementById('sheet-select4');
    data.sheets.forEach(sheet => {
        var option = document.createElement('option');
        option.text = sheet;
        option.value = sheet;
        var option2 = document.createElement('option');
        option2.text = sheet;
        option2.value = sheet;
        var option3 = document.createElement('option');
        option3.text = sheet;
        option3.value = sheet;
        var option4 = document.createElement('option');
        option4.text = sheet;
        option4.value = sheet;
        select.add(option);
        select2.add(option2);
        select3.add(option3);
        select4.add(option4);

    });
});


var defaultStyle = {
    fillColor: 'grey',
    color: 'grey',
    weight: 1,
    fillOpacity: 0.9
};
var highlightStyle = {
    fillColor: '#646664',
    color: '#646464',
    weight: 3,
    fillOpacity: 0.8
};
//variables

let currentLayer;
var choroplethLayer;
var heatmapLayer;
var lastClickedLayer = null;
var currentGeoJSONLayer = null;
const availableYears = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];



function updateGeoJSONLayer(sheetName) {
    // Construct the URL for fetching GeoJSON data based on the selected sheet
    var selectedYear = document.getElementById('year-select').value;
    const geojsonUrl = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;

    // Remove the existing GeoJSON layer, if any
    if (currentGeoJSONLayer) {
        mymap.removeLayer(currentGeoJSONLayer);
    }

    // Fetch the new GeoJSON data and create a layer
    currentGeoJSONLayer = new L.GeoJSON.AJAX(geojsonUrl, {
        style: defaultStyle,
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                if (lastClickedLayer) lastClickedLayer.setStyle(defaultStyle);
                e.target.setStyle(highlightStyle);
                lastClickedLayer = e.target;
                var props = e.target.feature.properties;
                // Assuming you have a function to update the dataTable based on the clicked feature
                updateDataTable(props);

            });
            if (feature.properties && feature.properties['Pašvaldība']) {
                layer.bindTooltip(feature.properties['Pašvaldība'], {
                    permanent: false,
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
    }).addTo(mymap);
}




function fetchAndCreateChoropleth(url, mapid) {

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(geojsonData => {
            // Assuming you have a global variable for the choropleth layer that can be reused
            if (mapid.choroplethLayer && mapid.choroplethLayer.length > 0) {
                // Loop through the array of layers and remove each one
                mapid.choroplethLayer.forEach(function (layer) {
                    mapid.removeLayer(layer);
                });

                // After removing all layers, clear the array

            }
            let minValue = Infinity;
            let maxValue = -Infinity;






            // Create a choropleth layer using the fetched GeoJSON data
            mapid.choroplethLayer = L.geoJson(geojsonData, {
                style: function (feature) {

                    geojsonData.features.forEach(feature => {
                        const value = parseFloat(feature.properties[document.getElementById('year-select').value]);
                        if (!isNaN(value)) {
                            minValue = Math.min(minValue, value);
                            maxValue = Math.max(maxValue, value);
                        }



                    });


                    return {
                        fillColor: getColor(feature.properties[document.getElementById('year-select').value], minValue, maxValue),
                        weight: 2,
                        opacity: 0.2,
                        label: `heatmap for ${selectedSheet}`,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    };

                },
                onEachFeature: function (feature, layer) {
                    layer.on('click', function (e) {
                        if (lastClickedLayer) lastClickedLayer.setStyle(defaultHighlightstyle);
                        e.target.setStyle(defaultHighlightstyle);
                        lastClickedLayer = e.target;
                        var props = e.target.feature.properties;
                        // Assuming you have a function to update the dataTable based on the clicked feature
                        updateDataTable(props);

                    });
                    if (feature.properties && feature.properties['Pašvaldība']) {
                        layer.bindTooltip(feature.properties['Pašvaldība'], {
                            permanent: false,
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


            }).addTo(mapid);


            // Function to determine the color based on a property value

        })
        .catch(error => console.error('Error fetching sheet data:', error));
}





function populateYearSelector(years) {
    const yearSelect = document.getElementById('year-select');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.innerText = year;
        yearSelect.appendChild(option);
    });
}
function fetchAndDisplayDataForYear(sheetName, selectedYear, mapid) {
    const url = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Assuming 'data' includes GeoJSON data along with minValue and maxValue for the selected year
            fetchAndCreateChoropleth(url);
        })
        .catch(error => console.error('Error fetching data for year:', error));
}

// Call this function whenever the year or sheet changes
const yearSelect = document.getElementById('year-select');
const sheetSelect = document.getElementById('sheet-select1');
yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value;
    const selectedSheet = sheetSelect.value;
    fetchAndDisplayDataForYear(selectedSheet, selectedYear, mapid);
});

// Initially load map with default values
document.addEventListener('DOMContentLoaded', () => {
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; // Set default year in selector
    // Call this function when your page loads or when you receive the available years from the backend
    populateYearSelector(availableYears);
    fetchAndDisplayDataForYear(initialSheet, initialYear, mapid);

});
function getColor(value, minValue, maxValue) {
    // Ensure the value is a number.
    const numValue = parseFloat(value);
    // Create a scale with chroma.js
    const scale = chroma.scale(['#fef0d9', '#820b0b']).domain([minValue, maxValue]);
    // Use the scale to get the color for the current value.
    return scale(numValue).hex();
}
var selectedSheet;
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

// Global structure to store choropleth layers
var choroplethLayers = {
    // Example structure: 'sheetName': layerObject
};

// Initializes the map


// Define a default style for the choropleth layers
var defaultChoroplethStyle = {
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
};
var defaultHighlightstyle = {
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
};


// Function to update map layers based on selected sheets
function updateMapWithSelectedSheets() {
    ['sheet-select1', 'sheet-select2', 'sheet-select3', 'sheet-select4'].forEach(selectId => {
        var sheetName = document.getElementById(selectId).value;
        fetchAndCreateChoroplethLayerForSheet(sheetName);
    });
}



document.getElementById('sheet-select1').addEventListener('change', function () {
    var selectedSheet = this.value;
    const mapid = mymapArray[0];
    var selectedYear = document.getElementById('year-select').value;
    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    fetchAndCreateChoropleth(url, mapid);



});
document.getElementById('sheet-select2').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[1];

    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    fetchAndCreateChoropleth(url, mapid);



});
document.getElementById('sheet-select3').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[2];
    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    fetchAndCreateChoropleth(url, mapid);



});
document.getElementById('sheet-select4').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[3];
    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    fetchAndCreateChoropleth(url, mapid);



});
function updateMaps() {
    // function to update all maps after year selection, iterates over mymapArray for data and selected indicators for each map
    var selectedYear = document.getElementById('year-select').value;
    var selectedSheet = document.getElementById(`sheet-select1`).value;
    var url
    var j = 1;
    for (let i = 0; i < mymapArray.length; i++) {
        const mapid = mymapArray[i];

        selectedSheet = document.getElementById(`sheet-select${j}`).value;
        url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;

        fetchAndCreateChoropleth(url, mapid);
        j++; // utilizes previous functions to update maps

    }
}
///CLEAR MAP LAYERS
function clearAllMapLayers() {
    mymapArray.forEach(map => {
        // Assuming you only want to keep the tile layer which is usually the first layer added
        let tileLayer;
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer && !tileLayer) {
                tileLayer = layer;
            } else {
                map.removeLayer(layer);
            }
        });
        // Clear the reference to the choropleth layer if you keep one
        if (map.choroplethLayer) {
            map.choroplethLayer = null;
        }
    });
}
document.addEventListener('DOMContentLoaded', updateMapWithSelectedSheets);
// Add event listeners for sheet selection changes
document.getElementById('sheet-select1').addEventListener('change', updateMapWithSelectedSheets);
document.getElementById('sheet-select2').addEventListener('change', updateMapWithSelectedSheets);
document.getElementById('sheet-select3').addEventListener('change', updateMapWithSelectedSheets);
document.getElementById('sheet-select4').addEventListener('change', updateMapWithSelectedSheets);
//document.getElementById('year-select').addEventListener('change', updateMaps);

var updateButton = document.getElementById('update-button');
if (updateButton) { // Check if the button exists
    updateButton.addEventListener('click', function () {
        updateMaps(); // Call the UpdateMaps function when the button is clicked
    });
}
var clearLayersButton = document.getElementById('clear-layers-button');
if (clearLayersButton) {
    clearLayersButton.addEventListener('click', function () {
        clearAllMapLayers(); // Call the function to clear layers when button is clicked
    });
}
// Initialize map with default sheet selections


var form = document.getElementById('file-upload-form');
var fileInput = document.getElementById('file-input');

form.onsubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const formData = new FormData(form);

    try {
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST', // Ensure method is POST
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Handle success
        console.log('Upload successful');
    } catch (error) {
        console.error('Upload failed:', error);
    }
};

// Function to add or update a choropleth layer for a given sheet
function fetchAndCreateChoroplethLayerForSheet(sheetName) {
    var selectedYear = document.getElementById('year-select').value;
    const url = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;
    minValue = Infinity;
    maxValue = Infinity;
    fetch(url)
        .then(response => response.json())
        .then(geojsonData => {

            if (choroplethLayers[sheetName]) {
                mainMap.removeLayer(choroplethLayers[sheetName]);
            }
            geojsonData.features.forEach(feature => {
                const value = parseFloat(feature.properties[document.getElementById('year-select').value]);
                if (!isNaN(value)) {
                    minValue = Math.min(minValue, value);
                    maxValue = Math.max(maxValue, value);
                }



            });
            var layer = L.geoJson(geojsonData, {
                style: function (feature) {
                    return {
                        fillColor: getColor(feature.properties[document.getElementById('year-select').value], minValue, maxValue),
                        weight: 2,
                        opacity: 0.2,
                        label: `heatmap for ${selectedSheet}`,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    };
                }
            });
            choroplethLayers[sheetName] = layer;
            layer.addTo(mainMap);
        })
        .catch(error => console.error('Error fetching or creating choropleth layer:', error));
}


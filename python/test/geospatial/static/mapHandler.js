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
const width = 960, height = 600;
schemes = [
    {
      name: "RdBu", 
      colors: [
        "#e8e8e8", "#e4acac", "#c85a5a",
        "#b0d5df", "#ad9ea5", "#985356",
        "#64acbe", "#627f8c", "#574249"
      ]
    },
    {
      name: "BuPu", 
      colors: [
        "#e8e8e8", "#ace4e4", "#5ac8c8",
        "#dfb0d6", "#a5add3", "#5698b9", 
        "#be64ac", "#8c62aa", "#3b4994"
      ]
    },
    {
      name: "GnBu", 
      colors: [
        "#e8e8e8", "#b5c0da", "#6c83b5",
        "#b8d6be", "#90b2b3", "#567994",
        "#73ae80", "#5a9178", "#2a5a5b"
      ]
    },
    {
      name: "PuOr", 
      colors: [
        "#e8e8e8", "#e4d9ac", "#c8b35a",
        "#cbb8d7", "#c8ada0", "#af8e53",
        "#9972af", "#976b82", "#804d36"
      ]
    }
  ]


// Create an SVG element and append it to the 'd3-container' div
const svg = d3.select('#d3-container').append('svg')
    .attr('width', width)
    .attr('height', height);

// Optional: Set up a background or border for visual confirmation
svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill','none') // No fill to see underlying map if desired
    .attr('stroke', 'white');

// Now your SVG is ready to draw the map on
// You might want to define your map projection and path generator here if they won't change
const projection = d3.geoMercator()
    .center([24.1052, 56.9496]) // Centered on Latvia (example)
    .scale(7000) // Scale to fit your specific geography
    .translate([width / 2, height / 2]); // Center the map in the SVG element

const path = d3.geoPath().projection(projection);


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
                onEachFeature: function (feature, choroplethLayer) {
                    choroplethLayer.on('click', function (e) {
                        if (lastClickedLayer) lastClickedLayer.setStyle(defaultHighlightstyle);
                        e.target.setStyle(defaultHighlightstyle);
                        lastClickedLayer = e.target;
                        var props = e.target.feature.properties;
                        // Assuming you have a function to update the dataTable based on the clicked feature
                        updateDataTable(props);

                    });
                    if (feature.properties && feature.properties['Pašvaldība']) {
                        choroplethLayer.bindTooltip(feature.properties['Pašvaldība'], {
                            permanent: false,
                            direction: 'auto'
                        });

                    }
                    if (feature.properties && feature.properties['Teritoriālais iedalījums']) {
                        choroplethLayer.bindTooltip(feature.properties['Teritoriālais iedalījums'], {
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
function fetchAndDisplayDataForYear(sheetName, selectedYear) {
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

function updateD3Map(sheetName, selectedYear) {
    const url = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;

    fetch(url)
        .then(response => response.json())
        .then(geojsonData => {
            const svg = d3.select('#d3-container svg');
            const projection = d3.geoMercator().center([24.1052, 56.9496]).scale(7000).translate([svg.attr('width') / 2, svg.attr('height') / 2]);
            const path = d3.geoPath().projection(projection);
            const value = document.getElementById('year-select').value;
            // Clear previous paths
            svg.selectAll('path').remove();

            // Draw new paths based on the fetched GeoJSON data
            svg.selectAll('path')
                .data(geojsonData.features)
                .enter().append('path')
                .attr('d', path)
                .attr('fill', function(d) {
                    // Set fill color based on some property; adjust logic as necessary
                    
                    return getColor(d.properties[`${value}`], minValue, maxValue);
                });
        })
        .catch(error => console.error('Error updating D3 map:', error));
}

document.getElementById('xlsx-file-select').addEventListener('change', function() {
    const selectedFile = this.value;
    console.log('Selected XLSX file:', selectedFile);
    fetchSheetsForFile(selectedFile);
    
    
});
function fetchSheetsForFile(filename) {
    // Ensure filename is URL encoded to handle special characters
    fetch(`/sheets/${encodeURIComponent(filename)}`).then(response => response.json()).then(data => {
        // Assuming the same structure as before to update dropdowns
        const selects = ['sheet-select1', 'sheet-select2', 'sheet-select3', 'sheet-select4'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = ''; // Clear existing options
            // Add a default or prompt option
            
            data.sheets.forEach(sheet => {
                const option = new Option(sheet, sheet);
                console.log(option)
                select.add(option);
            });
        });
    }).catch(error => console.error('Error fetching sheets:', error));
}




// Add an event listener to your file selector to fetch sheets for the selected file
document.getElementById('xlsx-file-select').addEventListener('change', function() {
    const selectedFile = this.value;
    if(selectedFile) {
        fetchSheetsForFile(selectedFile);
    }
});


function updateBivariateChoroplethMap() {
    const sheetName1 = document.getElementById('sheet-select1').value;
    const sheetName2 = document.getElementById('sheet-select2').value;
    const selectedYear = document.getElementById('year-select').value;

    // URLs to fetch data for each sheet
    const url1 = `/sheet_data/${encodeURIComponent(sheetName1)}?year=${encodeURIComponent(selectedYear)}`;
    const url2 = `/sheet_data/${encodeURIComponent(sheetName2)}?year=${encodeURIComponent(selectedYear)}`;

    // Fetch data for both sheets concurrently
    Promise.all([fetch(url1).then(res => res.json()), fetch(url2).then(res => res.json())])
    .then(([data1, data2]) => {
        // Assuming data1 and data2 have the same structure
        const geojsonData = data1; // Use the structure from data1 for the paths

        // Assume we're directly modifying the SVG appended to 'd3-container'
        const svg = d3.select('#d3-container svg');
        svg.selectAll('path').remove(); // Clear previous paths

        // Draw new paths based on the fetched GeoJSON data
        svg.selectAll('path')
            .data(geojsonData.features)
            .enter().append('path')
            .attr('d', path)
            .attr('fill', d => {
                // Find corresponding feature in data2
                const matchingFeature = data2.features.find(f => f.properties.id === d.properties.id);
                
                // Calculate quantiles for both features
                const quantile1 = calculateQuantile(d.properties.value, data1.minValue, data1.maxValue);
                const quantile2 = calculateQuantile(matchingFeature.properties.value, data2.minValue, data2.maxValue);

                // Blend colors based on quantiles
                return blendColors(quantile1, quantile2, schemes); // Assuming schemes is accessible
            });
    })
    .catch(error => console.error('Error updating D3 map:', error));
}

function blendColors(color1, color2) {
    console.log('Blending colors:', color1, color2); // Log colors to debug
    
    return chroma.mix(color1, color2, 0.5, 'rgb').hex();
}

function calculateQuantile(value, minValue, maxValue) {
    const range = maxValue - minValue;
    const index = Math.floor(((value - minValue) / range) * (schemes[0].colors.length));
    return Math.max(0, Math.min(index, schemes[0].colors.length - 1)); // Clamping to valid indices
}

// Initially load map with default values
document.addEventListener('DOMContentLoaded', () => {
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; // Set default year in selector
    // Call this function when your page loads or when you receive the available years from the backend
    populateYearSelector(availableYears);
    fetchAndDisplayDataForYear(initialSheet, initialYear, mapid);
    // Define the size of the map
    
    populateXlsxFileSelect();
    updateD3Map(initialSheet, initialYear);

    // Store these for later use if necessary
    svg.datum({projection: projection, path: path});
    // Fetch the GeoJSON data
    fetch(`/sheet_data/${encodeURIComponent(initialSheet)}?year=${encodeURIComponent(initialYear)}`)
        .then(response => response.json())
        .then(geojsonData => {
            // Assuming minValue and maxValue have been calculated based on your data
            

            // Select your SVG container and bind your data
            const svg = d3.select('#d3-container').select('svg');
            const features = svg.selectAll('path')
                .data(geojsonData.features)
                .enter()
                .append('path')
                // Use the D3 geoPath generator for the 'd' attribute
                .attr('d', d3.geoPath().projection(projection))
                // Use your getColor function to style the 'fill' attribute based on feature properties
                .attr('fill', d => {
                    // Assume your value is stored under properties.value
                    const value = d.properties[`${selectedYear}`];
                    return getColor(value, minValue, maxValue); // Use your getColor function here
                });
        });

    // Example color scale function
    function colorScale(value) {
        // Define your color scale logic here, based on data values
        return d3.scaleSequential([0, 100], d3.interpolateBlues)(value);
    }

});

function getColor(value, minValue, maxValue) {
    // Ensure the value is a number.
    const numValue = parseFloat(value);
    // Check if the value is negative, and if so, return a specific color.
    if (numValue < 0) {
        return "#0000FF"; // Adjust this color code to whatever "cold" color you prefer
    }

    // Create a scale with chroma.js for non-negative values
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
    updateD3Map(selectedSheet, selectedYear);



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
        updateMaps();
        updateBivariateChoroplethMap();
         // Call the UpdateMaps function when the button is clicked
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

        
    } catch (error) {
        console.error('Upload failed:', error);
    }
};


function populateXlsxFileSelect() {
    fetch('/list-xlsx-files')
        .then(response => response.json())
        .then(files => {
            const select = document.getElementById('xlsx-file-select');
            // Clear existing options
            select.innerHTML = '<option>Select a file</option>';
            // Add an option for each file
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Could not load XLSX files:', error));
}

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


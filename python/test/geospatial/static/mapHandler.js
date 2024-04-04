var mymap1 = L.map('mapid').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap1);
var mymap2 = L.map('mapid2').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap2);
var mymap3 = L.map('mapid3').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap3);
var mymap4 = L.map('mapid4').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap4);
var mainMap = L.map('mapid5').setView([56.9463, 24.1050], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mainMap);

var mymapArray = [];
mymapArray.push(mymap1);
mymapArray.push(mymap2);
mymapArray.push(mymap3);
mymapArray.push(mymap4);
mymapArray.push(mainMap);
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
let currentLayer;
var choroplethLayer;
var heatmapLayer;
var lastClickedLayer = null;
var currentGeoJSONLayer = null;
const availableYears = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
const width = 960, height = 600;
let sheetsData = {
    'sheet1': null, // Placeholder for actual data
    'sheet2': null, // Placeholder for actual data
    // Add more sheets as needed
};

function addLegend(map, colors, values) {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const gradientColors = colors.join(", ");
        const labels = values.map((value, index) => {
            return `<span style="left: ${(index / (values.length - 1)) * 100}%; position: absolute;">${value.toFixed(2)}</span>`;
        }).join("");

        div.innerHTML = `
            <div style="width: 200px; height: 20px; position: relative; background: linear-gradient(to right, ${gradientColors});"></div>
            <div style="width: 200px; position: relative; height: 20px; margin-top: 5px;">
                ${labels}
            </div>
        `;

        return div;
    };

    // Remove existing legend if present
    if (map.legend) {
        map.removeControl(map.legend);
    }

    // Add the new legend to the map
    legend.addTo(map);
    map.legend = legend; // Store reference to the legend
}
function generateLegendColors(minValue, maxValue) {
    const sampleValues = [];
    const negativeSteps = 4; // Number of steps for negative values, adjust as needed
    const positiveSteps = 4; // Number of steps for positive values, adjust as needed
    const negativeStep = minValue / (negativeSteps - 1);
    const positiveStep = maxValue / (positiveSteps - 1);

    // Generate negative values (if minValue is negative)
    for (let i = 0; i < negativeSteps && minValue < 0; i++) {
        sampleValues.push(negativeStep * i);
    }

    // Generate positive values
    for (let i = 0; i < positiveSteps; i++) {
        sampleValues.push(positiveStep * i);
    }

    // Use the getColor function to map these sample values to colors
    const sampleColors = sampleValues.map(value => getColor(value, minValue, maxValue));
    
    return { sampleValues, sampleColors };
}



const projection = d3.geoMercator()
.center([24.1052, 56.9496]) // Center the map (example: center of Latvia)
.scale(7000) // Scale for zooming (adjust according to your needs)
.translate([width / 2, height / 2]); // Center the map in the SVG element




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

function fetchAndCreateChoropleth(url, mapid) {
    // Adjusting addLegend function call to use generated sample values and colors
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(geojsonData => {
          
            
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

            const { sampleValues, sampleColors } = generateLegendColors(minValue, maxValue);
            addLegend(mapid, sampleColors, sampleValues);
            

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

const yearSelect = document.getElementById('year-select');
const sheetSelect = document.getElementById('sheet-select1');

function updateD3Map(sheetName, selectedYear) {
    const url = `/sheet_data/${encodeURIComponent(sheetName)}?year=${encodeURIComponent(selectedYear)}`;

    fetch(url)
        .then(response => response.json())
        .then(geojsonData => {
            const svg = d3.select('#d3-container svg');
            const projection = d3.geoMercator().center([24.1052, 56.9496]).scale(7000).translate([svg.attr('width') / 2, svg.attr('height') / 2]);
            const path = d3.geoPath().projection(projection);
            const value = document.getElementById('year-select').value;
            
            svg.selectAll('path').remove();
            svg.selectAll('path')
                .data(geojsonData.features)
                .enter().append('path')
                .attr('d', path)
                .attr('fill', function(d) {
                    
                    
                    return getColor(d.properties[`${value}`], minValue, maxValue);
                });
        })
        .catch(error => console.error('Error updating D3 map:', error));
}

document.getElementById('xlsx-file-select').addEventListener('change', function() {
    const selectedFile = this.value;
    
    fetchSheetsForFile(selectedFile);

});
async function fetchAllSheetData() {
    const sheetNames = Object.keys(sheetsData); // Assuming you know sheet names ahead of time or have fetched them already
    try {
      const fetchPromises = sheetNames.map(sheetName => fetch(`/sheet_data/${sheetName}`).then(response => response.json()));
      const results = await Promise.all(fetchPromises);
      results.forEach((data, index) => {
        const sheetName = sheetNames[index];
        sheetsData[sheetName] = data; // Populate the sheetsData object with fetched data
      });
      console.log('All sheet data loaded:', sheetsData);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    }
  }
fetchAllSheetData();

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
                
                select.add(option);
            });
        });
    }).catch(error => console.error('Error fetching sheets:', error));
}

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

    Promise.all([
        fetch(`/sheet_data/${encodeURIComponent(sheetName1)}?year=${encodeURIComponent(selectedYear)}`).then(res => res.json()),
        fetch(`/sheet_data/${encodeURIComponent(sheetName2)}?year=${encodeURIComponent(selectedYear)}`).then(res => res.json())
    ])
    .then(([data1, data2]) => {
        const svg = d3.select('#d3-container').html("").append('svg')
            .attr('width', width)
            .attr('height', height);

        // Assuming projection is defined elsewhere according to your geographic focus
        const path = d3.geoPath().projection(projection);
        const selectedScheme = schemes.find(scheme => scheme.name === "BuPu").colors;
        svg.selectAll('path')
            .data(data1.features)
            .enter().append('path')
            .attr('d', path) // Draw each feature using the path generator
            .attr('fill', d => {
                const minValue1 = d3.min(data1.features, d => parseFloat(d.properties[selectedYear]));
                const maxValue1 = d3.max(data1.features, d => parseFloat(d.properties[selectedYear]));
                const minValue2 = d3.min(data2.features, d => parseFloat(d.properties[selectedYear]));
                const maxValue2 = d3.max(data2.features, d => parseFloat(d.properties[selectedYear]));
                const value1 = d.properties[selectedYear] ? parseFloat(d.properties[selectedYear]) : 0;
                const matchingFeature = data2.features.find(f => f.properties.NOSAUKUMS === d.properties.NOSAUKUMS);
                const value2 = matchingFeature && matchingFeature.properties[selectedYear] ? parseFloat(matchingFeature.properties[selectedYear]) : 0;

                // Use a function to determine the fill color based on value1 and value2
                return getBivariateColor(value1, value2, minValue1, maxValue1, minValue2, maxValue2);
            })
            .attr('stroke', 'black') // Optional: adds a stroke around each polygon
            .attr('stroke-width', 1);
    })
   
    

    
}


function renderLegend() {
    const legendSvg = d3.select('#legend-container').html("").append('svg')
        .attr('width', 300)
        .attr('height', 300)
        .append('g')
        .attr('transform', 'translate(20,20)');
    
    const selectedScheme = schemes.find(scheme => scheme.name === "RdBu").colors;
    

    const squareSize = 30;
    selectedScheme.forEach((color, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
    
        legendSvg.append('rect')
        .attr('x', col * (squareSize + 5)) // 5 is the spacing between squares
        .attr('y', row * (squareSize + 5))
        .attr('width', squareSize)
        .attr('height', squareSize)
        .style('fill', color);
    });

    // Example labels for each axis - adjust according to your quantile categories
    const labelsX = ["Low Var1", "Medium Var1", "High Var1"];
    const labelsY = ["Low Var2", "Medium Var2", "High Var2"];

    // Adding labels for the X-axis
    labelsX.forEach((label, index) => {
    legendSvg.append('text')
        .attr('x', index * (squareSize + 5) + squareSize / 2) // Center the text under squares
        .attr('y', 3 * (squareSize + 5) + 20) // Position below the last row of squares
        .style('text-anchor', 'middle')
        .text(label);
    });

    // Adding labels for the Y-axis
    labelsY.forEach((label, index) => {
    legendSvg.append('text')
        .attr('transform', `translate(-30, ${index * (squareSize + 5) + squareSize / 2}) rotate(-90)`) // Rotate and position the text
        .style('text-anchor', 'middle')
        .text(label);
    });
}
function getBivariateColor(value1, value2, minValue1, maxValue1, minValue2, maxValue2) {
    // Determine the quantiles for both values
    const quantile1 = calculateQuantile(value1, minValue1, maxValue1);
    const quantile2 = calculateQuantile(value2, minValue2, maxValue2);

    // Assuming you have 3 categories (low, medium, high), reflected in a 3x3 color matrix
    const colorMatrixIndex = quantile1 * 3 + quantile2; // This will give you an index between 0 and 8
    const selectedScheme = schemes.find(scheme => scheme.name === "BuPu").colors; // Or any other scheme name you want to use

    return selectedScheme[colorMatrixIndex];
}

// Helper function to calculate quantile index
function calculateQuantile(value, minValue, maxValue) {
    const range = maxValue - minValue;
    const quantile = (value - minValue) / range;

    if (quantile < 1 / 3) return 0; // Low
    if (quantile < 2 / 3) return 1; // Medium
    return 2; // High
}


// Initially load map with default values
document.addEventListener('DOMContentLoaded', () => {
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; // Set default year in selector
    // Call this function when your page loads or when you receive the available years from the backend
    populateYearSelector(availableYears);
   
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
            

            
        });

    

});

function getColor(value, minValue, maxValue) {
    // Ensure the value is a number.
    const numValue = parseFloat(value);
    let scale;
    
    // Check if the value is negative, and if so, return a specific color.
    if (numValue < 0) {
        
        scale = chroma.scale(['#020F70','#fce3e3' ]).domain([minValue, 0]);
    }else{
       
        scale = chroma.scale(['#fce3e3', '#A40311']).domain([0, maxValue]);
    }
  
       
       
    

   
    // Use the scale to get the color for the current value.
    return scale(numValue).hex();
}
var selectedSheet;
function updateDataTable(props) {
    // Define the order of the text fields
    const textFieldsOrder = ['Reģions', 'Pašvaldība','Teritoriālais iedalījums'];

    // Determine headers based on predefined text fields and additional keys in props
    var headers = [...textFieldsOrder]; // Start with predefined text fields
    Object.keys(props).forEach(key => {
        if (!textFieldsOrder.includes(key)) {
            headers.push(key); // Add numeric and other fields
        }
    });

    // Check if 'L1_name' is in the sheet, if not, check for 'VEIDS'
    let endIndex;
    if (headers.includes('L1_name')) {
        endIndex = headers.indexOf('L1_code');
    } else if (headers.includes('VEIDS')) {
        endIndex = headers.indexOf('VEIDS');
    }

    // If an appropriate endIndex is found, slice the headers array to exclude the specified columns and beyond
    if (endIndex !== undefined) {
        headers = headers.slice(0, endIndex);
    }

    // Proceed with creating and appending the table rows and cells
    var container = document.getElementById('region-data'); // Ensure this exists in your HTML
    container.innerHTML = ''; // Clear previous contents
    var responsiveDiv = document.createElement('div');
    responsiveDiv.className = 'table-responsive';
    
    var dataTable = document.createElement('table');
    dataTable.className = 'table table-striped table-hover';

    var thead = document.createElement('thead');
    thead.className = 'thead-dark';
    var headerRow = document.createElement('tr');
    headers.forEach(header => {
        var th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    dataTable.appendChild(thead);

    var tbody = document.createElement('tbody');
    var tr = document.createElement('tr');
    headers.forEach(header => {
        var td = document.createElement('td');
        td.textContent = props[header] || ''; // Ensure props[header] is not undefined; if so, use ''
        tr.appendChild(td);
    });
    tbody.appendChild(tr);
    dataTable.appendChild(tbody);

    responsiveDiv.appendChild(dataTable);
    container.appendChild(responsiveDiv);
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
    
    //fetchAndCreateChoropleth(url, mapid);
    //updateD3Map(selectedSheet, selectedYear);



});
document.getElementById('sheet-select2').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[1];

    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    //fetchAndCreateChoropleth(url, mapid);



});
document.getElementById('sheet-select3').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[2];
    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    //fetchAndCreateChoropleth(url, mapid);



});
document.getElementById('sheet-select4').addEventListener('change', function () {
    var selectedSheet = this.value;
    var selectedYear = document.getElementById('year-select').value;
    const mapid = mymapArray[3];
    //fetchAndDisplayDataForHeatmap(selectedSheet,document.getElementById('year-select').value);
    var url = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;
    //fetchAndCreateChoropleth(url, mapid);



});
async function updateMaps(visualizationType) {
    const selectedYear = document.getElementById('year-select').value;
    let j=1;
    // Loop through each map in your array
    for (let i = 0; i < mymapArray.length-1; i++) {
        const map = mymapArray[i];
        
         // Assumes sheet-select IDs are sequentially named
        const selectedSheet = document.getElementById(`sheet-select${j.toString()}`).value;
        
        const geojsonUrl = `/sheet_data/${encodeURIComponent(selectedSheet)}?year=${encodeURIComponent(selectedYear)}`;

       

        // Fetch GeoJSON data once and use it for the selected visualization
        const geojsonData = await fetchGeoJSON(geojsonUrl);
        if (!geojsonData) {
            console.log("No data available for", selectedSheet, "in", selectedYear);
            continue; // Skip to the next map if no data
        }

        // Based on the visualizationType, create the corresponding layer on the map
        switch (visualizationType) {
            case 'choropleth':
                fetchAndCreateChoropleth(geojsonUrl,map);
                break;
            case 'heatmap':
                createHeatmapLayer(map, geojsonData);
                break;
            case 'dotmap':
                createDotMapLayer(map, geojsonData);
                break;
            case 'bivariate':
                updateBivariateChoroplethMap();
                break;
            default:
                console.error("Unsupported visualization type:", visualizationType);
        }
        j++;
    }
}

// Function to fetch GeoJSON data
async function fetchGeoJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch GeoJSON data:", error);
        return null;
    }
}
async function updateMapVisualization(map, geojsonUrl, visualizationType) {
    const geojsonData = await fetchGeoJSON(geojsonUrl);

    if (!geojsonData) {
        
        return;
    }

    switch (visualizationType) {
        case 'choropleth':
            createChoroplethLayer(map, geojsonData);
            break;
        case 'heatmap':
            
            createHeatmapLayer(map, geojsonData);
            break;
        case 'dotmap':
            createDotMapLayer(map, geojsonData);
            break;
        default:
            console.log("Unknown visualization type:", visualizationType);
    }
}
document.getElementById('visualizationType').addEventListener('change', function() {
    const selectedType = this.value;
   
    // Update the map based on the selected visualization type
    updateMaps(selectedType);
});

function createHeatmapLayer(map, geojsonData, selectedYear) {
    // Retrieve the selected year from the dropdown
    //const selectedYear = document.getElementById('year-select').value;
    
    // Initialize an empty array for heatmap points
    const heatmapPoints = [];

    // Process each feature in the GeoJSON data
    geojsonData.features.forEach(feature => {
        // Get the value for the selected year from the feature's properties
        const value = parseFloat(feature.properties[selectedYear]);
        let intensity = 1; // Default intensity
        if (!isNaN(value) && value > 0) {
            // Optionally, scale the intensity value here if needed
            intensity = Math.log(value); // Using a log scale as an example
        }

        // Calculate the centroid of the polygon
        let coords;
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const centroid = turf.centroid(feature).geometry.coordinates;
            coords = [centroid[1], centroid[0]]; // Reversed for Leaflet (lat, lng)
        } else {
            console.error('Feature is not a Polygon or MultiPolygon:', feature);
        }

        if (coords && coords.length === 2) {
            heatmapPoints.push([...coords, intensity]); // Append the coords and intensity to the points array
        }
    });

    // Add the heatmap layer to the map if there are points to display
    if (heatmapPoints.length) {
        const heatmapLayer = L.heatLayer(heatmapPoints, {
            radius: 25, // This can be adjusted or scaled based on zoom level
            blur: 15, // Adjust for smoother visual
            maxZoom: 17,
        }).addTo(map);
    } else {
        console.error("No points generated for the heatmap.");
    }
}


// Example normalization function, adjust as needed
function normalizeIntensity(value, min, max) {
    return (value - min) / (max - min);
}

// Example function to get the range of your data values
function getDataRange(geojsonData) {
    let min = Infinity, max = -Infinity;
    const selectedYear = document.getElementById('year-select').value;
    geojsonData.features.forEach(feature => {
        const value = parseFloat(feature.properties[selectedYear]);
        if (!isNaN(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    });
    return {min, max};
}

function createDotMapLayer(map, geojsonData) {
    geojsonData.features.forEach(feature => {
        let coords = feature.geometry.coordinates;

        switch (feature.geometry.type) {
            case 'Point':
                createMarker(map, coords);
                break;
            case 'MultiPoint':
                coords.forEach(coord => createMarker(map, coord));
                break;
            case 'Polygon':
                // For Polygons, placing a marker at the first point of the first LinearRing
                if (coords[0] && coords[0][0]) createMarker(map, coords[0][0]);
                break;
            case 'MultiPolygon':
                let centroid = turf.centroid(feature).geometry.coordinates;
                createMarker(map, centroid);
                break;
            default:
                console.error("Geometry type", feature.geometry.type, "not handled.");
        }
    });
}



function createMarker(map, coords) {
    if (Array.isArray(coords) && coords.length >= 2) {
        let lat = coords[1];
        let lng = coords[0];
        L.marker([lat, lng]).addTo(map);
    } else {
        console.error("Invalid coordinates for marker:", coords);
    }
}
function calculateRadius(value) {
   
    return Math.sqrt(value) * 2;
}
function clearAllMapLayers() {
    // Clear Leaflet maps
    mymapArray.forEach(map => {
        let tileLayer;
        map.eachLayer(layer => {
            if (!(layer instanceof L.TileLayer)) {
                map.removeLayer(layer);
            } else {
                tileLayer = layer;
            }
        });

        if (map.legend) {
            map.removeControl(map.legend);
            map.legend = null;
        }

        if (map.colorLabelGroup) {
            map.removeLayer(map.colorLabelGroup);
            map.colorLabelGroup = null;
        }

        // Additional clearing operations for Leaflet maps as necessary
    });

    // Clear D3 visualization
    d3.select('#d3-container').html(""); // This removes the SVG and all its children, effectively clearing the D3 map
}

var updateButton = document.getElementById('update-button');

if (updateButton) { 
    updateButton.addEventListener('click', function () {
        let visualizationType= document.getElementById('visualizationType').value;
        updateMaps(visualizationType);
        updateBivariateChoroplethMap();
        renderLegend();
        clearAllMapLayers(); 
        
    });
}
var clearLayersButton = document.getElementById('clear-layers-button');
if (clearLayersButton) {
    clearLayersButton.addEventListener('click', function () {
        clearAllMapLayers(); 
    });
}



document.getElementById('file-upload-form').addEventListener('submit', function(e) {
    e.preventDefault();  // Prevent the default form submission
    const formData = new FormData(this);

    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            // Refresh the page to update dropdowns and other components
            window.location.reload();
        } else {
            // Handle the case where the server did not return a success status
            console.error('File upload failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});


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

var colorScale = d3.scaleLinear().domain([minValue1, maxValue1, minValue2, maxValue2]).range(["#fee8c8", "#e34a33", "#fdbb84", "#b30000"]);

L.geoJson(geojsonData, {
    style: function (feature) {
        var value1 = feature.properties.variable1;
        var value2 = feature.properties.variable2;
        var color = colorScale(value1 + value2); // Simplified; you would need a more complex logic here
        return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }
}).addTo(mymap5);

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


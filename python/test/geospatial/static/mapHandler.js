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

var mymapArray = [];
mymapArray.push(mymap1);
mymapArray.push(mymap2);
mymapArray.push(mymap3);
mymapArray.push(mymap4);
var all_data = {};
const svg = d3.select('#d3-container'); 
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
const width = 1100, height = 700;


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

   
    if (map.legend) {
        map.removeControl(map.legend);
    }


    legend.addTo(map);
    map.legend = legend; 
}
function createBivariateLegend() {
    const selectedFile = document.getElementById('xlsx-file-select').value; 
    const sheetNameX = document.getElementById('sheet-select1').value; // Sheet for x-axis
    const sheetNameY = document.getElementById('sheet-select2').value; // Sheet for y-axis

    const svgWidth = 350; 
    const svgHeight = 150; 
    const cellSize = 30; // Size of each color cell
    const margin = { top: 20, right: 10, bottom: 60, left: 80 }; 

   
    const svg = d3.select('#legend-container').html("").append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('font', '10px sans-serif');

    
    const rdBuScheme = schemes.find(scheme => scheme.name === "RdBu") || schemes[0];
    const colors = rdBuScheme.colors;
    const colorMatrix = [
        colors.slice(6, 9),
        colors.slice(3, 6),
        colors.slice(0, 3)
    ];

    colorMatrix.forEach((rowColors, i) => {
        rowColors.forEach((color, j) => {
            svg.append('rect')
                .attr('x', margin.left + j * cellSize)
                .attr('y', margin.top + i * cellSize)
                .attr('width', cellSize)
                .attr('height', cellSize)
                .style('fill', color);
        });
    });

    

 
    svg.append('text')
        .attr('x', margin.left + cellSize * 1.5) 
        .attr('y', margin.top + (3 * cellSize) + 20) 
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(sheetNameX); 

   
    svg.append('text')
        .attr('transform', `translate(${margin.left / 3}, ${margin.top + cellSize * 1.5})rotate(-90)`)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(sheetNameY); 
   
    svg.append('line')
        .attr('x1', margin.left)
        .attr('y1', margin.top + cellSize * 3)
        .attr('x2', margin.left + cellSize * 3)
        .attr('y2', margin.top + cellSize * 3)
        .style('stroke', 'black')
        .style('stroke-width', 1);

    // Y-axis line
    svg.append('line')
        .attr('x1', margin.left)
        .attr('y1', margin.top)
        .attr('x2', margin.left)
        .attr('y2', margin.top + cellSize * 3)
        .style('stroke', 'black')
        .style('stroke-width', 1);
}

function generateLegendColors(minValue, maxValue) {
    const sampleValues = [];
    const negativeSteps = 4; 
    const positiveSteps = 4; 
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
.scale(7000) 
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

function fetchAndCreateChoropleth(filename, sheetName, mapid) {
    // Check if data exists for the given filename and sheetName
    if (!all_data[filename] || !all_data[filename][sheetName]) {
        console.error(`Data for sheet ${sheetName} in file ${filename} not found in all_data`);
        return;
    }
    const geojsonData = all_data[filename][sheetName];

    let minValue = Infinity;
    let maxValue = -Infinity;

    // Calculate min and max values for the color scale
    geojsonData.features.forEach(feature => {
        const value = parseFloat(feature.properties[document.getElementById('year-select').value]);
        if (!isNaN(value)) {
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
        }
    });

    // Create a choropleth layer
    mapid.choroplethLayer = L.geoJson(geojsonData, {
        style: feature => {
            return {
                fillColor: getColor(feature.properties[document.getElementById('year-select').value], minValue, maxValue),
                weight: 2,
                opacity: 0.2,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
              
              if (lastClickedLayer && lastClickedLayer !== layer) {
                lastClickedLayer.setStyle({
                  fillColor: getColor(feature.properties[document.getElementById('year-select').value], minValue, maxValue),
                 
                });
              }
          
             
              e.target.setStyle(highlightStyle);
          
            
              lastClickedLayer = e.target;
          
            
              updateDataTable(feature.properties);
            });
          
            
            layer.bindTooltip(feature.properties['Pašvaldība'] || 'No name', { permanent: false, direction: 'auto' });
          }
    }).addTo(mapid);

    const { sampleValues, sampleColors } = generateLegendColors(minValue, maxValue);
    addLegend(mapid, sampleColors, sampleValues);
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

function fetchSheetsForFile(filename) {
    if (!all_data[filename]) {
        console.error(`Data for file ${filename} not found in all_data`);
        return;
    }

    const fileData = all_data[filename];
    const sheets = Object.keys(fileData);

  
    Promise.all(sheets.map(sheet => fileData[sheet]));

   
    const selects = ['sheet-select1', 'sheet-select2', 'sheet-select3', 'sheet-select4'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = ''; 

        sheets.forEach(sheet => {
            const option = new Option(sheet, sheet);
            select.add(option);
        });
    });
}

document.getElementById('xlsx-file-select').addEventListener('change', async function() {
    const selectedFile = this.value;
    if (selectedFile) {
        fetchSheetsForFile(selectedFile);
    }
});

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex'; 
}


function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}


function updateBivariateChoroplethMap() {
    const selectedFile = document.getElementById('xlsx-file-select').value;
    const sheetName1 = document.getElementById('sheet-select1').value;
    const sheetName2 = document.getElementById('sheet-select2').value;
    const selectedYear = document.getElementById('year-select').value;

 
    if (!all_data[selectedFile]) {
        console.error(`Data for file ${selectedFile} not found in all_data`);
        return;
    }

  
    const fileData = all_data[selectedFile];
    if (!fileData[sheetName1] || !fileData[sheetName2]) {
        console.error(`Data for one or both sheets (${sheetName1}, ${sheetName2}) not found in file ${selectedFile} within all_data`);
        return;
    }

    const data1 = fileData[sheetName1];
    const data2 = fileData[sheetName2];

    
    const quantiles1 = calculateQuantiles(data1.features, selectedYear);
    const quantiles2 = calculateQuantiles(data2.features, selectedYear);

    const svg = d3.select('#d3-container').html("").append('svg')
        .attr('width', width)
        .attr('height', height);

    const path = d3.geoPath().projection(projection);
    svg.selectAll('path')
        .data(data1.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', d => {
            const value1 = parseFloat(d.properties[selectedYear]) || 0;
            const matchingFeature = data2.features.find(f => f.properties.Pašvaldība === d.properties.Pašvaldība);
            const value2 = matchingFeature ? parseFloat(matchingFeature.properties[selectedYear]) || 0 : 0;
            const colorIndex1 = determineColorIndex(value1, quantiles1);
            const colorIndex2 = determineColorIndex(value2, quantiles2);
            
            return schemes[0].colors[colorIndex1 * 3 + colorIndex2];
        })
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .on('click', d => {
           
            const matchingFeature = data2.features.find(f => f.properties.Pašvaldība === d.properties.Pašvaldība);
        
         
            if (matchingFeature && d.properties) {
    
                const value1 = parseFloat(d.properties[selectedYear]) || 0;
                const value2 = parseFloat(matchingFeature.properties[selectedYear]) || 0;

                const infoDiv = document.getElementById('info');
                infoDiv.innerHTML = `
                    <strong>${d.properties.Pašvaldība}</strong><br>
                    Value 1: ${value1.toFixed(2)}<br>
                    Value 2: ${value2.toFixed(2)}
                `;
            } else {
                
                console.error('Matching feature or properties are undefined.');
            }
        });

    createBivariateLegend();
}

function getBivariateColor(value1, value2, minValue1, maxValue1, minValue2, maxValue2) {
    // Determine the quantiles for both values
    const quantile1 = calculateQuantile(value1, minValue1, maxValue1);
    const quantile2 = calculateQuantile(value2, minValue2, maxValue2);


    const colorMatrixIndex = quantile1 * 3 + quantile2; 
    const selectedScheme = schemes.find(scheme => scheme.name === "BuPu").colors; 

    return selectedScheme[colorMatrixIndex];
}

function calculateQuantiles(features, year) {
    const values = features.map(d => parseFloat(d.properties[year])).filter(v => !isNaN(v)).sort(d3.ascending);
    return [
      d3.quantile(values, 0.33),
      d3.quantile(values, 0.66),
      d3.quantile(values, 1.00)
    ];
}
  
function determineColorIndex(value, quantiles) {
    if (value <= quantiles[0]) return 0;
    if (value <= quantiles[1]) return 1;
    return 2;
}

// Initially load map with default values
document.addEventListener('DOMContentLoaded', () => {
    
    fetchAllSheetsData();
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; 
    const infoPanel = document.getElementById('info-panel');
    
    
    populateYearSelector(availableYears);
   

    populateXlsxFileSelect();
  

    

});
var excelDataStore = {}; 
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex'; 
}


function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

async function fetchAllSheetsData() {
    showLoadingOverlay(); 
    try {
        const fileListResponse = await fetch('/list-xlsx-files');
        const fileList = await fileListResponse.json();
        
        await Promise.all(fileList.map(async (filename) => {
            const sheetsResponse = await fetch(`/sheets/${encodeURIComponent(filename)}`);
            const sheetsData = await sheetsResponse.json();
            
            if (!sheetsData.sheets) return; // Skip if no sheets data
            
            await Promise.all(sheetsData.sheets.map(async (sheetName) => {
                const sheetDataResponse = await fetch(`/sheet_data/${encodeURIComponent(sheetName)}`);
                if (!sheetDataResponse.ok) return; // Skip on error
                
                const sheetData = await sheetDataResponse.json();
                if (!all_data[filename]) all_data[filename] = {};
                all_data[filename][sheetName] = sheetData;
            }));
        }));
    } catch (error) {
        console.error('Error fetching or processing sheet data:', error);
    } finally {
        hideLoadingOverlay(); // Hide loading overlay after all data has been fetched
    }
}

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
   
    const textFieldsOrder = ['Reģions', 'Pašvaldība','Teritoriālais iedalījums'];

  
    var headers = [...textFieldsOrder]; 
    Object.keys(props).forEach(key => {
        if (!textFieldsOrder.includes(key)) {
            headers.push(key);
        }
    });

   
    let endIndex;
    if (headers.includes('L1_name')) {
        endIndex = headers.indexOf('L1_code');
    } else if (headers.includes('VEIDS')) {
        endIndex = headers.indexOf('VEIDS');
    }

    
    if (endIndex !== undefined) {
        headers = headers.slice(0, endIndex);
    }

   
    var container = document.getElementById('region-data'); 
    container.innerHTML = '';
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
        td.textContent = props[header] || ''; 
        tr.appendChild(td);
    });
    tbody.appendChild(tr);
    dataTable.appendChild(tbody);

    responsiveDiv.appendChild(dataTable);
    container.appendChild(responsiveDiv);
}

function displayData(data) {
    if (!data || data.length === 0) return; 


    var dataTable = document.getElementById('region-data');

    const headers = data.reduce((acc, curr) => {
        Object.keys(curr).forEach(key => {
            if (!acc.includes(key)) acc.push(key);
        });
        return acc;
    }, []);

   
    var headerRow = document.createElement('tr');
    headers.forEach(header => {
        var th = document.createElement('th');
        th.textContent = header; 
        headerRow.appendChild(th); 
    });
    dataTable.appendChild(headerRow);


    data.forEach(row => {
        var tr = document.createElement('tr');
        headers.forEach(header => {
            var td = document.createElement('td');
            td.textContent = row[header] || ''; 
            tr.appendChild(td);
        });
        dataTable.appendChild(tr); 
    });
}


var choroplethLayers = {
   
};





var defaultHighlightstyle = {
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
};




function updateMaps(visualizationType) {
    const selectedYear = document.getElementById('year-select').value;

    const selectedFile = document.getElementById('xlsx-file-select').value;


    for (let i = 0; i < mymapArray.length; i++) {
        const map = mymapArray[i];


        const selectedSheet = document.getElementById(`sheet-select${(i + 1).toString()}`).value;


        const fileData = all_data[selectedFile]; 
        if (!fileData) {
            console.error(`Data for file ${selectedFile} not found in all_data`);
            continue;
        }

        const geojsonData = fileData[selectedSheet]; 
        if (!geojsonData) {
            console.error(`Data for sheet ${selectedSheet} not found in ${selectedFile} within all_data`);
            continue; 
        }

        
        switch (visualizationType) {
            case 'choropleth':
            
                fetchAndCreateChoropleth(selectedFile,selectedSheet, map);
                break;
            case 'heatmap':
              
                createHeatmapLayer(map, selectedFile ,selectedSheet, selectedYear);
                break;
            case 'dotmap':
                
                createDotMapLayer(selectedFile, selectedSheet, map);
                break;
            case 'bivariate':
                
                updateBivariateChoroplethMap();
               

                break;
            default:
                console.error("Unsupported visualization type:", visualizationType);
        }
    }
}



function createLegend(quantiles1, quantiles2, colorScheme) {
    
    const svgWidth = 200;
    const svgHeight = 200;


    const svg = d3.select('#legend-container').html("").append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('font', '10px sans-serif');

    const cellSize = 20;
    const margin = {
      top: 10,
      right: 10,
      bottom: 30, 
      left: 80  
    };
  
   
    colorScheme.forEach((rowColors, i) => {
      rowColors.forEach((color, j) => {
        svg.append('rect')
            .attr('x', margin.left + j * cellSize)
            .attr('y', margin.top + i * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .style('fill', color);
      });
    });
  
    
    svg.selectAll('.quantile-labels-h')
        .data(quantiles1)
        .enter().append('text')
        .attr('class', 'quantile-labels-h')
        .attr('x', d => margin.left + (quantiles1.indexOf(d) + 0.5) * cellSize)
        .attr('y', margin.top + 3 * cellSize + 20) 
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-family', 'Arial, sans-serif') 
        .style('font-weight', 'normal')
        .text(d => d.toFixed(2));
  
   
    svg.selectAll('.quantile-labels-v')
        .data(quantiles2)
        .enter().append('text')
        .attr('class', 'quantile-labels-v')
        .attr('transform', (d, i) => `translate(${margin.left - 20}, ${margin.top + (i + 0.5) * cellSize})rotate(-90)`)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-family', 'Arial, sans-serif')
        .style('font-weight', 'normal')
        .text(d => d.toFixed(2));
    
    svg.append('text')
        .attr('x', margin.left + (3 * cellSize) / 2)
        .attr('y', margin.top / 2)
        .style('font-weight', 'bold')
        .text('Bivariate Color Legend');
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



function createHeatmapLayer(map, filename, sheetName, selectedYear) {
   
    if (!all_data[filename] || !all_data[filename][sheetName]) {
        console.error(`Data for sheet ${sheetName} in file ${filename} not found in all_data`);
        return;
    }

   
    const geojsonData = all_data[filename][sheetName];

    const heatmapPoints = [];
    // Process each feature in the GeoJSON data
    geojsonData.features.forEach(feature => {
        const value = parseFloat(feature.properties[selectedYear]);
        let intensity = 1; // Default intensity
        if (!isNaN(value) && value > 0) {
            intensity = Math.log(value); 
        }

   
        let coords;
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const centroid = turf.centroid(feature).geometry.coordinates;
            coords = [centroid[1], centroid[0]]; 
        } else {
            console.error('Feature is not a Polygon or MultiPolygon:', feature);
            return;
        }

        if (coords) {
            heatmapPoints.push([...coords, intensity]);
        }
    });


    if (heatmapPoints.length) {
        const heatmapLayer = L.heatLayer(heatmapPoints, {
            radius: 25, 
            blur: 15,
            maxZoom: 17,
        }).addTo(map);
    } else {
        console.error("No points generated for the heatmap.");
    }
}


function normalizeIntensity(value, min, max) {
    return (value - min) / (max - min);
}

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

function createDotMapLayer(filename, sheetName, map) {

    if (!all_data[filename] || !all_data[filename][sheetName]) {
        console.error(`Data for sheet ${sheetName} in file ${filename} not found in all_data`);
        return;
    }

    const geojsonData = all_data[filename][sheetName];


    geojsonData.features.forEach(feature => {
        let coords;

  
        switch (feature.geometry.type) {
            case 'Point':
                coords = feature.geometry.coordinates;
                createMarker(map, [coords[1], coords[0]]); 
                break;
            case 'MultiPoint':
                coords.forEach(coord => createMarker(map, [coord[1], coord[0]]));
                break;
            case 'Polygon':
            case 'MultiPolygon':
               
                coords = turf.centroid(feature).geometry.coordinates;
                createMarker(map, [coords[1], coords[0]]);
                break;
            default:
                console.error(`Geometry type '${feature.geometry.type}' not handled.`);
        }
    });
}


function createMarker(map, coords) {
    L.marker(coords).addTo(map);
}

function calculateRadius(value) {
   
    return Math.sqrt(value) * 2;
}
function clearAllMapLayers() {
  
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

    
    });

    
    d3.select('#d3-container').html(""); 
}

var updateButton = document.getElementById('update-button');

if (updateButton) { 
    updateButton.addEventListener('click', function () {
        let visualizationType= document.getElementById('visualizationType').value;
        clearAllMapLayers(); 
        updateMaps(visualizationType);
        updateBivariateChoroplethMap(); 
        console.log(all_data)
        
        
    });
}
var clearLayersButton = document.getElementById('clear-layers-button');
if (clearLayersButton) {
    clearLayersButton.addEventListener('click', function () {
        clearAllMapLayers(); 
    });
}



document.getElementById('file-upload-form').addEventListener('submit', function(e) {
    e.preventDefault(); 
    const formData = new FormData(this);

    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        window.location.reload();
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
          
            select.innerHTML = '<option>Select a file</option>';
            
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





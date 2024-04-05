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
const svg = d3.select('#d3-container'); // Select your SVG container
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
    const legendSvg = d3.select('#legend-container').html("").append('svg')
               .attr('width', 300)
               .attr('height', 300);
    Promise.all([
        fetch(`/sheet_data/${encodeURIComponent(sheetName1)}?year=${encodeURIComponent(selectedYear)}`).then(res => res.json()),
        fetch(`/sheet_data/${encodeURIComponent(sheetName2)}?year=${encodeURIComponent(selectedYear)}`).then(res => res.json())
    ])
   .then(([data1, data2]) => {
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
                const value2 = matchingFeature? parseFloat(matchingFeature.properties[selectedYear]) || 0 : 0;
                const colorIndex1 = determineColorIndex(value1, quantiles1);
                const colorIndex2 = determineColorIndex(value2, quantiles2);
                return schemes[0].colors[colorIndex1 * 3 + colorIndex2];
            })
           .attr('stroke', 'black')
           .attr('stroke-width', 1)
           .on('click', d => {
                const infoPanel = document.getElementById('info-panel');
                const currentPasvaldiba = d.properties? d.properties['Pašvaldība'] : undefined;
                if (!currentPasvaldiba) {
                    console.error('Current feature does not have a "Pašvaldība" property.');
                    infoPanel.innerHTML = `No data available for the selected feature.`;
                    return;
                }
                const matchingFeature = data2.features.find(feature => feature.properties && feature.properties['Pašvaldība'] === currentPasvaldiba);
                const value1 = d.properties && d.properties[selectedYear]? d.properties[selectedYear] : 'Data Not Available';
                const value2 = matchingFeature && matchingFeature.properties && matchingFeature.properties[selectedYear]? matchingFeature.properties[selectedYear] : 'Data Not Available';
                infoPanel.innerHTML = `Value 1: ${value1}<br>Value 2: ${value2}`;
            });
  
        // Assuming the legend is only needed once, or checking if it needs to be updated
        if(d3.select('#legend-container svg').empty()) {
            createBivariateLegend(legendSvg, schemes[0].colors);
        }
    });
  }


  function createBivariateLegend(svg, colorSchemeX, colorSchemeY) {
    const nX = colorSchemeX.length;
    const nY = colorSchemeY.length;
    const k = 24; // Size of each square in the legend
  
    // Define arrow marker for the axes
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 6)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0L9,3L0,6Z');
  
    // Group for the legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('transform', `translate(50, 50)`); // Adjust as needed
  
    // Add the squares for X variable
    for (let i = 0; i < nX; i++) {
      legend.append('rect')
        .attr('width', k)
        .attr('height', nY * k)
        .attr('x', i * k)
        .attr('y', 0)
        .attr('fill', colorSchemeX[i])
        .append('title').text(`X: ${i}`);
    }
  
    // Add the squares for Y variable
    for (let j = 0; j < nY; j++) {
      legend.append('rect')
        .attr('width', nX * k)
        .attr('height', k)
        .attr('x', 0)
        .attr('y', j * k)
        .attr('fill', colorSchemeY[j])
        .append('title').text(`Y: ${j}`);
    }
  
    // Add axes
    legend.append('line')
      .attr('x2', nX * k)
      .attr('y2', nY * k)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5);
  
    legend.append('line')
      .attr('x2', 0)
      .attr('y2', nY * k)
      .attr('y1', 0)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5);
  
    // Add axis labels
    legend.append('text')
      .attr('font-weight', 'bold')
      .attr('dy', '0.71em')
      .attr('transform', `rotate(-90) translate(${-nX * k / 2},-10)`)
      .attr('text-anchor', 'middle')
      .text('Y Variable');
  
    legend.append('text')
      .attr('font-weight', 'bold')
      .attr('dy', '0.71em')
      .attr('transform', `translate(${(nX + 1) * k / 2},${(nY + 1) * k + 20})`)
      .attr('text-anchor', 'middle')
      .text('X Variable');
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
    const initialYear = availableYears[0]; // Default to first available year
    const initialSheet = sheetSelect.value; // Default to first sheet if you have a default selection
    yearSelect.value = initialYear; // Set default year in selector
    const infoPanel = document.getElementById('info-panel');
    // Call this function when your page loads or when you receive the available years from the backend
    populateYearSelector(availableYears);
   
    // Define the size of the map
    
    populateXlsxFileSelect();
    updateD3Map(initialSheet, initialYear);   

    

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

async function updateMaps(visualizationType) {
    const selectedYear = document.getElementById('year-select').value;
    let j=1;
    // Loop through each map in your array
    for (let i = 0; i < mymapArray.length; i++) {
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

function createLegend(quantiles1, quantiles2, colorScheme) {
    const svg = d3.select('#legend-container').html("").append('svg')
        .attr('width', 400)
        .attr('height', 200)
        .style('font', '10px sans-serif');
  
    // Assuming colorScheme is a 3x3 matrix for the bivariate color scale
    const cellSize = 20; // Size of each cell in the legend
    colorScheme.forEach((rowColors, i) => {
      rowColors.forEach((color, j) => {
        svg.append('rect')
            .attr('x', j * cellSize)
            .attr('y', i * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .style('fill', color);
      });
    });
  
    // Add labels for quantiles
    // Horizontal labels
    svg.selectAll('.quantile-labels-h')
        .data(quantiles1)
        .enter().append('text')
        .attr('class', 'quantile-labels-h')
        .attr('x', (d, i) => (i + 1) * cellSize - (cellSize / 2))
        .attr('y', cellSize * 3 + 20)
        .style('text-anchor', 'middle')
        .text(d => d.toFixed(2));
  
    // Vertical labels
    svg.selectAll('.quantile-labels-v')
        .data(quantiles2)
        .enter().append('text')
        .attr('class', 'quantile-labels-v')
        .attr('transform', (d, i) => `translate(${cellSize * 3 + 10}, ${(i + 1) * cellSize - (cellSize / 2)})rotate(90)`)
        .style('text-anchor', 'middle')
        .text(d => d.toFixed(2));
  
    // Add legend title or explanation as needed
    svg.append('text')
        .attr('x', 0)
        .attr('y', -10)
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
        window.location.reload(); // Reload the page
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




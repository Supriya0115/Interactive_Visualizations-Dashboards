// Use route "/names" to populate the Sample IDs 
function init() {

    // Grab a reference to the dropdown select element
    var selector = d3.select("#selDataset");
  
    // Use the list of sample names to populate the select options
    d3.json("/names").then((sampleNames) => {
      sampleNames.forEach((sample) => {
        selector
          .append("option")
          .text(sample)
          .property("value", sample);
      });
  
    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];

    buildCharts(firstSample);
    buildMetadata(firstSample);
    buildGauge(firstSample)
    });
  }

  //Build the metadata panel
  function buildMetadata(sample) {

      // Split the alpha numeric sample id to pass only the numeric part to the route
      sample_split = sample.split("_")[1]

      // Use `d3.json` to fetch the metadata for a sample
      d3.json(`/metadata/${sample_split}`).then(function(data) {
            
      // Use d3 to select the panel with id of `#sample-metadata`
      var metadata = d3.select("#sample-metadata")
      var table = Plotly.d3.select("#sample-metadata");
      var tbody = table.select("tbody");


      // Use `.html("") to clear any existing metadata
      document.querySelector("#sample-metadata").innerHTML = "";

          // Use `Object.entries` to add each key and value pair to the panel
          Object.entries(data).forEach(
              ([key, value]) => metadata.append("div").text(`${key}: ${value}`)
          );

    });
  }

  function buildCharts(sample) {

      // Use `d3.json` to fetch the sample data for the plots
      d3.json( `/samples/${sample}`).then(function(data) { 
        // console.log(data);

        // Values and IDs on pie chart
        var sample_val = data.sample_values;
        var sample_id = data.otu_ids;
    
        // Select top 10 samples
        var display_val = sample_val.slice(0, 10);
        var display_id = sample_id.slice(0, 10);

        // Empty array to OTU descriptions for hover text
        var otu_desc = []

        d3.json(`/otu`).then(function(data1) {
            // Variable to display otu description 
            display_id.forEach(function(data_desc) {
              // console.log(data_desc)
              otu_desc.push(data1[data_desc]);
            })


          // Build a Pie chart
          var pie_data= [{
            values: display_val,
            labels: display_id,
            type: 'pie',
            hovertext:otu_desc
          }];
          
          var pie_layout = {
            title: "<b>Top 10 Samples: " + sample + "</b>",
            height: 400,
            width: 500,
            margin: {
              l: 50,
              r: 0,
              b: 50,
              t: 50
            },
          };
          
          Plotly.newPlot('pie', pie_data, pie_layout);


          //Build a Bubble Chart using the sample data
          var bubble_data = [{
            x: sample_id,
            y: sample_val,
            mode: 'markers',
            marker: {
              size: sample_val,
              color: sample_id,
              colorscale:"Jet",
                    },
            text: otu_desc,
            type: "scatter"
            }];

          var bubble_layout = {
              title: "<b>Sample Values & OTU ID: " + sample + "</b>",
              hovermode: "closest",
              showlegend: false,
              height: 600,
              width: 1200,
              xaxis:{showline :false,title:"OTU ID"},
              yaxis:{showline :false,title:"Sample Value"}
            };
          Plotly.newPlot("bubble",bubble_data,bubble_layout);
        })

      })

    }

    function buildGauge(sample) {

        d3.json(`/wfreq/${sample}`).then(function(data) {

        // console.log(data)

        // Enter the washing frequency between 0 and 180
        var level = parseFloat(data['wfreq']) * 20;
    
        // Trig to calc meter point
        var degrees = 180 - level;
        var radius = 0.5;
        var radians = (degrees * Math.PI) / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);

        // Path: may have to change to create a better triangle
        var mainPath = "M -.0 -0.05 L .0 0.05 L ";
        var pathX = String(x);
        var space = " ";
        var pathY = String(y);
        var pathEnd = " Z";
        var path = mainPath.concat(pathX, space, pathY, pathEnd);
    
        var data = [
          {
            type: "scatter",
            x: [0],
            y: [0],
            marker: { size: 12, color: "850000" },
            showlegend: false,
            name: "Freq",
            text: level,
            hoverinfo: "text+name"
          },
          {
            values: [50 / 9, 50 / 9, 50 / 9, 50 / 9, 50 / 9, 50 / 9, 50 / 9, 50 / 9, 50 / 9, 50],
            rotation: 90,
            text: ["8-9", "7-8", "6-7", "5-6", "4-5", "3-4", "2-3", "1-2", "0-1", ""],
            textinfo: "text",
            textposition: "inside",
            marker: {
              colors: [
                "rgba(0, 105, 11, .5)",
                "rgba(10, 120, 22, .5)",
                "rgba(14, 127, 0, .5)",
                "rgba(110, 154, 22, .5)",
                "rgba(170, 202, 42, .5)",
                "rgba(202, 209, 95, .5)",
                "rgba(210, 206, 145, .5)",
                "rgba(232, 226, 202, .5)",
                "rgba(240, 230, 215, .5)",
                "rgba(255, 255, 255, 0)"
              ]
            },
            labels: ["8-9", "7-8", "6-7", "5-6", "4-5", "3-4", "2-3", "1-2", "0-1", ""],
            hoverinfo: "label",
            hole: 0.5,
            type: "pie",
            showlegend: false
          }
          ];
          var layout = {
            shapes: [
              {
                type: "path",
                path: path,
                fillcolor: "850000",
                line: {
                  color: "850000"
                }
              }
            ],
            title: "<b>Belly Button Washing Frequency</b> <br> Scrubs per Week",
            height: 500,
            width: 500,
            xaxis: {
              zeroline: false,
              showticklabels: false,
              showgrid: false,
              range: [-1, 1]
            },
            yaxis: {
              zeroline: false,
              showticklabels: false,
              showgrid: false,
              range: [-1, 1]
            }
          };
        
          Plotly.newPlot(gauge, data, layout);

      })
      
    }

  //Build the metadata panel and update the plots and panel for option change
  function optionChanged(newSample) {
      
    // Fetch new data each time a new sample is selected
    buildCharts(newSample);
    buildMetadata(newSample);
    buildGauge(newSample)

  }

// Initialize the dashboard
init();
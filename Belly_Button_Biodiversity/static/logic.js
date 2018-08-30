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
  
    //Build a Bubble Chart using the sample data
  
    // Build a Pie Chart
    

  }


  //Build the metadata panel and update the plots and panel for option change
  function optionChanged(newSample) {
      
    // Fetch new data each time a new sample is selected
    buildCharts(newSample);
    buildMetadata(newSample);

  }

// Initialize the dashboard
init();
let clusters = {
    "cluster1" : "",
    "cluster2" : "",
    "cluster3" : "",
    "cluster4" : "",
    "cluster5" : "",
    "cluster6" : "",
    "cluster7" : "",
    "cluster8" : "",
    "cluster9" : "",
    "cluster10" : ""
};

let clusterSelected = "Cluster 1";

async function loadData() {
    selectedButton(clusterSelected);
}

//Get the selected button value
//Change that to blue and bold to indicate selected
function selectedButton(selected) {
    clusterSelected = selected;
    console.log("Currently Selected" )
    d3.selectAll("#cluster").classed("current", false);
    d3.select(`[data-value='${clusterSelected}']`).classed("current", true);
}

//Check when submit button is clicked
//Get values from selected button and input area

function generateLyrics() {

}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

let clusterCheck = document.getElementById('.cluster');
let generateCheck = document.getElementById('.generate');

d3.selectAll("#cluster").on("click", function() {
    const selectedCluster = d3.select(this).attr("data-value");
    console.log("Selected Cluster");
    console.log(selectedCluster);
    selectedButton(selectedCluster);
});

d3.selectAll("#generate").on("click", function() {
    topicValue = document.getElementById('topic').value;
    artistValue = document.getElementById('artist').value;
    moodValue = document.getElementById('mood').value;

    generateLyrics(topicValue, artistValue, moodValue);
});
  
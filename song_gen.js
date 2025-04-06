let clusterSelected = "Electronic";

async function loadData() {
    selectedButton(clusterSelected);
}

//Get the selected button value
//Change that to blue and bold to indicate selected
function selectedButton(selected) {
    clusterSelected = selected;
    console.log("Currently Selected" )
    d3.selectAll("#cluster-button").classed("current", false);
    d3.select(`[data-value='${clusterSelected}']`).classed("current", true);
}

//Check when submit button is clicked
//Get values from selected button and input area

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

let clusterCheck = document.getElementById('#cluster-button');
let generateCheck = document.getElementById('.generate');

d3.selectAll("#cluster-button").on("click", function() {
    const selectedCluster = d3.select(this).attr("data-value");
    console.log("Selected Cluster");
    console.log(selectedCluster);
    selectedButton(selectedCluster);
});

d3.selectAll("#generate").on("click", async () => {
    const topicValue = document.getElementById('topic');
    const moodValue = document.getElementById('mood').value;

    const formData = new FormData();
    formData.append("topic", topicValue);
    formData.append("clusterSelected", clusterSelected);
    formData.append("mood", moodValue);

    const response = await fetch("http://127.0.0.1:8000/submit", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    console.log(result);  // Or display on the page
    alert("Doubled topic: ${result.doubled_topic}");
});
  
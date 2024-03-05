// This section detects user submissions, fetching user-entered data. 
document.addEventListener("DOMContentLoaded", function() {
    // Update variable names and element IDs to match the standardized 'user_id'
    const submitPlaceSection = document.getElementById('submitPlaceSection');
    const votingUserIdInput = document.getElementById('votingUserId'); // Update the ID to match HTML
    const placesList = document.getElementById('placesList');
    const userPicksList = document.getElementById('userPicksList');
    const otherPicksList = document.getElementById('otherPicksList');
    fetchUniquePlacesAndCountries();



    submitPlaceSection.addEventListener('submit', function(event) {
        event.preventDefault();
        submitPlace();
    });

    votingUserIdInput.addEventListener('input', function() {
//        const user_id = votingUserIdInput.value;
//        fetchPlacesForVoting(user_id);
//        fetchUserPicks(user_id);
//        fetchOtherPicks(user_id);
    });
});



// This function is called whenever we press the submit button 
function submitPlace() {
    const user_id = document.getElementById('submitUserId').value; // Corrected ID
    const place = document.getElementById('submitPlace').value;
    const country = document.getElementById('submitCountry').value;
    const reason = document.getElementById('submitReason').value;

    // Check if any of the fields are empty
    // It wont allow to move forward unless all fields are filled
    if (!user_id || !place || !country || !reason) {
        alert('All fields are required.');
        return; // Prevent the submission
    }

    const data = { user_id, place, country, reason };

    fetch('/api/submit-first', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Place submitted successfully!');
//        fetchPlacesForVoting(user_id); // Refresh the list after submitting
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while submitting the place.');
    });
}
// This function takes the values submitted by the user
// It calls the fetchPlacesForVoting function, which in turn calls the API '/api/second-page-data'
// which gets the data for places, country for voting
function fetchVotingOptions() {
    const user_id = document.getElementById('votingUserId').value;
    const filter_place = document.getElementById('filterPlaceInput').value;
    const filter_country = document.getElementById('filterCountryInput').value;
    const sort_order = document.getElementById('sortOrderDropdown').value;

    if (!user_id) {
        alert('Please enter a User ID.');
        return;
    }
    // Assuming fetchPlacesForVoting makes an API call and renders results
    fetchPlacesForVoting(user_id, filter_place, filter_country, sort_order ); // Update this function to render table
}


// Updated function to include filtering and sorting parameters
function fetchPlacesForVoting(user_id, filter_place, filter_country, sort_order) {
    if (!user_id) {
        console.error("user_id is undefined or empty");
        return; // Prevent further execution if user_id is not defined
    }

    // Include timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const placesList = document.getElementById('placesList');

    // Encode parameters to ensure they are correctly interpreted by the URL
    filter_place = encodeURIComponent(filter_place);
    filter_country = encodeURIComponent(filter_country);
    sort_order = encodeURIComponent(sort_order);

    fetch(`/api/second-page-data?user_id=${user_id}&filter_place=${filter_place}&filter_country=${filter_country}&sort_order=${sort_order}&_=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        // Assuming 'placesList' is already defined or accessible in this scope
        placesList.innerHTML = `
            <table>
                <tr>
                    <th>Place</th>
                    <th>Country</th>
                    <th>Votes</th>
                    <th>Action</th>
                </tr>
                ${data.map(item => `
                    <tr>
                        <td>${item.place}</td>
                        <td>${item.country}</td>
                        <td>${item.votes}</td>
                        <td><button onclick="upvote('${item.place}', '${item.country}', '${user_id}', '${filter_place}', '${filter_country}', '${sort_order}')">Upvote</button></td>
                    </tr>
                `).join('')}
            </table>
        `;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function used for populating the Country, Places dropdown
function populateDropdown(dropdownId, optionsArray) {
    const dropdown = document.getElementById(dropdownId);
    // Clear existing options first
    dropdown.innerHTML = '';
    // Add a default option or placeholder if necessary
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an option';
    dropdown.appendChild(defaultOption);

    // Populate dropdown with options from the array
    optionsArray.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        dropdown.appendChild(option);
    });
}

// Function for the upvote functionality
// It posts the data with the help of the API call '/api/upvote'
function upvote(place, country, user_id, filter_place, filter_country, sort_order) {
    const reason = `This place was upvoted by user ${user_id}.`;
    const data = { user_id, place, country, reason };

    fetch('/api/upvote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Upvote successful!');
            // Refresh the table after an upvote with the specified parameters
            fetchPlacesForVoting(user_id, filter_place, filter_country, sort_order);
        } else if (data.status === 'already_voted') {
            alert('You have already upvoted this place.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during the upvote.');
    });
}

// Function used for User Picks and Other Picks section
// gets the user data with the '/api/third-page-data' API call
// which in turn calls the prepare_third_page_data function from utility.py
function fetchPicks() {
    const user_id = document.getElementById('picksUserId').value;
    const filter_place = document.getElementById('picksFilterPlaceInput').value; // Corrected to input ID
    const filter_country = document.getElementById('picksFilterCountryInput').value; // Corrected to input ID
    const sort_order = document.getElementById('picksSortOrderDropdown').value;

    if (!user_id) {
        alert('Please enter a User ID.');
        return;
    }

    // Update the API call to include filtering and sorting
    fetch(`/api/third-page-data?user_id=${encodeURIComponent(user_id)}&filter_place=${encodeURIComponent(filter_place)}&filter_country=${encodeURIComponent(filter_country)}&sort_order=${encodeURIComponent(sort_order)}`)
    .then(response => response.json())
    .then(data => {
        // Assuming you have functions to render user and other picks
        renderUserPicks(data.user_picks);
        renderOtherPicks(data.other_picks);

        // Optionally, if you have a function to render a chart for other picks
        if (data.other_picks.length) {
            renderOtherPicksChart(data.other_picks.slice(0, 10)); // Top 10 picks for the chart
        }
    })
    .catch(error => {
        console.error('Error fetching picks:', error);
        alert('An error occurred while fetching picks.');
    });
}

// This function helps in dynamically creating a table based on the number of Picks the user has
function renderUserPicks(userPicks) {
    const userPicksList = document.getElementById('userPicksList');
    if (userPicks && userPicks.length > 0) {
        let htmlContent = `<table>
                                <tr>
                                    <th>Place</th>
                                    <th>Country</th>
                                    <th>Reason</th>
                                    <th>Votes</th>
                                </tr>`;
        userPicks.forEach(pick => {
            htmlContent += `<tr>
                                <td>${pick[0]}</td>
                                <td>${pick[1]}</td>
                                <td>${pick[2]}</td>
                                <td>${pick[3]}</td>
                            </tr>`;
        });
        htmlContent += `</table>`;
        userPicksList.innerHTML = htmlContent;
    } else {
        userPicksList.innerHTML = '<p>You have not picked any places or no matches found.</p>';
    }
}
// This function helps in dynamically creating a table based on the number of Picks the user has not selected
function renderOtherPicks(otherPicks) {
    const otherPicksList = document.getElementById('otherPicksList');
    if (otherPicks && otherPicks.length > 0) {
        let htmlContent = `<table>
                                <tr>
                                    <th>Place</th>
                                    <th>Country</th>
                                    <th>Reason</th>
                                    <th>Votes</th>
                                </tr>`;
        otherPicks.forEach(pick => {
            htmlContent += `<tr>
                                <td>${pick[0]}</td>
                                <td>${pick[1]}</td>
                                <td>${pick[2]}</td>
                                <td>${pick[3]}</td>
                            </tr>`;
        });
        htmlContent += `</table>`;
        otherPicksList.innerHTML = htmlContent;
    } else {
        otherPicksList.innerHTML = '<p>No other picks available or no matches found.</p>';
    }
}

// This Function is used to fetch user picks data and populate the user picks list
// Makes a GET request to the '/api/third-page-data' endpoint with the provided user ID
// Displays the user picks data in a table format on the page
// If no user ID is provided, displays a message prompting the user to enter a User ID
function fetchUserPicks(user_id) {
    if (!user_id) {
        userPicksList.innerHTML = '<p>Please enter a User ID to see your picks.</p>';
        return;
    }

    fetch(`/api/third-page-data?user_id=${user_id}`)
        .then(response => response.json())
        .then(data => {
            const tableHeader = `<table><tr><th>Place</th><th>Country</th><th>Reason</th><th>Votes</th></tr>`;
            let tableRows = data.user_picks && data.user_picks.length > 0 ?
                data.user_picks.map(pick => `<tr><td>${pick[0]}</td><td>${pick[1]}</td><td>${pick[2]}</td><td>${pick[3]}</td></tr>`).join('') :
                '<tr><td colspan="3">You have not picked any places.</td></tr>';
            userPicksList.innerHTML = `${tableHeader}${tableRows}</table>`;
        })
        .catch((error) => {
            console.error('Error:', error);
            userPicksList.innerHTML = '<p>Error fetching your picks. Please try again.</p>';
        });
}

// Chart to display Top 
let otherPicksChartInstance = null; // Global variable to hold the chart instance

function renderOtherPicksChart(data) {
    const ctx = document.getElementById('otherPicksChart').getContext('2d');

    // Destroy the previous chart instance if it exists
    if (otherPicksChartInstance) {
        otherPicksChartInstance.destroy();
    }

    const chartLabels = data.map(pick => `${pick[0]}, ${pick[1]}`); // Place and Country
    const chartData = data.map(pick => pick[3]); // Votes

    const chartContainer = document.getElementById('otherPicksChartContainer');
    if (data.length === 0) {
        chartContainer.style.display = 'none';
        return;
    } else {
        chartContainer.style.display = 'block';
    }

    // Create a new chart instance
    otherPicksChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: '# of Votes',
                data: chartData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// This function is used to fetch other user picks data and populate the other picks list
// Makes a GET request to the '/api/third-page-data' endpoint with the provided user ID
// Displays the other user picks data in a table format on the page
// If no user ID is provided, displays a message prompting the user to enter a User ID
function fetchOtherPicks(user_id) {
    if (!user_id) {
        otherPicksList.innerHTML = '<p>Please enter a User ID to see other picks.</p>';
        return;
    }

    fetch(`/api/third-page-data?user_id=${encodeURIComponent(user_id)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.other_picks && data.other_picks.length > 0) {
                const tableHeader = `<table><tr><th>Place</th><th>Country</th><th>Reason</th><th>Votes</th></tr>`;
                const tableRows = data.other_picks.map(pick => `<tr><td>${pick[0]}</td><td>${pick[1]}</td><td>${pick[2]}</td><td>${pick[3]}</td></tr>`).join('');
                otherPicksList.innerHTML = `${tableHeader}${tableRows}</table>`;

                // Display the chart container
                const chartContainer = document.getElementById('otherPicksChartContainer');
                chartContainer.style.display = 'block';

                // Render the chart with top 10 picks
                renderOtherPicksChart(data.other_picks.slice(0, 10));
            } else {
                otherPicksList.innerHTML = '<tr><td colspan="4">No other picks available.</td></tr>';
                document.getElementById('otherPicksChartContainer').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching other picks:', error);
            otherPicksList.innerHTML = '<p>Error fetching other picks. Please try again.</p>';
            document.getElementById('otherPicksChartContainer').style.display = 'none';
        });
}

// Function to fetch unique places and countries
function fetchUniquePlacesAndCountries() {
    fetch('/api/places-countries')
    .then(response => response.json())
    .then(data => {
        populateDatalist('voteFilterPlaceList', data.unique_places);
        populateDatalist('voteFilterCountryList', data.unique_countries);

        // Populate dropdowns for the picks section
        populateDatalist('picksFilterPlaceList', data.unique_places);
        populateDatalist('picksFilterCountryList', data.unique_countries);

        populateDatalist('placeList', data.unique_places);
        populateDatalist('countryList', data.unique_countries);
    })
    .catch(error => console.error('Error fetching unique places and countries:', error));
}

// function to populate datalist 
function populateDatalist(datalistId, optionsArray) {
    const datalist = document.getElementById(datalistId);
    // Clear existing options first
    datalist.innerHTML = '';

    // Populate datalist with options from the array
    optionsArray.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        datalist.appendChild(option);
    });
}


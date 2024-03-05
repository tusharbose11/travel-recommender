import os
import openpyxl
import csv
from utility import *
from flask import Flask, render_template, request, redirect, url_for, jsonify

app = Flask(__name__)


# Global variable to store user data in memory
global_data = HashMap()

# Load data into global_data at startup; data is extracted once.
load_data_into_hashmap('updated_test.csv', global_data)



#Here we are setting the route for the root URL, it renders the index.html template
@app.route('/')
def index():
    return render_template('index.html')

#This flask route is for a GET request to get unique places and countries with the help of get_unique_places_and_countries function
@app.route('/api/places-countries', methods=['GET'])
def api_places_countries():
    try:
        unique_places, unique_countries = get_unique_places_and_countries(global_data)
        return jsonify({'unique_places': unique_places, 'unique_countries': unique_countries})
    except Exception as e:
        print(f"Error in api_places_countries: {str(e)}")  # Debugging statement
        return jsonify({'status': 'error'})

#This flask route is for a POST request, which takes user input from the frontend
# It then helps in storing the value with the function add_or_update_place
@app.route('/api/submit-first', methods=['POST'])
def api_submit_first():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        place = data.get('place')
        country = data.get('country')
        reason = data.get('reason')
        add_or_update_place(global_data, user_id, place, country, reason)
        # Optionally, write updated data to CSV here or after a batch of submissions

    except Exception as e:
        print(f"Error in api_submit_first: {str(e)}")  # Debugging statement
        return jsonify({'status': 'error'})

    # Optionally, write updated data to CSV here or after a batch of submissions
    write_hashmap_to_csv(global_data, 'updated_test.csv')
    return jsonify({'status': 'success'})

#This flask route is for a GET request, which helps in getting the user_id, place,country values that a user will input in the frontend
#It calls the prepare_second_page_data, which helps in getting the data on which the user will upvote.
@app.route('/api/second-page-data', methods=['GET'])
def api_second_page_data():
    try:
        user_id = request.args.get('user_id')
        filter_place = request.args.get('filter_place', '')
        filter_country = request.args.get('filter_country', '')
        sort_order = request.args.get('sort_order', '')  # Default to ascending
        place_country_pairs, votes, _ = prepare_second_page_data(global_data, exclude_user_id=user_id, filter_place=filter_place, filter_country=filter_country, sort_order=sort_order)
        data = [{'place': p, 'country': c, 'votes': v} for (p, c), v in zip(place_country_pairs, votes)]
        return jsonify(data)
    except Exception as e:
        print(f"Error in api_second_page_data: {str(e)}")  # Debugging statement
        return jsonify({'status': 'error'})

#This flask route is for a POST request, which helps in casting a VOTE
#It calls upon the add_or_update_place to update the vote entered by the user and at the same time writes the data into a csv file
@app.route('/api/upvote', methods=['POST'])
def api_upvote():
    try:
        data = request.json
        user_id = data.get('user_id')
        place = data.get('place')
        country = data.get('country')
        reason = data.get('reason')
        if add_or_update_place(global_data, user_id, place, country, reason):
            write_hashmap_to_csv(global_data, 'updated_test.csv')
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'already_voted'})
    except Exception as e: 
        print(f"Error in api_upvote: {str(e)}")  # Debugging statement
        return jsonify({'status': 'error'})

#This flask route is for a GET request, which helps in displaying the user picks and other picks section
#Here it calls upon the prepare_third_page_data function to display the data and the chart requested by the user
@app.route('/api/third-page-data', methods=['GET'])
def api_third_page_data():
    try:
        user_id = request.args.get('user_id')
        filter_place = request.args.get('filter_place', '')
        filter_country = request.args.get('filter_country', '')
        sort_order = request.args.get('sort_order', 'asc')  # Default to ascending
        user_picks, other_picks = prepare_third_page_data(global_data, user_id, filter_place, filter_country, sort_order)
        
        return jsonify({'user_picks': user_picks, 'other_picks': other_picks})
    except Exception as e:
        print(f"Error in api_third_page_data: {str(e)}")  # Debugging statement
        return jsonify({'status': 'error'})

if __name__ == '__main__':
    app.run(debug=True)

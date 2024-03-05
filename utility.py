import os
import openpyxl
import csv

# Creating a Hash Node class
class HashNode:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.next = None

#Implementing a basic hashmap datastructure with its different functions
class HashMap:
    def __init__(self, size=10):
        self.size = size
        self.buckets = [None] * self.size

    def get_hash(self, key):
        return hash(key) % self.size

    def set(self, key, value):
        hash_key = self.get_hash(key)
        node = self.buckets[hash_key]

        if node is None:
            self.buckets[hash_key] = HashNode(key, value)
            return

        prev = None
        while node is not None:
            if node.key == key:
                node.value = value
                return
            prev = node
            node = node.next

        prev.next = HashNode(key, value)

    def get(self, key):
        hash_key = self.get_hash(key)
        node = self.buckets[hash_key]

        while node:
            if node.key == key:
                return node.value
            node = node.next

        return None

    def remove(self, key):
        hash_key = self.get_hash(key)
        node = self.buckets[hash_key]

        prev = None
        while node:
            if node.key == key:
                if prev:
                    prev.next = node.next
                else:
                    self.buckets[hash_key] = node.next
                return

            prev = node
            node = node.next

#This function has been created to read the csv data at the start, when the server is first loaded.
#If the file does not exist then this function will create an empty file with just the headers
def read_csv_data(file_path):
    if not os.path.exists(file_path):
        with open(file_path, 'w') as file:
            headers = ['user_id', 'place', 'country', 'reason']
            file.write(','.join(headers))
        
    try:
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)  # Skip the header row

            # Find the indices for the 'countries' and 'places' columns
            try:
                countries_index = header.index("country")
                places_index = header.index("place")
            except ValueError:
                raise ValueError("CSV does not contain 'country' or 'place' columns")

            countries_column = []
            places_column = []
            total_data = []  # List to store each row as a list

            for row in reader:
                countries_column.append(row[countries_index])
                places_column.append(row[places_index])
                total_data.append(row)  # Add the entire row as a list

            unique_places = list(set(places_column))
            unique_countries = list(set(countries_column))
        return unique_places, unique_countries, total_data
    except Exception as e:
        print('Exception is ',e)

        

#This function has been created to add or update places, countries and reason for recommendation
def add_or_update_place(user_data, user_id, place, country, reason):
    try:
        # Check if the user exists in the data
        if user_data.get(user_id) is None:
            user_data.set(user_id, [[], [], []])

        # Check if the place-country pair is already in the user's data
        places = user_data.get(user_id)[0]
        countries = user_data.get(user_id)[1]
        for p, c in zip(places, countries):
            if p == place and c == country:
                # Place-country pair already exists, so we don't add it again
                return False  # Indicates a repeat vote

        # Place-country pair is new, so we add it
        user_data.get(user_id)[0].append(place)
        user_data.get(user_id)[1].append(country)
        user_data.get(user_id)[2].append(reason)
        return True  # Indicates a new vote was successfully added
    except Exception as e:
        print('Exception is ',e)

#This function has been created to load data into HashMap datastructure
def load_data_into_hashmap(file_path, hashmap):
    try:
        unique_places, unique_countries, total_data = read_csv_data(file_path)
        for row in total_data:
            user_id, place, country, *other_info = row
            if hashmap.get(user_id) is None:
                hashmap.set(user_id, [[], [], []])
            hashmap.get(user_id)[0].append(place)
            hashmap.get(user_id)[1].append(country)
            if other_info:
                hashmap.get(user_id)[2].extend(other_info)
    except Exception as e:
        print('Exception is ',e)

#This function has been created to get unique list of places and countries from the total data that we have
def get_unique_places_and_countries(hashmap):
    try:
        unique_places = set()
        unique_countries = set()

        for bucket in hashmap.buckets:
            node = bucket
            while node:
                unique_places.update(node.value[0])  # Add places
                unique_countries.update(node.value[1])  # Add countries
                node = node.next

        return list(unique_places), list(unique_countries)
    except Exception as e:
        print('Exception is ',e)

#This function has been created for the upvote functionality
#It helps calculate the total votes dynamically based on the number of occurences of that place, country pair
def prepare_second_page_data(user_data, exclude_user_id=None, filter_place='', filter_country='', sort_order='desc'):
    try:
        place_country_pairs = []
        votes = []
        all_user_upvotes = []

        # Compile data for voting
        for bucket in user_data.buckets:
            node = bucket
            while node:
                #print(f"Processing node with key: {node.key}")  # Debug print
                for place, country in zip(node.value[0], node.value[1]):
                    if (filter_place.lower() == place.lower() or not filter_place) and \
                            (filter_country.lower() == country.lower() or not filter_country):
                        pair = (place, country)
                        if node.key != exclude_user_id:
                            if pair not in place_country_pairs:
                                place_country_pairs.append(pair)
                                votes.append(1)
                            else:
                                index = place_country_pairs.index(pair)
                                votes[index] += 1

                        # Record the upvotes made by each user
                        all_user_upvotes.append((node.key, pair))
                node = node.next  # Ensure this is correctly moving to the next node

        #The data is then sorted
        sorted_data = sorted(zip(place_country_pairs, votes), key=lambda x: x[1], reverse=(sort_order == 'desc'))
        place_country_pairs, votes = zip(*sorted_data) if sorted_data else ([], [])

        return place_country_pairs, votes, all_user_upvotes
    except Exception as e:
        print('Exception is ',e)

#This function has been created for the User Picks and Other Picks section
#It checks the places, countries recommended by the user and helps display it 
#It also helps in excluding the aforementioned data from Other Picks section
def prepare_third_page_data(user_data, user_id, filter_place='', filter_country='', sort_order='asc'):
    try:
        user_picks_temp = []
        other_picks_temp = []
        user_places = set()  # Tracks places & countries picked by the user

        # Compile all picks with filtering
        for bucket in user_data.buckets:
            node = bucket
            while node:
                for place, country, reason in zip(*node.value):
                    if ((filter_place.lower() == place.lower() or not filter_place) and
                        (filter_country.lower() == country.lower() or not filter_country)):
                        if node.key == user_id:
                            # Directly append to user_picks_temp for the user's picks
                            user_picks_temp.append((place, country, reason, 1))
                            user_places.add((place, country))
                        else:
                            # Compile other_picks_temp with initial vote counts
                            found = False
                            for i, (op_place, op_country, op_reason, op_votes) in enumerate(other_picks_temp):
                                if place == op_place and country == op_country:
                                    updated_reason = op_reason if reason in op_reason else f"{op_reason}, {reason}"
                                    other_picks_temp[i] = (op_place, op_country, updated_reason, op_votes + 1)
                                    found = True
                                    break
                            if not found:
                                other_picks_temp.append((place, country, reason, 1))
                node = node.next

        # Adjust user_picks vote counts based on other_picks and sort
        user_picks = sorted(
            [(place, country, reason, sum([op_votes for op_place, op_country, _, op_votes in other_picks_temp if op_place == place and op_country == country]) + 1) for place, country, reason, _ in user_picks_temp],
            key=lambda x: x[3],
            reverse=(sort_order == 'desc')
        )

        # Remove user_picks from other_picks
        user_picks_places_countries = [(place, country) for place, country, _, _ in user_picks]
        other_picks = [pick for pick in other_picks_temp if (pick[0], pick[1]) not in user_picks_places_countries]

        # Sort other_picks by votes in descending order after filtering out user_picks
        other_picks = sorted(
            other_picks,
            key=lambda x: x[3],
            reverse=(sort_order == 'desc')
        )

        return user_picks, other_picks
    except Exception as e:
        print('Exception is ',e)

#This function is used for writing the contents of the hashmap into a csv file
def write_hashmap_to_csv(hashmap, file_name):
    try:
        with open(file_name, 'w', newline='') as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow(['user_id', 'place', 'country', 'reason'])

            for bucket in hashmap.buckets:
                node = bucket
                while node:
                    user_id, response_list = node.key, node.value
                    places = response_list[0]
                    countries = response_list[1]
                    reasons = response_list[2]

                    for place, country, reason in zip(places, countries, reasons):
                        csvwriter.writerow([user_id, place, country, reason])

                    node = node.next
    except Exception as e:
        print('Exception is ',e)


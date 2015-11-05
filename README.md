# geotracer
A simple project to connect the geographic dots.

**Instructions to get running:**

Clone the repo in a local directory

Create a file named keys.py in the format:
```
import os
os.environ["cartodb_user"] = 'domain'
os.environ["cartodb_key"] = 'apikey'
```
**Run the following commands:**


cd geopaths
pip install -r requirements.txt
python app.py
```

Navigate to localhost:5000 in your browser and it should be running

**MVP:**
Have a user enter at least two locations, maximum of five. These locations are geocoded, stored, and displayed on a map. Lines are drawn connecting the points.

**Platform:**

Front-end:
leaflet.js
cartodb.js
mapbox.js
pelias-leaflet-geocoder.js

Mapzen Search is being used for our Geocoder. 

Backend:
Flask + CartoDB


Initial Inspiration:

This project is being prepared initially to be used at an exhibition curated by Project Prospera: http://www.projectprospera.com/index.html

Some other topically related maps:
http://www.pewhispanic.org/2015/09/28/from-ireland-to-germany-to-italy-to-mexico-how-americas-source-of-immigrants-has-changed-in-the-states-1850-to-2013/
http://www.migrationpolicy.org/programs/data-hub/charts/international-migrant-population-country-origin-and-destination?width=1000&height=850&iframe=true
http://www.nytimes.com/interactive/2009/03/10/us/20090310-immigration-explorer.html?_r=0

Intent:
Hummanize migration, migration histories
connect to current events
Map is explicitly political
Start with person, then go back by generation
Technology as a tool, diversity


Context:
Refugee law was written for European displaced persons, have been ammended over time
Migration and Renewal complexities and hardships of migration

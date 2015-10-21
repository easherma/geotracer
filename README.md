# geopaths
A simple project to connect the geographic dots.

Instructions to get running:

git clone the repo
Install virtualenvwrapper, run mkvirtualenv geopaths --no-site-packages
Run: workon geopaths
Run: pip install requirements.txt
Run: python run.py
Navigate to localhost:5000 in your browser and it should be running

MVP:
Have a user enter at least two locations. These locations are geocoded, stored, and displayed on a map. Lines are drawn connecting the points.

Platform:

We'll likely use CartoDB as backend and Mapzen Search for geocoding. JS for frontend, with Leaflet and D3, if needed.

Initial Inspiration:
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

Setup:  
- Getting API Keys: (Hopefully by Tuesday we'll have a shared account.)  
    - Sign up for free API keys for Mapzen Search and CartoDb.  
- Setting up the website:  
    - Edit flight_paths.html. Paste in the key where it says <ADD KEY HERE>.  
    - Start up a local web server:  
        - This only involves running one command if you have python installed.  
        - For Windows, in the command prompt, enter C:\Python.exe -m SimpleHTTPServer 8000  
        - For Mac/Linux, in the terminal, enter python -m SimpleHTTPServer 8000  
          (If you have Python 3, the command is python -m http.server 8000)  
- Setting up the CartoDb database:  
    - Create a table according to this schema:  
      CREATE TABLE geopaths   
        (cartodb\_id number,   
         the\_geom geometry,  
         email string,  
         lastedited date,  
         p1 geometry,  
         p2 geometry,  
         p3 geometry,  
         p4 geometry,  
         p5 geometry);  
    - Add the non-geometry columns using the CartoDb GUI. To add the point columns, enter PostGIS statements of this form into the CartoDb SQL editor:  
      SELECT AddGeometryColumn ('geopaths','p1',4326,'POINT',2);  
    - It is not necessary to seed the table with testing data, the webiste will do this automatically if the table is empty.

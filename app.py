from flask import Flask
from flask import render_template
import os
<<<<<<< HEAD
=======
#import keys
>>>>>>> origin/master
from flask import render_template, request, redirect, url_for, jsonify
from cartodb import CartoDBAPIKey, CartoDBException
import json 
import requests
import geojson

app = Flask(__name__)
cartodb_key = os.environ.get("cartodb_key")
cartodb_user= os.environ.get("cartodb_user")

@app.route('/')
def index():
    print("HELLO FROM INDEX")
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    try:
        carto_geoj = json.dumps(cl.sql("SELECT * FROM points", format='geojson'))
        last_row_id = 0
        #print("Length of database is: ", len(carto_geoj['rows']))
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', carto_geoj=carto_geoj, last_row_id=last_row_id)

@app.route('/geo', methods=['GET', 'POST'])
def geodata():
    # Query: INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" + ds[0].toString() + ", " + coords[1].toString() + "),4326))
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    geodata = json.dumps(request.json)
    print(geodata)
    try:
        result = json.dumps(cl.sql("DROP TABLE temp ; CREATE TABLE temp AS WITH data AS (SELECT '" + geodata + "'::json AS fc) SELECT row_number() OVER () AS gid, ST_AsText(ST_GeomFromGeoJSON(feat->>'geometry')) AS geom, feat->'properties' AS properties FROM (SELECT json_array_elements(fc->'features') AS feat FROM data) AS f; INSERT INTO points (the_geom, pelias_label,session_id) SELECT ST_COLLECT(ST_SETSRID(geom, 4326)), json_agg(properties), max(gid) from temp;"))
    except CartoDBException as e:
        print("some error ocurred", e)
    return redirect(url_for('index'))



@app.route('/more')
def update():
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    prevRow = request.args.get('rowid','')
    try:
        carto_geoj = cl.sql("SELECT cartodb_id," +
            "ST_AsGeoJSON(p1) as p1," +
            "ST_AsGeoJSON(p2) as p2," +
            "FROM geopaths " +
            "WHERE cartodb_id > " + str(prevRow) + ";")
    except CartoDBException as e:
        print("some error occurred", e)
    return jsonify(carto_geoj)

    
 
if __name__ == '__main__':
   app.run(debug=True)

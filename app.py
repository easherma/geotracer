from flask import Flask
from flask import render_template
from flask import views
import os
from flask import render_template, request, redirect, url_for, jsonify
from cartodb import CartoDBAPIKey, CartoDBException
import json 
#import keys


app = Flask(__name__)
cartodb_key = os.environ.get("cartodb_key")
cartodb_user= os.environ.get("cartodb_user")

@app.route('/')
def index():
    cl = CartoDBAPIKey('',cartodb_user)
    try:
        carto_geoj = cl.sql("SELECT * FROM points ORDER BY random() LIMIT 1;", format='geojson')
        id = carto_geoj['features'][0]['properties']['cartodb_id']
        #TODO: Parse array of strings, not array of objects as place labels
        labels_resp = cl.sql("SELECT pelias_label FROM points WHERE cartodb_id = %s ;" % id)
        labels = [[y for y in json.loads(x['pelias_label'])] for x in labels_resp['rows']]
        last_row_id_resp = cl.sql("SELECT MAX(cartodb_id) AS id FROM points")
        last_row_id = last_row_id_resp['rows'][0]['id']

    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', 
                           carto_geoj=json.dumps(carto_geoj), 
                           carto_places=labels,
                           last_row_id=last_row_id, id=id)
                           
@app.route('/all')
def all():
    cl = CartoDBAPIKey('',cartodb_user)
    try:
        carto_geoj = cl.sql("SELECT * FROM points;", format='geojson')
        id = "All"
        #TODO: Parse array of strings, not array of objects as place labels
        labels_resp = cl.sql("SELECT pelias_label FROM points ")
        labels = [[y for y in json.loads(x['pelias_label'])] for x in labels_resp['rows']]
        last_row_id_resp = cl.sql("SELECT MAX(cartodb_id) AS id FROM points")
        last_row_id = last_row_id_resp['rows'][0]['id']

    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', 
                           carto_geoj=json.dumps(carto_geoj), 
                           carto_places=labels,
                           last_row_id=last_row_id, id=id)
						   
@app.route('/geo', methods=['GET', 'POST'])
def geodata():
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    #TODO: validate that geoJSON is valid and nonmalicious
    geodata = json.dumps(request.json)
    try:
        #TODO: Store places as array of string, not array of object
        #TODO: user parameter binding instead of string concatenation
        result = json.dumps(cl.sql("DROP TABLE temp ; CREATE TABLE temp AS WITH data AS (SELECT '" + geodata + "'::json AS fc) SELECT row_number() OVER () AS gid, ST_AsText(ST_GeomFromGeoJSON(feat->>'geometry')) AS geom, feat->'properties' AS properties FROM (SELECT json_array_elements(fc->'features') AS feat FROM data) AS f; INSERT INTO points (the_geom, pelias_label,session_id) SELECT ST_COLLECT(ST_SETSRID(geom, 4326)), json_agg(properties), max(gid) from temp;"))
    except CartoDBException as e:
        print("some error ocurred", e)
    return redirect(url_for('index'))



@app.route('/more')
def update():
    cl = CartoDBAPIKey('',cartodb_user)
    prevRow = int(request.args.get('rowid',''))
    try:
        #TODO: user parameter binding instead of string concatenation
        carto_geoj = cl.sql("SELECT the_geom FROM points WHERE cartodb_id > " + str(prevRow) + ";", format='geojson')

        #TODO: Parse array of strings, not array of objects as place labels
        labels_resp = cl.sql("SELECT pelias_label FROM points WHERE cartodb_id > " + str(prevRow) + ";")
        labels = [[y for y in json.loads(x['pelias_label'])] for x in labels_resp['rows']]

        last_row_id_resp = cl.sql("SELECT MAX(cartodb_id) AS id FROM points")
        last_row_id = last_row_id_resp['rows'][0]['id']

    except CartoDBException as e:
        print("some error occurred", e)
    return jsonify(multipoints=carto_geoj,
                   places=labels,
                   lastrowid=last_row_id)

@app.route('/<int:id>')
def index_s(id):
   cl = CartoDBAPIKey('',cartodb_user)
   try:
       carto_geoj = json.dumps(cl.sql("SELECT * FROM points WHERE cartodb_id= %d;" % id , format='geojson'))
       #TODO: Parse array of strings, not array of objects as place labels
       labels_resp = cl.sql("SELECT pelias_label FROM points WHERE cartodb_id= %d;" % id)
       labels = [[y for y in json.loads(x['pelias_label'])] for x in labels_resp['rows']]
       last_row_id_resp = cl.sql("SELECT MAX(cartodb_id) AS id FROM points")
       last_row_id = last_row_id_resp['rows'][0]['id']

   except CartoDBException as e:
       print("some error ocurred", e)
   return render_template('index.html', 
                          carto_geoj=carto_geoj, 
                          carto_places=labels,
                          last_row_id=last_row_id, id=id)   
 
if __name__ == '__main__':
   app.run(debug=True)

from flask import Flask
from flask import render_template
import os
import keys
#enviornmentalvariablesscriptexportbeforeyourunpython
from flask import render_template, request, redirect, url_for, jsonify
from cartodb import CartoDBAPIKey, CartoDBException
import json 

app = Flask(__name__)
cartodb_key = os.environ.get("cartodb_key")
cartodb_user= os.environ.get("cartodb_user")

@app.route('/')
def index():
    print("HELLO FROM INDEX")
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    try:
        carto_geoj = cl.sql("SELECT cartodb_id, ST_AsGeoJSON(p1) as p1, ST_AsGeoJSON(p2) as p2 FROM geopaths;")
        last_row_id = max([row['cartodb_id'] for row in carto_geoj['rows']])
        print(carto_geoj)
        print("Length of database is: ", len(carto_geoj['rows']))
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', carto_geoj=carto_geoj, last_row_id=last_row_id)

@app.route('/geo', methods=["POST"])
def geodata():
    # Query: INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" + coords[0].toString() + ", " + coords[1].toString() + "),4326))
    cl = CartoDBAPIKey(cartodb_key, cartodb_user)
    geodata = request.json
    print(geodata)
    for index in range(1, len(geodata)):
        try:
            cl.sql("INSERT INTO geopaths (p1, p2) VALUES (ST_SetSRID(ST_Point(" +
            str(geodata[index - 1][0]) + ", " + str(geodata[index - 1][1]) + "),4326), ST_SetSRID(ST_Point(" +
            str(geodata[index][0]) + ", " + str(geodata[index][1]) + "),4326))")
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

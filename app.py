from flask import Flask
from flask import render_template

app = Flask(__name__)


from flask import render_template, request, redirect, url_for, jsonify
import keys
from cartodb import CartoDBAPIKey, CartoDBException
import json

@app.route('/')
def index():
    print("HELLO FROM INDEX")
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    try:
        carto_geoj = cl.sql("SELECT cartodb_id," +
                "ST_AsGeoJSON(p1) as p1," +
                "ST_AsGeoJSON(p2) as p2," +
                "ST_AsGeoJSON(p3) as p3," +
                "ST_AsGeoJSON(p4) as p4," +
                "ST_AsGeoJSON(p5) as p5 " +
                "FROM geopaths;")
        last_row_id = max([row['cartodb_id'] for row in carto_geoj['rows']])
        print("Length of database is: ", len(carto_geoj['rows']))
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', carto_geoj=carto_geoj, last_row_id=last_row_id)

@app.route('/geo', methods=["POST"])
def geodata():
    # Query: INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" + coords[0].toString() + ", " + coords[1].toString() + "),4326))
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    geodata = request.json
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
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    prevRow = request.args.get('rowid','')
    try:
        carto_geoj = cl.sql("SELECT cartodb_id," +
            "ST_AsGeoJSON(p1) as p1," +
            "ST_AsGeoJSON(p2) as p2," +
            "ST_AsGeoJSON(p3) as p3," +
            "ST_AsGeoJSON(p4) as p4," +
            "ST_AsGeoJSON(p5) as p5 " +
            "FROM geopaths " +
            "WHERE cartodb_id > " + str(prevRow) + ";")
    except CartoDBException as e:
        print("some error occurred", e)
    return jsonify(carto_geoj)

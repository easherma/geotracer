from flask import render_template, request, redirect, url_for
from app import app
import keys
from cartodb import CartoDBAPIKey, CartoDBException
import json

@app.route('/')
def index():
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    try:
        carto_geoj = cl.sql("SELECT cartodb_id," +
                "ST_AsGeoJSON(p1) as p1," +
                "ST_AsGeoJSON(p2) as p2," +
                "ST_AsGeoJSON(p3) as p3," +
                "ST_AsGeoJSON(p4) as p4," +
                "ST_AsGeoJSON(p5) as p5 " +
                "FROM geopaths;")
        print "success"
        print carto_geoj
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html', carto_geoj=carto_geoj)

@app.route('/geo', methods=["POST"])
def geodata():
    # Query: INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" + coords[0].toString() + ", " + coords[1].toString() + "),4326))
    print "Received"
    print request.json[0]
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    try:
        cl.sql("INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" +
        str(request.json[0][0]) + ", " + str(request.json[0][1]) + "),4326))")
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html')

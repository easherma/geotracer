from flask import render_template, request, redirect, url_for
from app import app
import keys
from cartodb import CartoDBAPIKey, CartoDBException
import json

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/geo', methods=["POST"])
def geodata():
    # Query: INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" + coords[0].toString() + ", " + coords[1].toString() + "),4326))
    print "Received"
    print request.json[0]
    cl = CartoDBAPIKey(keys.cartodb_key, keys.cartodb_user)
    try:
        print(cl.sql("INSERT INTO geopaths (the_geom) VALUES (ST_SetSRID(ST_Point(" +
        str(request.json[0][0]) + ", " + str(request.json[0][1]) + "),4326))"))
    except CartoDBException as e:
        print("some error ocurred", e)
    return render_template('index.html')

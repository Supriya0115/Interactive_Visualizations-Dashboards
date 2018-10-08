#################################################
# Import Libraries
#################################################

import os
import pandas as pd
import datetime as dt
import numpy as np


import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, inspect, desc

from flask import (
    Flask,
    render_template,
    jsonify,
    redirect)

from flask_sqlalchemy import SQLAlchemy

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

#################################################
# Database Setup
#################################################

# The database URI
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db/belly_button_biodiversity.sqlite"

db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()

# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
OTU = Base.classes.otu
Samples_Metadata = Base.classes.samples_metadata
Samples = Base.classes.samples


#################################################
# Flask Routes
#################################################

@app.route("/")
def home():
    """Render Home Page."""
    return render_template("index.html")


@app.route("/names")
def names():
    """Return a list of sample names."""

    # Use Pandas to perform the sql query
    stmt = db.session.query(Samples).statement
    df = pd.read_sql_query(stmt, db.session.bind)

    # Return a list of the column names (sample names)
    return jsonify(list(df.columns)[2:])


@app.route("/metadata/<sample>")

def sample_metadata(sample):
    """Return the MetaData for a given sample."""
    sel = [
        Samples_Metadata.SAMPLEID,
        Samples_Metadata.ETHNICITY,
        Samples_Metadata.GENDER,
        Samples_Metadata.AGE,
        Samples_Metadata.LOCATION,
        Samples_Metadata.BBTYPE,
        Samples_Metadata.WFREQ,
    ]


    results = db.session.query(*sel).filter(Samples_Metadata.SAMPLEID == sample).all()

    # Create a dictionary entry for each row of metadata information
    sample_metadata = {}

    for result in results:
        sample_metadata["SAMPLEID"] = result[0]
        sample_metadata["ETHNICITY"] = result[1]
        sample_metadata["GENDER"] = result[2]
        sample_metadata["AGE"] = result[3]
        sample_metadata["LOCATION"] = result[4]
        sample_metadata["BBTYPE"] = result[5]
        sample_metadata["WFREQ"] = result[6]

    print(sample_metadata)
    return jsonify(sample_metadata)

# Return OTU IDs and sample value
@app.route("/samples/<sample>")
def samples(sample):
    """Return `otu_ids`, `otu_labels`,and `sample_values`."""
    stmt = db.session.query(Samples).statement
    df = pd.read_sql_query(stmt, db.session.bind)

    # Filter the data based on the sample number and
    # only keep rows with values above 1
    # sample_data = df.loc[df[sample] > 1, ["otu_id", "otu_label", sample]]
    sample_data = df.loc[df[sample] > 1, ["otu_id", sample]]

    # Format the data to send as json
    data = {
        "otu_ids": sample_data.otu_id.values.tolist(),
        "sample_values": sample_data[sample].values.tolist(),
        # "otu_labels": sample_data.otu_label.tolist(),
    }
    return jsonify(data)

# Return OTU descriptions
@app.route("/otu")
def otu():

    # Use Pandas to perform the sql query
    stmt = db.session.query(OTU).statement
    df = pd.read_sql_query(stmt, db.session.bind)

    otu_desc = df["lowest_taxonomic_unit_found"]
    otu_desc_list = [desc for desc in otu_desc]
    return jsonify(otu_desc_list)

# Return washing frequency 
@app.route("/wfreq/<sample>")
def wfreq(sample):

    # Use Pandas to perform the sql query
    stmt = db.session.query(Samples_Metadata).statement
    df = pd.read_sql_query(stmt, db.session.bind)
    sample = int(sample[3:])

    wfreq_data = (db.session
                     .query(Samples_Metadata.WFREQ,
                            Samples_Metadata.SAMPLEID)
                     .filter(Samples_Metadata.SAMPLEID == sample)
                     .group_by(Samples_Metadata.SAMPLEID)
                     .all())


    sample_wfreq = {'wfreq': wfreq_data[0][0],
                    'sample_id': wfreq_data[0][1],
                    }
    
    return jsonify(sample_wfreq)

if __name__ == "__main__":
    app.run()
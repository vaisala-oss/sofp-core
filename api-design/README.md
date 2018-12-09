# SOFP API Example

## Root level: Dataset discovery API (non-WFS3)

The functionality of the dataset discovery API can also be implemented using a catalog service like CSW.

**Request:** ```GET /```

Landing page for the entire multi-endpoint service (non-WFS3).
A JSON document with links to /api and /datasets, or a HTML page with these links (based on content negotiation).

Example response:
```json
{
  "links": [
    {
      "href": "http://data.example.org/",
      "rel": "self", "type": "application/json", "title": "this document"
    },
    {
      "href": "http://data.example.org/api",
      "rel": "service", "type": "application/openapi+json;version=3.0", "title": "the API definition"
    },
    {
      "href": "http://data.example.org/datasets",
      "rel": "data", "type": "application/json", "title": "Metadata about the provided datasets"
    }
  ]
}
```

**Request:** ```GET /api```

OpenAPI3 description of the entire multi-endpoint service (super API, non-WFS3), or just the OpenAPI3 description of the dataset Discovery API part??

**Request:** ```GET /datasets```

List of all the available datasets on this server. Similar to /collections of the WFS3. Returns all the datasets of all levels, with paging (as in WFS3, with ```limit```, ```next``` and ```prev```) and free text filtering (```q=numerical```).

Example response:

```json
{
  "links": [
    {
      "href": "http://data.example.org/datasets.json",
      "rel": "self", "type": "application/json", "title": "this document"
    },
    {
      "href": "http://data.example.org/datasets.html",
      "rel": "alternate", "type": "text/html", "title": "this document as HTML"
    }
  ],
  "datasets": [
    {
      "name": "weather/forecast",
      "title": "Weather forecast data",
      "description": "Weather Most recent weather forecast based in numerical weather model and forecaster guidance provided by the Finnish Meteorological Institute",
      "extent": {
        "spatial": [ 7.01, 50.63, 7.22, 50.78 ],
        "temporal": [ "2010-02-15T12:34:56Z", "2018-03-18T12:11:00Z" ]
      },
      "links": [
        {
          "href": "http://data.example.org/datasets/weather/forecast",
          "rel": "index",
          "type": "application/json",
          "title": "WFS3 landing page of the weather forecast service"
        },
        {
          "href": "http://catalog.fmi.fi/geonetwork/srv/api/records/43282657-3329-4c82-bd31-2631f41357f5/formatters/xml",
          "rel": "describedBy",
          "type": "application/xml",
          "title": "ISO 19139 metadata for the weather forecast dataset series"
        },
        {
          "href": "http://data.example.org/datasets/weather/forecast/api",
          "rel": "service",
          "type": "application/openapi+json;version=3.0",
          "title": "WFS3 API definition of the weather forecast service"
        }
      ]
    },
    {
      "name": "weather/observation",
      "title": "Weather observations",
      "description": "Official weather observation data from the Finnish weather observation station network. Provided by the Finnish Meteorological Institute",
      "extent": {
        "spatial": [ 7.01, 50.63, 7.22, 50.78 ]
      },
      "links": [
        {
          "href": "http://data.example.org/datasets/weather/observation",
          "rel": "index",
          "type": "application/json",
          "title": "WFS3 landing page of the weather observation service"
        },
        {
          "href": "http://catalog.fmi.fi/geonetwork/srv/api/records/bf238561-eb04-4c0b-b9dc-113fb5c6b3c4/formatters/xml",
          "rel": "describedBy",
          "type": "application/xml",
          "title": "ISO 19139 metadata for the weather observations dataset series"
        },
        {
          "href": "http://data.example.org/datasets/weather/observation/api",
          "rel": "service",
          "type": "application/openapi+json;version=3.0",
          "title": "WFS3 API definition of the weather observations service"
        }
      ]
    },
    {
      "name": "observation/airQuality",
      "title": "Air quality observations",
      "description": "Official air quality data from the Finnish national air quality observation station network. Service provided by the Finnish Meteorological Institute, data collected by the Finnish communities",
      "extent": {
        "spatial": [ 7.01, 50.63, 7.22, 50.78 ]
      },
      "links": [
        {
          "href": "http://data.example.org/datasets/airQuality/observation",
          "rel": "index",
          "type": "application/json",
          "title": "WFS3 landing page of the air quality observation service"
        },
        {
          "href": "http://catalog.fmi.fi/geonetwork/srv/api/records/cf1b68b2-78d8-481c-9c2c-2b950214d477/formatters/xml",
          "rel": "describedBy",
          "type": "application/xml",
          "title": "ISO 19139 metadata for the air quality observations dataset series"
        },
        {
          "href": "http://data.example.org/datasets/airQuality/observation/api",
          "rel": "service",
          "type": "application/openapi+json;version=3.0",
          "title": "WFS3 API definition of the air quality observations service"
        }
      ]
    }
  ]
}
```

**Request:** ```GET /datasets/weather```

List of all the available datasets on or under the /weather level with paging and free text filtering. Same format (datasetInfo) as on the top datasets level.

## Data access API (WFS3 compliant)

**Request:** ```GET /datasets/weather/forecast```

Landing page for the weather forecast data. See [WFS3, API landing page ](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_api_landing_page)

**Request:** ```GET /datasets/weather/forecast/conformance```

The conformance declarations of the weather forecast WFS3 endpoint. See [WFS3, conformance](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_declaration_of_conformance_classes)

**Request:** ```GET /datasets/weather/forecast/api```

OpenAPI description for the weather forecast WFS3 endpoint. See [WFS3, API definition ](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_api_definition_2)

**Request:** ```GET /datasets/weather/forecast/collections```

User friendly data collections, such as point forecasts for cities, obs. station locations etc. (WFS3). Only the "best" currently available combination latest NWM forecast data and forecaster adjustments. See [WFS3, Feature collections metadata](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collections_metadata)

**Request:** ```GET /datasets/weather/forecast/collections/cities```

The collectionInfo about the collection for forecast data preset for major cities. See [WFS3, Feature collection metadata](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collection_metadata)

**Request:**
```
GET /datasets/weather/forecast/collections/cities/items?
  time=2018-09-12T00:00:00Z/2018-09-12T12:30:00Z
  &bbox=20.3616603676,60.1215955554,30.7227079655,63.2418932031
```

Returns a feature collection of MeasureObservations for all of the default observedProperties for a bbox + time period for a limited pre-defined set of city locations. See [WFS3, Feature collections](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collections)

**Request:**
```
GET /datasets/weather/forecast/collections/cities/items?
  time=2018-09-12T00:00:00Z/2018-09-12T12:30:00Z
  &near=20.3616603676,60.1215955554
  &radius=100km
```

Returns a feature collection of MeasureObservations for all of the default observedProperties within the distance of 100km of the point (20.3616603676,60.1215955554) and the time period for a limited set of pre-defined city locations. **Note**: the parameters ```near``` and ```radius``` would be extensions of the WFS3 core. See [WFS3, Feature collections](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collections)

**Request:**
```
GET /datasets/weather/forecast/collections/cities/items?
  observedProperty=air_temperature
  &ultimateFeatureOfInterestName=Helsinki*
```

Returns a feature collection of MeasureObservations for air temperature with Helsinki as the ultimate feature of interest.

**Request:**
```
  GET /datasets/weather/forecast/collections/cities/items/{id}
```

If the featureIDs are generated in a way that allows disassembling the request parameters, this operation should return the current results of the same request. Ok to return 404 (not found) or 410 (gone), if the original request cannot be determined from the {id}. See [WFS3, Feature](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_2)

## Features Extracted from 4D Data Cube (e.g. Weather Forecast Model)

**Request:**
```
 GET /datasets/weather/forecast/harmonie/items?
   parametername=Temperature,Humidity
   &time=20181204T150000/20181204T180000
   &bbox=20,60,30,70
   &limit=100
```

Returns a feature collection of MeasureObservations for Harmonie weather model output. Regural grid with 100 points (10x10) is resampled from the data.   

**Request:**
```
 GET /datasets/weather/forecast/harmonie/items?
   parametername=Temperature,Humidity
   &time=20181204T150000/20181204T180000
   &bbox=20,60,30,70
   &lat=60.159900&lon=24.876116
```

Returns a feature collection of MeasureObservations for Harmonie weather model output. Time series from exact given location is returned.


## Extension(s) to the WFS3 Dataset Access API

For the clients aware of the additional timeseries extraction functionality, this operation provides a way to "realize" timeseries Observation objects from the underlying datastore/cube based on the specific query parameters.

**Request:**
```
GET /datasets/weather/forecast/collections/cities/timeSeries?
  time=2018-09-12T00:00:00Z/2018-09-12T12:30:00Z
  &timeStepPeriod=PT1H
  &observedProperty=air_temperature,air_pressure
  &ultimateFeatureOfInterestName=Helsinki*
```

Parameters and values defined in the OpenAPI description.
The ```timeSeries``` operation is at the end of the URL, because the available parameters and their allowed values may depend on the dataset and the collection.
Would return two MeasureTimeSeriesObservation features (one for each observed property).

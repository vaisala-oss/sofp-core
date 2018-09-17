# SOFP API Example

## Root level: Dataset discovery API (non-WFS3)

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
      "name": "forecast/weather",
      "title": "Weather forecast data",
      "description": "Most recent weather forecast based in numerical weather model and forecaster guidance provided by the Finnish Meteorological Institute",
      "extent": {
        "spatial": [ 7.01, 50.63, 7.22, 50.78 ],
        "temporal": [ "2010-02-15T12:34:56Z", "2018-03-18T12:11:00Z" ]
      },
      "links": [
        {
          "href": "http://data.example.org/datasets/forecast/weather",
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
          "href": "http://data.example.org/datasets/forecast/weather/api",
          "rel": "service",
          "type": "application/openapi+json;version=3.0",
          "title": "WFS3 API definition of the weather forecast service"
        }
      ]
    },
    {
      "name": "observation/weather",
      "title": "Weather observations",
      "description": "Official weather observation data from the Finnish weather observation station network. Provided by the Finnish Meteorological Institute",
      "extent": {
        "spatial": [ 7.01, 50.63, 7.22, 50.78 ]
      },
      "links": [
        {
          "href": "http://data.example.org/datasets/observation/weather",
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
          "href": "http://data.example.org/datasets/observation/weather/api",
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
          "href": "http://data.example.org/datasets/observation/airQuality",
          "rel": "index",
          "type": "application/json",
          "title": "WFS3 landing page of theaitr quality observation service"
        },
        {
          "href": "http://catalog.fmi.fi/geonetwork/srv/api/records/cf1b68b2-78d8-481c-9c2c-2b950214d477/formatters/xml",
          "rel": "describedBy",
          "type": "application/xml",
          "title": "ISO 19139 metadata for the air quality observations dataset series"
        },
        {
          "href": "http://data.example.org/datasets/observation/airQuality/api",
          "rel": "service",
          "type": "application/openapi+json;version=3.0",
          "title": "WFS3 API definition of the air quality observations service"
        }
      ]
    }
  ]
}
```

**Request:** ```GET /datasets/observation```

List of all the available datasets on or under the /observation level with paging and free text filtering. Same format (datasetInfo) as on the top datasets level.

## Weather forecast data (WFS3 compliant)

**Request:** ```GET /datasets/forecast/weather```

Landing page for the weather forecast data. See [WFS3, API landing page ](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_api_landing_page)

**Request:** ```GET /datasets/forecast/weather/conformance```

The conformance declarations of the weather forecast WFS3 endpoint. See [WFS3, conformance](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_declaration_of_conformance_classes)

**Request:** ```GET /datasets/forecast/weather/api```

OpenAPI description for the weather forecast WFS3 endpoint. See [WFS3, API definition ](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_api_definition_2)

**Request:** ```GET /datasets/forecast/weather/collections```

User friendly data collections, such as observations for cities, obs. station locations etc. (WFS3). Only the "best" currently available combination latest NWM forecast data and forecaster adjustments. See [WFS3, Feature collections metadata](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collections_metadata)

**Request:** ```GET /datasets/forecast/weather/collections/cities```

The collectionInfo about the collection for forecast data preset for major cities. See [WFS3, Feature collection metadata](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collection_metadata)

**Request:**
```
GET /datasets/forecast/weather/collections/cities/items?
  time=2018-09-12T00:00:00Z/2018-09-12T12:30:00Z
  &bbox=20.3616603676,60.1215955554,30.7227079655,63.2418932031
```

Returns a feature collection of MeasureObservations for all of the default observedProperties for a bbox + time period limited set of city locations. See [WFS3, Feature collections](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_collections)

**Request:**
```
GET /datasets/forecast/weather/collections/cities/items?
  observedProperty=air_temperature
  &ultimateFeatureOfInterestName=Helsinki*
```

Returns a feature collection of MeasureObservations for air temperature and for
  observations with Helsinki as the ultimate feature of interest.

**Request:**
```
  GET /datasets/forecast/weather/collections/cities/items/{id}
```

If the featureIDs are generated in a way that allows disassembling the request parameters, this operation should return the current results of the same request. Ok to return 404 (not found) or 410 (gone), if the original request cannot be determined from the {id}. See [WFS3, Feature](https://rawgit.com/opengeospatial/WFS_FES/master/docs/17-069.html#_feature_2)

## SOFP-API specific, non-WFS3 operations
**Request:**
```
GET /datasets/forecast/weather/collections/cities/timeSeries?
  time=2018-09-12T00:00:00Z/2018-09-12T12:30:00Z
  &timeStepPeriod=PT1H
  &observedProperty=air_temperature,air_pressure
  &ultimateFeatureOfInterestName=Helsinki*
```

Parameters and values defined in the OpenAPI description.
The ```timeSeries``` operation is at the end of the URL, because the available parameters and their allowed values may depend on the dataset and the collection.
Would return two MeasureTimeSeriesObservation features (one for each observed property) realised from the backing datacube using the query parameters.

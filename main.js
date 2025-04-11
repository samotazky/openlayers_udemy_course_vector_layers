import './style.css';
import { Map, Overlay, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { Tile, TileDebug, Vector, VectorTile, XYZ } from 'ol/source';
import OSM from 'ol/source/OSM';
import MVT from 'ol/format/MVT.js';
import LayerGroup from 'ol/layer/Group';
import Attribution from 'ol/control/Attribution.js';
import { defaults } from 'ol/control/defaults';
import { applyStyle } from 'ol-mapbox-style';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import KML from 'ol/format/KML.js';
import { Heatmap } from 'ol/layer';

/** Vector Image Layer je rýchlejšia ako Vector Layer  */
const attribution = new Attribution({
  collapsible: false,
});

const map = new Map({
  target: 'map',
  controls: defaults({ attribution: false }).extend([attribution]),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

// Base Vector Layers
// OSM Layers
const openStreetMapStandard = new TileLayer({
  source: new OSM(),
  visible: true,
  title: "OSMStandard",
})

const openStreetMapHumanitarian = new TileLayer({
  source: new OSM({
    url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
  }),
  visible: false,
  title: "OSMHumanitarian",
})

const stamenToner = new TileLayer({
  source: new XYZ({
    url: "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}@2x.png",
    attributions: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }),
  visible: false,
  title: "StamenToner"
})

// Vector Tile Layer OpenStreetMap
const openStreetMapVectorTileLayer = new VectorTileLayer({
  source: new VectorTile({
    url: "https://api.maptiler.com/tiles/v3-openmaptiles/{z}/{x}/{y}.pbf?key=k7HUmQBYNOzn8MH3tz7L",
    format: new MVT(),
    attributions: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  }),
  visible: false,
  title: "OSMVectorTile"
})
// pridávanie štýlu z mapTiler
// MAPBOX Z https://github.com/openlayers/ol-mapbox-style?tab=readme-ov-file
// MAPTILER

const openStreetMapVectorTileStyles = "https://api.maptiler.com/maps/a96963c0-ea87-46ff-ab43-64d93b158c4a/style.json?key=k7HUmQBYNOzn8MH3tz7L"
applyStyle(openStreetMapVectorTileLayer, openStreetMapVectorTileStyles)


// Layer Group
const baseLayerGroup = new LayerGroup({
  layers: [
    openStreetMapStandard, openStreetMapHumanitarian, openStreetMapVectorTileLayer, stamenToner
  ]
})
map.addLayer(baseLayerGroup)

// VectorLayer EUCountries 
/*
const EUCountriesGeoJSON = new VectorLayer({
  source: new Vector({
    url: "./data/vector_data/Central_EU_countries.geojson",
    format: new GeoJSON()
  }),
  visible: true,
  title: "EUCountiresGeoJSON"
})
map.addLayer(EUCountriesGeoJSON)
*/

// VectorImageLayer EUCountries !!!!!! MALO BY BYŤ RÝCHLEJŠIE
const EUCountriesGeoJSONVectorImage = new VectorImageLayer({
  source: new Vector({
    url: "./data/vector_data/Central_EU_countries.geojson",
    format: new GeoJSON()
  }),
  visible: false,
  title: "EUCountriesGeoJSON"
})

// KML EUCountries
const EUCountriesKML = new VectorLayer({
  source: new Vector({
    url: "./data/vector_data/CentralEUCountries.kml",
    format: new KML()
  }),
  visible: false,
  title: "EUCountriesKML",
})

const heatMapOnlineFBUsers = new Heatmap({
  source: new Vector({
    url: "./data/vector_data/OnlineFBUsers.geojson",
    format: new GeoJSON()
  }),
  radius: 20,
  blur: 12,
  gradient: ["#DC134C", "#DC134C", "#0000", "#0000", "#0000",],
  visible: false,
  title: "HeatMapOnlineUsersFB"
})

const DebugLayer = new TileLayer({
  source: new TileDebug(),
  visible: false,
  title: "TileDebugLayer"
})

const layersGroup = new LayerGroup({
  layers: [
    EUCountriesGeoJSONVectorImage, EUCountriesKML, heatMapOnlineFBUsers, DebugLayer
  ]
})
map.addLayer(layersGroup)

const vectorLayerElements = document.querySelectorAll(".side-bar-container > input[type=checkbox]")

vectorLayerElements.forEach((vectorElement) => {
  vectorElement.addEventListener("change", (e) => {
    let vectorElementValue = e.target.value

    let vectorLayer = layersGroup.getLayers().getArray().find((layer) => layer.get("title") === vectorElementValue)

    if (vectorLayer) {
      vectorLayer.setVisible(e.target.checked)
    }
  })
})


// Base Layer switcher 
const baseLayerElements = document.querySelectorAll(".side-bar-container > input[type=radio]")
baseLayerElements.forEach((baseLayerElement) => {
  baseLayerElement.addEventListener("click", (e) => {
    let baseLayerElementValue = e.target.value

    baseLayerGroup.getLayers().getArray().forEach((layer) => {
      layer.setVisible(layer.get("title") === baseLayerElementValue)
    })
    console.log(baseLayerGroup.getLayers().getArray());
    console.log(`Base layer switched to: ${baseLayerElementValue}`);
  })
})

// Vector feature Popup Informations
const overlayContainerElement = document.querySelector(".overlay-container")
const overlayLayer = new Overlay({
  element: overlayContainerElement
})
map.addOverlay(overlayLayer)
const overlayFeatureName = document.getElementById("feature-name")
const overlayFeatureAdditionalInfo = document.getElementById("feature-additional-info")

// Vector feature Popup Logic
map.on("click", (e) => {
  overlayLayer.setPosition(undefined)
  map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
    let clickedCoordinate = e.coordinate
    let clickedFeatureName = (feature.get("name"));
    let clickedFeatureAdditionalInfo = (feature.get("additionalinfo"));

    if (clickedFeatureName && clickedFeatureAdditionalInfo != undefined) {
      overlayLayer.setPosition(clickedCoordinate)
      overlayFeatureName.innerHTML = clickedFeatureName
      overlayFeatureAdditionalInfo.innerHTML = clickedFeatureAdditionalInfo
    }
  })
})

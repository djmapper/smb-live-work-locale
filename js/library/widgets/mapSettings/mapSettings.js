/*global define,dojo,dojoConfig,esri,alert,console,appGlobals */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/string",
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "dojo/_base/Color",
    "widgets/baseMapGallery/baseMapGallery",
    "widgets/legends/legends",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/dijit/HomeButton",
    "dojo/topic",
    "esri/urlUtils",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ImageParameters",
    "esri/layers/OpenStreetMapLayer",
    "esri/tasks/FeatureSet",
    "esri/tasks/ServiceAreaTask",
    "esri/tasks/ServiceAreaParameters",
    "esri/tasks/NATypes",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "dojo/_base/array",
    "dojo/promise/all",
    "dojo/_base/Deferred",
    "widgets/infoWindow/infoWindow",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, esriUtils, on, dom, domAttr, query, Query, QueryTask, domClass, _WidgetBase, sharedNls, string, esriMap, FeatureLayer, GraphicsLayer, Graphic, Color, BaseMapGallery, Legends, GeometryExtent, Point, HomeButton, topic, urlUtils, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, ImageParameters, OpenStreetMapLayer, FeatureSet, ServiceAreaTask, ServiceAreaParameters, NATypes, SimpleFillSymbol, SimpleLineSymbol, array, all, Deferred, InfoWindow) {
    //========================================================================================================================//
    return declare([_WidgetBase], {
        map: null,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        sharedNls: sharedNls,
        stagedSearch: null,
        logoContainer: null,
        infoWindowPanel: null,
        operationalLayers: [],
        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            /**
            * set map extent to default extent specified in configuration file
            * @param {string} appGlobals.configData.DefaultExtent Default extent of map specified in configuration file
            */
            urlUtils.addProxyRule({
                urlPrefix: appGlobals.configData.ServiceAreaTask,
                proxyUrl: appGlobals.configData.ProxyUrl
            });
            appGlobals.extentShared = 0;
            this.logoContainer = (query(".map .logo-sm") && query(".map .logo-sm")[0]) || (query(".map .logo-med") && query(".map .logo-med")[0]);

            this.infoWindowPanel = new InfoWindow({ infoWindowWidth: appGlobals.configData.InfoPopupWidth, infoWindowHeight: appGlobals.configData.InfoPopupHeight });
            topic.subscribe("clearFeatureList", lang.hitch(this, function () {
                this._clearSelectedFeature();
            }));
            this._updateMapOnSwitchWorkflow();
            topic.subscribe("SliderChange", lang.hitch(this, function () {
                this._createServiceArea();
            }));
            topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {
                this._onSetInfoWindowPosition(infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
            }));
            topic.subscribe("initializeWebmap", lang.hitch(this, function () {
                this._initializeWebmap();
            }));
            topic.subscribe("loadBasemapToggleWidget", lang.hitch(this, function () {
                this._updateMapOnSwitchWorkflow();
            }));
            topic.subscribe("showInfoWindowOnMap", lang.hitch(this, function (point) {
                this._showInfoWindowOnMap(point);
            }));
            topic.subscribe("setMapTipPosition", lang.hitch(this, function () {
                this._onSetMapTipPosition();
            }));
        },

        /**
        * update workflow on switching
        * @memberOf widgets/mapSettings/mapSettings
        */
        _updateMapOnSwitchWorkflow: function () {
            var extentPoints, graphicsLayer, home, layer, i;
            extentPoints = appGlobals.configData && appGlobals.configData.DefaultExtent && appGlobals.configData.DefaultExtent.split(",");
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            if (this.map) {
                this.map.destroy();
                this.map = null;
            }
            this.map = esriMap("esriCTParentDivContainer", {});
            /**
            * load esri 'Home Button' widget
            */
            home = this._addHomeButton();
            this.map.on("load", lang.hitch(this, function () {
                var mapDefaultExtent, extent;
                extent = this._getQueryString('extent');
                if (extent === "") {
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    this.map.setExtent(mapDefaultExtent);
                } else {
                    mapDefaultExtent = decodeURIComponent(extent).split(',');
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    this.map.setExtent(mapDefaultExtent);
                }
                this.map.addLayer(graphicsLayer);
                domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                home.extent = mapDefaultExtent;
                home.startup();
                //do not display basemap toggle if only one basemap is found
                if (appGlobals.configData.BaseMapLayers.length > 1) {
                    this._showBasMapGallery();
                }
                topic.publish("setMap", this.map);
                this._activateMapEvents();
                if (appGlobals.workFlowIndex && appGlobals.workFlowIndex !== "") {
                    topic.publish("loadingIndicatorHandler");
                    this._addLogoUrl();
                    this._addOperationalLayer();
                }
            }), function (err) {
                domStyle.set(dom.byId("esriCTParentDivContainer"), "display", "none");
                alert(err.message);
            });
            //add default basemap on map
            appGlobals.shareOptions.selectedBasemapIndex = 0;
            if (!appGlobals.configData.BaseMapLayers[0].length) {
                //check if basemap type is openStreet map
                if (appGlobals.configData.BaseMapLayers[0].layerType === "OpenStreetMap") {
                    layer = new OpenStreetMapLayer({ id: "defaultBasemap", visible: true });
                } else {
                    layer = new ArcGISTiledMapServiceLayer(appGlobals.configData.BaseMapLayers[0].MapURL, { id: "defaultBasemap", visible: true });
                }
                this.map.addLayer(layer, 0);
            } else {
                //add multilayer basemap on map
                for (i = 0; i < appGlobals.configData.BaseMapLayers[0].length; i++) {
                    layer = new ArcGISTiledMapServiceLayer(appGlobals.configData.BaseMapLayers[0][i].MapURL, { id: "defaultBasemap" + i, visible: true });
                    this.map.addLayer(layer, i);
                }
            }
        },

        /**
        * activate events on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _activateMapEvents: function () {
            this.map.on("click", lang.hitch(this, function (evt) {
                topic.publish("loadingIndicatorHandler");
                this._showInfoWindowOnMap(evt.mapPoint);
            }));
            this.map.on("extent-change", lang.hitch(this, function () {
                //set infowindow position on extent change
                this._onSetMapTipPosition();
            }));
        },

        /**
        * create service area on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createServiceArea: function () {
            var _self = this, params, features, facilities, serviceAreaTask;
            topic.publish("loadingIndicatorHandler");
            params = new ServiceAreaParameters();
            if (appGlobals.shareOptions.driveTime) {
                params.defaultBreaks = [appGlobals.shareOptions.sliderValue];
            } else {
                params.defaultBreaks = [appGlobals.shareOptions.sliderValue / 10];
            }
            params.outSpatialReference = this.map.spatialReference;
            params.returnFacilities = false;
            params.outputPolygons = NATypes.OutputPolygon.SIMPLIFIED;
            params.impedanceAttribute = "TravelTime";
            params.trimOuterPolygon = true;
            params.trimPolygonDistance = 200;
            params.trimPolygonDistanceUnits = "esriNAUMeters";
            features = [];
            if (appGlobals.shareOptions.addressLocation.geometry.type === "polygon") {
                features.push(new Graphic(appGlobals.shareOptions.addressLocation.geometry.getCentroid()));
            } else {
                features.push(appGlobals.shareOptions.addressLocation);
            }
            facilities = new FeatureSet();
            facilities.features = features;
            params.facilities = facilities;
            serviceAreaTask = new ServiceAreaTask(appGlobals.configData.ServiceAreaTask);
            serviceAreaTask.solve(params, function (solveResult) {
                var polygonSymbol;
                //create graphic symbol for service area polygon
                polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    new Color([parseInt(appGlobals.configData.DriveTimePolygonSymbology.LineSymbolColor.split(",")[0], 10),
                                         parseInt(appGlobals.configData.DriveTimePolygonSymbology.LineSymbolColor.split(",")[1], 10),
                                         parseInt(appGlobals.configData.DriveTimePolygonSymbology.LineSymbolColor.split(",")[2], 10),
                                         parseFloat(appGlobals.configData.DriveTimePolygonSymbology.LineSymbolTransparency.split(",")[0], 10)]), 1), new Color([parseInt(appGlobals.configData.DriveTimePolygonSymbology.FillSymbolColor.split(",")[0], 10), parseInt(appGlobals.configData.DriveTimePolygonSymbology.FillSymbolColor.split(",")[1], 10), parseInt(appGlobals.configData.DriveTimePolygonSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(appGlobals.configData.DriveTimePolygonSymbology.FillSymbolTransparency.split(",")[0], 10)]));
                array.forEach(solveResult.serviceAreaPolygons, function (serviceArea) {
                    _self.serviceAreaGraphic = serviceArea;
                    serviceArea.geometry.spatialReference = _self.map.spatialReference;
                    serviceArea.setSymbol(polygonSymbol);
                    _self.map.getLayer(_self.tempGraphicsLayerId).clear();
                    _self.map.getLayer(_self.tempGraphicsLayerId).add(serviceArea);
                    _self.map.getLayer(_self.tempGraphicsLayerId).add(appGlobals.shareOptions.addressLocation);
                    _self._selectFeatures(serviceArea);
                });
            }, function (err) {
                console.log(err);
                topic.publish("hideLoadingIndicatorHandler");
            });
        },

        /**
        * find features on selection
        * @memberOf widgets/mapSettings/mapSettings
        */
        _selectFeatures: function (bufferGeometry) {
            var deferredArray, selectedFeaturesGroup, layerSearchSetting, dateObj, i;

            if (!appGlobals.extentShared) {
                this.map.setExtent(bufferGeometry.geometry.getExtent().expand(2));
            } else {
                appGlobals.extentShared--;
            }
            deferredArray = [];
            selectedFeaturesGroup = [];
            this._clearSelectedFeature();
            layerSearchSetting = appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings;

            array.forEach(this.operationalLayers, lang.hitch(this, function (featureResult) {
                var queryFeature, featureLayer, deferred;
                queryFeature = new Query();
                featureLayer = featureResult;
                queryFeature.geometry = bufferGeometry.geometry;
                queryFeature.maxAllowableOffset = 500;
                queryFeature.outSpatialReference = this.map.spatialReference;
                if (appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId) {
                    featureLayer = featureLayer.layerObject;
                }
                dateObj = new Date().getTime().toString();
                queryFeature.where = dateObj + "=" + dateObj;
                deferred = new Deferred();
                featureLayer.selectFeatures(queryFeature, FeatureLayer.SELECTION_NEW, lang.hitch(this, function (result) {
                    var searchConfigSetting = {}, index, selectedFeatures = [];
                    try {
                        searchConfigSetting = layerSearchSetting[featureResult.searchSettingIndex];
                        if (result.length && searchConfigSetting) {
                            for (i = 0; i < result.length; i++) {
                                for (index in result[i].attributes) {
                                    if (result[i].attributes.hasOwnProperty(index)) {
                                        if (!result[i].attributes[index] && result[i].attributes[index] !== 0) {
                                            result[i].attributes[index] = appGlobals.configData.ShowNullValueAs;
                                        }
                                    }
                                }
                                selectedFeatures.push({
                                    attribute: result[i].attributes,
                                    name: searchConfigSetting.SearchDisplayTitle,
                                    geometry: result[i].geometry,
                                    layerIndex: searchConfigSetting.index,
                                    fields: result[0].getLayer().fields,
                                    featureName: searchConfigSetting.SearchDisplayFields ? string.substitute(searchConfigSetting.SearchDisplayFields, result[i].attributes) : appGlobals.configData.ShowNullValueAs
                                });
                            }
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                    deferred.resolve(selectedFeatures);
                }), lang.hitch(this, function (err) {
                    console.log(err);
                    deferred.resolve();
                }));
                deferredArray.push(deferred);
            }));
            all(deferredArray).then(lang.hitch(this, function (result) {
                for (i = 0; i < result.length; i++) {
                    if (result[i] && result[i].length) {
                        selectedFeaturesGroup.push(result[i]);
                    }
                }
                if (query(".esriCTAddressHolder")[0] && selectedFeaturesGroup.length > 0) {
                    if (query(".esriCTHeaderSearch")[0]) {
                        domClass.replace(query(".esriCTHeaderSearch")[0], "esriCTHeaderSearch-select", "esriCTHeaderSearch");
                    }
                    domClass.replace(query(".esriCTAddressHolder")[0], "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                    domClass.replace(query(".esriCTAddressHolder")[0], "esriCTFullHeight", "esriCTAddressContentHeight");
                }
                topic.publish("_createList", selectedFeaturesGroup);
            }));
        },

        /**
        * clear features from map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _clearSelectedFeature: function () {
            if (appGlobals.workFlowIndex && lang.trim(appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId) === "") {
                array.forEach(this.operationalLayers, lang.hitch(this, function (featureLayer) {
                    if (!featureLayer.layerObject) {
                        featureLayer.clearSelection();
                    }
                }));
            }
            if (this.infoWindowPanel.isShowing && !appGlobals.sharedInfowindow) {
                topic.publish("hideInfoWindow");
            }
            appGlobals.sharedInfowindow = false;
        },

        /**
        * add operational layers on map from config file
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addOperationalLayer: function () {
            var i, j, deferDynamicArr = [], configOperationalLayers;
            this._clearSelectedFeature();
            if (this.map.getLayer(this.tempGraphicsLayerId)) {
                this.map.getLayer(this.tempGraphicsLayerId).clear();
            }
            i = 0;
            while (i < this.map.graphicsLayerIds.length) {
                if (this.map.graphicsLayerIds[i] && (this.map.graphicsLayerIds[i].match(/feature/g) || this.map.graphicsLayerIds[i].match(/EconomicDevelopment/g))) {
                    this.map.removeLayer(this.map.getLayer(this.map.graphicsLayerIds[i]));
                } else {
                    i++;
                }
            }
            //empty opeartionLayer array to add layers configured for selected workflow
            this.operationalLayers = [];
            if (appGlobals.workFlowIndex && appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId === "") {
                configOperationalLayers = appGlobals.configData.Workflows[appGlobals.workFlowIndex].OperationalLayers;
                for (i = 0; i < configOperationalLayers.length; i++) {
                    //check if LoadAsService type is feature or dynamic
                    if (configOperationalLayers[i].LoadAsServiceType.toLowerCase() === "feature") {
                        deferDynamicArr.push(this._addFeatureLayerOnMap(configOperationalLayers[i].ServiceURL, true, null));
                    } else if (configOperationalLayers[i].LoadAsServiceType.toLowerCase() === "dynamic") {
                        this._addServiceLayers(deferDynamicArr, configOperationalLayers[i].ServiceURL);
                    }
                }
                all(deferDynamicArr).then(lang.hitch(this, function (result) {
                    var defer, layerURL, defArray = [];
                    for (i = 0; i < result.length; i++) {
                        if (result[i]) {
                            //check if response is a map server
                            if (result[i].layerInfos) {
                                for (j = 0; j < result[i].layerInfos.length; j++) {
                                    layerURL = result[i].url + result[i].layerInfos[j].id;
                                    defArray.push(this._addFeatureLayerOnMap(layerURL, result[i].loadOnMap, result[i].serviceTitle));
                                }
                            } else {
                                //add feature layer response to deferArray to get all layer in sequence
                                defer = new Deferred();
                                defArray.push(defer);
                                defer.resolve(result[i]);
                            }
                        }
                    }
                    //set layer data when all layer gets loaded
                    this._setAllLayerData(defArray);
                }));
            }
        },

        /**
        * store layer data
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setAllLayerData: function (defArray) {
            all(defArray).then(lang.hitch(this, function (result) {
                var i, layerDetails, layerDataArr = [], layerId, layerTitle, searchSetting, mapSearchSettings = [];
                for (i = 0; i < result.length; i++) {
                    if (result[i]) {
                        //reorder layer to display point features over the polygon graphic
                        if (result[i].geometryType === "esriGeometryPoint") {
                            this.map.reorderLayer(result[i], this.map.graphicsLayerIds.length - 1);
                        }
                        //fetch layer id of the layer
                        layerId = result[i].url.split('/');
                        layerId = layerId[layerId.length - 1];
                        //fetch layer name
                        layerTitle = result[i].title;
                        //check if search setting is configured for this layer
                        searchSetting = this._getConfigSearchSetting(layerTitle, layerId);
                        if (searchSetting) {
                            //set QueryUrl for layer's respective search Configuration
                            searchSetting.QueryURL = result[i].url;
                            result[i].searchSettingIndex = mapSearchSettings.length;
                            searchSetting.index = i;
                            searchSetting.objectIDField = result[i].objectIdField;
                            mapSearchSettings.push(searchSetting);
                            if (!result[i].isMapServerLayer) {
                                //add layer to global array
                                this.operationalLayers.push(result[i]);
                            }
                        }
                        layerDetails = {};
                        layerDetails = this._getConfigInfoData(layerTitle, layerId);
                        layerDetails.layer = result[i];
                        layerDetails.InfoQueryURL = result[i].url;
                        layerDetails.index = i;
                        //check if layer has attachments
                        if (result[i].hasAttachments) {
                            layerDetails.showAttachments = true;
                        }
                        if (layerDetails.ShowAllFields && layerDetails.ShowAllFields.toLowerCase() === "true") {
                            this._getLayerFields(result[i], layerDetails);
                        }
                        layerDataArr.push(layerDetails);
                    }
                }
                //update configured infowindow setting
                appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings = layerDataArr;
                //update configured search setting
                appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings = mapSearchSettings;
                this._onAllOperationalLayerLoaded(layerDataArr);
            }));
        },

        /**
        * add layer on map as feature layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addFeatureLayerOnMap: function (layerUrl, isAddOnMap, mapServerTitle) {
            var featureLayer, defer = new Deferred();
            //add layer on map as a feature service
            featureLayer = new FeatureLayer(layerUrl, {
                mode: FeatureLayer.MODE_SELECTION,
                outFields: ["*"],
                maxAllowableOffset: 250,
                displayOnPan: true
            });
            if (isAddOnMap) {
                this.map.addLayer(featureLayer);
            }
            //get layer data when layer gets loaded
            on(featureLayer, "load", function (evt) {
                if (!isAddOnMap) {
                    evt.layer.visibleAtMapScale = true;
                    evt.layer.isMapServerLayer = true;
                }
                evt.layer.title = mapServerTitle || evt.layer.name;
                defer.resolve(evt.layer);
            }, function () {
                defer.resolve();
            });
            return defer;
        },

        /**
        * perform operation when all layer gets loaded
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onAllOperationalLayerLoaded: function (layerDataArr) {
            //initialize legend widget when all layer gets loaded
            this._addLayerLegend(layerDataArr);
            if (appGlobals.share) {
                topic.publish("locateAddressOnMap");
            }
            topic.publish("hideLoadingIndicatorHandler");
        },

        /**
        * get layer field info
        * @param {object} layer
        * @param {object} layerInfoSetting
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getLayerFields: function (layer, layerInfoSetting) {
            var i;
            layerInfoSetting.InfoWindowData = [];
            for (i = 0; i < layer.fields.length; i++) {
                //set format of infoWindow fields
                layerInfoSetting.InfoWindowData.push({
                    "DisplayText": layer.fields[i].alias + ":",
                    "FieldName": "${" + layer.fields[i].name + "}",
                    "format": layer.fields[i].format
                });
            }
        },

        /**
        * check if the operational layer is of dynamic service or hosted service type
        * @param {object} deferDynamicArr defer array
        * @param {object} layerURL operation layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addServiceLayers: function (deferDynamicArr, layerURL) {
            var dynamicLayerURL, imageParams, lastIndex, dynamicLayerId;
            imageParams = new ImageParameters();
            imageParams.format = "png32";
            lastIndex = array.lastIndexOf(layerURL, '/');
            dynamicLayerId = layerURL.substr(lastIndex + 1);
            if (isNaN(dynamicLayerId) || dynamicLayerId === "") {
                if (isNaN(dynamicLayerId)) {
                    dynamicLayerURL = layerURL + "/";
                } else if (dynamicLayerId === "") {
                    dynamicLayerURL = layerURL;
                }
                if (layerURL.match(/FeatureServer/gi)) {
                    deferDynamicArr.push(this._addHostedServices(dynamicLayerURL));
                } else {
                    deferDynamicArr.push(this._createDynamicServiceLayer(dynamicLayerURL, imageParams));
                }
            } else {
                imageParams.layerIds = [dynamicLayerId];
                dynamicLayerURL = layerURL.substring(0, lastIndex + 1);
                if (layerURL.match(/FeatureServer/gi)) {
                    deferDynamicArr.push(this._addHostedServices(dynamicLayerURL));
                } else {
                    deferDynamicArr.push(this._createDynamicServiceLayer(dynamicLayerURL, imageParams));
                }
            }
        },

        /**
        * load hosted services layer to the map
        * @param {object} layerURL operation layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHostedServices: function (layerURL) {
            var defer, featureLayerURL, serviceTitle, layerObj = {};
            defer = new Deferred();
            featureLayerURL = layerURL.split("/");
            serviceTitle = featureLayerURL[featureLayerURL.length - 3];
            esri.request({
                url: layerURL + "?f=json",
                load: function (data) {
                    layerObj.url = layerURL;
                    layerObj.layerInfos = data.layers;
                    layerObj.loadOnMap = true;
                    layerObj.serviceTitle = serviceTitle;
                    defer.resolve(layerObj);
                },
                error: function () {
                    defer.resolve();
                }
            });
            return defer;
        },

        /**
        * load dynamic service layer to the map
        * @param {object} dynamicLayer operation layer to be added on map
        * @param {object} imageParams operation layer image parameters
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createDynamicServiceLayer: function (dynamicLayer, imageParams) {
            var dynamicMapService, layerURL, serviceTitle, defer = new Deferred();
            layerURL = dynamicLayer.split("/");
            serviceTitle = layerURL[layerURL.length - 3];
            dynamicMapService = new ArcGISDynamicMapServiceLayer(dynamicLayer, {
                imageParameters: imageParams
            });
            this.map.addLayer(dynamicMapService);
            dynamicMapService.on("load", lang.hitch(this, function (evt) {
                evt.layer.serviceTitle = serviceTitle;
                defer.resolve(evt.layer);
            }), function () {
                defer.resolve();
            });
            return defer;
        },

        /**
        * update infowindow content when it's position is set on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onSetInfoWindowPosition: function (infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {
            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
            this.infoWindowPanel.hide();
            this.infoWindowPanel.setTitle(infoTitle);
            domStyle.set(query(".esriCTinfoWindow")[0], "visibility", "visible");
            this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
            appGlobals.shareOptions.infoWindowIsShowing = true;
            this._onSetMapTipPosition(screenPoint);
        },

        /**
        * add logo on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLogoUrl: function () {
            var CustomLogoUrl = appGlobals.configData.LogoURL, imgSource;
            if (CustomLogoUrl && lang.trim(CustomLogoUrl).length !== 0) {
                if (CustomLogoUrl.match("http:") || CustomLogoUrl.match("https:")) {
                    imgSource = CustomLogoUrl;
                } else {
                    imgSource = dojoConfig.baseURL + CustomLogoUrl;
                }
                if (!query('.esriCTMapLogo')[0]) {
                    domConstruct.create("img", { "src": imgSource, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
                }
                if (!appGlobals.configData.ShowLegend) {
                    domStyle.set(query('.esriCTMapLogo')[0], "bottom", "5px");
                }
            }
        },

        /**
        * load esri 'Home Button' widget which sets map extent to default extent
        * @return {object} Home button widget
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHomeButton: function () {
            var home = new HomeButton({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return home;
        },

        /**
        * initialize basemap gallery
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showBasMapGallery: function () {
            if (this.basMapGallery) {
                this.basMapGallery.destroy();
            }
            this.basMapGallery = new BaseMapGallery({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return this.basMapGallery;
        },

        /**
        * initialize legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLegendBox: function () {
            if (this.legendObject) {
                this.legendObject.destroy();
            }
            this.legendObject = new Legends({
                map: this.map,
                isExtentBasedLegend: false
            }, domConstruct.create("div", {}, null));
            return this.legendObject;
        },

        /**
        * add operational layers to legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegend: function (opLayers) {
            var mapServerArray = [], legendObject, i;
            if (appGlobals.configData.ShowLegend) {
                if (query(".esriControlsBR")[0]) {
                    domClass.add(query(".esriControlsBR")[0], "esriLogoLegend");
                }
                for (i = 0; i < opLayers.length; i++) {
                    if (opLayers[i].layer.url) {
                        mapServerArray.push({ "url": opLayers[i].layer.url, "title": opLayers[i].layer.name });
                    }
                }
                legendObject = this._addLegendBox();
                legendObject.startup(mapServerArray, null, this.map.extent);
                topic.publish("setMaxLegendLength");
            }
        },

        /**
        * clear graphics from map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _clearMapGraphics: function () {
            if (this.map.getLayer(this.tempGraphicsLayerId)) {
                this.map.getLayer(this.tempGraphicsLayerId).clear();
            }
            this._clearSelectedFeature();
            this.infoWindowPanel.hide();
            topic.publish("resetLocatorContainer");
        },

        /**
        * get map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        },

        /**
        * get query string
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getQueryString: function (key) {
            var _default, regex, qs;
            if (!_default) {
                _default = "";
            }
            key = key.replace(/[\[]/, "\\").replace(/[\]]/, "\\");
            regex = new RegExp("[\\$&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (!qs) {
                return _default;
            }
            return qs[1];
        },

        /**
        * initialize webmap
        * @memberOf widgets/mapSettings/mapSettings
        */
        _initializeWebmap: function () {
            if (this.map) {
                this.map.destroy();
            }
            var mapDeferred = esriUtils.createMap(appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId, "esriCTParentDivContainer", {
                mapOptions: {
                    slider: true,
                    showAttribution: false
                },
                ignorePopups: true
            });
            mapDeferred.then(lang.hitch(this, function (response) {
                var extent, mapDefaultExtent, home, graphicsLayer;
                this.map = null;
                this.map = response.map;
                appGlobals.shareOptions.selectedBasemapIndex = null;
                if (response.itemInfo.itemData.baseMap.baseMapLayers) {
                    this._setBasemapLayerId(response.itemInfo.itemData.baseMap.baseMapLayers);
                }
                topic.publish("filterRedundantBasemap", response.itemInfo);
                graphicsLayer = new GraphicsLayer();
                graphicsLayer.id = this.tempGraphicsLayerId;
                this.map.addLayer(graphicsLayer);
                this.map.reorderLayer(graphicsLayer, this.map.graphicsLayerIds.length - 1);
                //set default extent for webmap
                extent = this._getQueryString('extent');
                if (extent !== "") {
                    mapDefaultExtent = decodeURIComponent(extent).split(',');
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    this.map.setExtent(mapDefaultExtent);
                } else {
                    mapDefaultExtent = this.map.extent;
                }
                this._addLogoUrl();
                home = this._addHomeButton();
                topic.publish("setMap", this.map);
                domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
                //set default extent to home extent
                home.extent = mapDefaultExtent;
                home.startup();
                this._activateMapEvents();
                this._getLayerDetails(response.itemInfo.itemData.operationalLayers);
                //do not display basemap toggle if no basemap is found
                if (appGlobals.configData.BaseMapLayers.length > 0) {
                    this._showBasMapGallery();
                }
            }), function (err) {
                //hide parent container if webmap fails to load and display alert message
                domStyle.set(dom.byId("esriCTParentDivContainer"), "display", "none");
                alert(err.message);
            });
        },

        /**
        * create list of webmap edited and non edited layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createWebmapLegendLayerList: function (operationalLayersData) {
            var i, webMapLayers = [], webmapLayerList = {}, hasLayers = false;
            for (i = 0; i < operationalLayersData.length; i++) {
                //check if layer renderer is updated from webmap
                if (operationalLayersData[i].layer.layerDefinition && operationalLayersData[i].layer.layerDefinition.drawingInfo) {
                    webmapLayerList[operationalLayersData[i].layer.url] = operationalLayersData[i].layer;
                    hasLayers = true;
                } else {
                    webMapLayers.push(operationalLayersData[i].layer);
                }
            }
            this._addLayerLegendWebmap(webMapLayers, webmapLayerList, hasLayers);
        },

        /**
        * create layer list for legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegendWebmap: function (webMapLayers, webmapLayerList, hasLayers) {
            var mapServerArray = [], i, j, legendObject, layer;
            for (j = 0; j < webMapLayers.length; j++) {
                if (webMapLayers[j].layerObject) {
                    //if layer is a map/feature server
                    if (webMapLayers[j].layers) {
                        for (i = 0; i < webMapLayers[j].layers.length; i++) {
                            layer = webMapLayers[j].url + "/" + webMapLayers[j].layers[i].id;
                            if (webMapLayers[j].layers[i].layerDefinition && webMapLayers[j].layers[i].layerDefinition.drawingInfo) {
                                //set hasLayers flag to true, if any of webmap layer's renderer is edited
                                hasLayers = true;
                                webmapLayerList[layer] = webMapLayers[j].layers[i];
                            } else {
                                mapServerArray.push({ "url": layer, "title": webMapLayers[j].layers[i].name });
                            }
                        }
                    } else if (webMapLayers[j].layerObject.layerInfos) {
                        //if webmap has no edited layers
                        for (i = 0; i < webMapLayers[j].layerObject.layerInfos.length; i++) {
                            layer = webMapLayers[j].url + "/" + webMapLayers[j].layerObject.layerInfos[i].id;
                            mapServerArray.push({ "url": layer, "title": webMapLayers[j].layerObject.layerInfos[i].name });
                        }
                    } else {
                        mapServerArray.push({ "url": webMapLayers[j].url, "title": webMapLayers[j].title });
                    }
                } else {
                    mapServerArray.push({ "url": webMapLayers[j].url, "title": webMapLayers[j].title });
                }
            }
            //check if any webmap layer symbol is changed
            if (!hasLayers) {
                webmapLayerList = null;
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray, webmapLayerList, this.map.extent);
            topic.publish("setMaxLegendLength");
        },

        /**
        * set default id for basemaps
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapLayerId: function (baseMapLayers) {
            var i = 0, defaultId = "defaultBasemap";
            //check if current basemap has multi layers or not
            if (baseMapLayers.length === 1) {
                this._setBasemapId(baseMapLayers[0], defaultId);
            } else {
                for (i = 0; i < baseMapLayers.length; i++) {
                    this._setBasemapId(baseMapLayers[i], defaultId + i);
                }
            }
        },

        /**
        * set default id for each basemap of webmap
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapId: function (basmap, defaultId) {
            var layerIndex;
            //set default id for selected basemap
            this.map.getLayer(basmap.id).id = defaultId;
            this.map._layers[defaultId] = this.map.getLayer(basmap.id);
            layerIndex = array.indexOf(this.map.layerIds, basmap.id);
            //check if selected base has different basemap id
            if (defaultId !== basmap.id) {
                delete this.map._layers[basmap.id];
            }
            this.map.layerIds[layerIndex] = defaultId;
        },

        /**
        * fetch details of web map operational layers and generate settings
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getLayerDetails: function (operationalLayers) {
            var i, defer, deferArray = [], layerDetails, operationalLayersData = [], mapServerData;
            topic.publish("loadingIndicatorHandler");
            for (i = 0; i < operationalLayers.length; i++) {
                if (operationalLayers[i].visibility && operationalLayers[i].layerObject) {
                    mapServerData = operationalLayers[i].resourceInfo.layers || operationalLayers[i].layerObject.layerInfos;
                    if (mapServerData) {
                        //get layer object of layers
                        this._getDynamicLayerInfo(operationalLayers[i], mapServerData, deferArray);
                    } else {
                        defer = new Deferred();
                        deferArray.push(defer);
                        defer.resolve(operationalLayers[i]);
                    }
                    //reorder layer to display point features over the polygon graphic
                    if (operationalLayers[i].layerObject.geometryType === "esriGeometryPoint") {
                        this.map.reorderLayer(operationalLayers[i].layerObject, this.map.graphicsLayerIds.length - 1);
                    }
                }
            }
            all(deferArray).then(lang.hitch(this, function (results) {
                for (i = 0; i < results.length; i++) {
                    if (results[i]) {
                        layerDetails = {};
                        //fetch infoPopup data from layer
                        layerDetails = this._getLayerPopupInfo(results[i]);
                        //set index to access layer from global array
                        layerDetails.layer = results[i];
                        layerDetails.index = i;
                        operationalLayersData.push(layerDetails);
                    }
                }
                this._onGetAllLayerDetails(operationalLayersData);
            }));
        },

        /**
        * set infoPopup setting for webmap layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getLayerPopupInfo: function (operationalLayer) {
            var infoWindowSettingObj = {}, i, urlstr;
            //check if popup configuration is enabled for the layer
            if (operationalLayer.popupInfo) {
                //set layer title
                infoWindowSettingObj.Title = operationalLayer.title;
                infoWindowSettingObj.InfoQueryURL = operationalLayer.url;
                urlstr = operationalLayer.url.split('/');
                infoWindowSettingObj.QueryLayerId = urlstr[urlstr.length - 1];
                //get configured popup title
                infoWindowSettingObj.InfoWindowHeaderField = operationalLayer.popupInfo.title;

                if (operationalLayer.popupInfo.description) {
                    //set hasDescription flag to true if popup is customized
                    infoWindowSettingObj.hasDescription = true;
                } else {
                    infoWindowSettingObj.InfoWindowData = [];
                    //get all visible webmap configured popup fields
                    for (i in operationalLayer.popupInfo.fieldInfos) {
                        if (operationalLayer.popupInfo.fieldInfos.hasOwnProperty(i)) {
                            if (operationalLayer.popupInfo.fieldInfos[i].visible) {
                                //set format of infoWindow fields
                                infoWindowSettingObj.InfoWindowData.push({
                                    "DisplayText": operationalLayer.popupInfo.fieldInfos[i].label + ":",
                                    "FieldName": "${" + operationalLayer.popupInfo.fieldInfos[i].fieldName + "}",
                                    "format": operationalLayer.popupInfo.fieldInfos[i].format
                                });
                            }
                        }
                    }
                }
                //check if layer has attachments and showAttachments flag is set to true in popup configuration
                if (operationalLayer.layerObject.hasAttachments && operationalLayer.popupInfo.showAttachments) {
                    infoWindowSettingObj.showAttachments = true;
                }
            }
            return infoWindowSettingObj;
        },

        /**
        * get details from dynamic Operation Layers
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getDynamicLayerInfo: function (operationalLayer, mapServerData, deferArray) {
            var url, layerUrl, i, operationalLayerObj = {};
            url = operationalLayer.url;
            for (i = 0; i < mapServerData.length; i++) {
                //check visibility of operational layer
                if (array.indexOf(operationalLayer.layerObject.visibleLayers, mapServerData[i].id) !== -1) {
                    operationalLayerObj = this._getLayerObject(operationalLayer, mapServerData[i]);
                    operationalLayerObj.title = mapServerData[i].name;
                    layerUrl = url + "/" + mapServerData[i].id;
                    deferArray.push(this._loadFeatureLayer(layerUrl, operationalLayerObj));
                }
            }
        },

        /**
        * get layer object info
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getLayerObject: function (operationalLayer, layerData) {
            var i;
            for (i = 0; i < operationalLayer.layers.length; i++) {
                if (operationalLayer.layers[i].id === layerData.id) {
                    layerData = operationalLayer.layers[i];
                    break;
                }
            }
            return layerData;
        },

        /**
        * Load feature layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _loadFeatureLayer: function (layerUrl, layerObject) {
            var featureLayer, layerObjectParam = {}, defer = new Deferred();
            featureLayer = new FeatureLayer(layerUrl);
            on(featureLayer, "load", lang.hitch(this, function (evt) {
                layerObjectParam = layerObject;
                if (!layerObjectParam.title) {
                    layerObjectParam.title = evt.layer.name;
                }
                layerObjectParam.layerObject = evt.layer;
                layerObjectParam.url = evt.layer.url;
                layerObject.layerObject.visibleAtMapScale = true;
                layerObject.layerObject.isMapServerLayer = true;
                defer.resolve(layerObjectParam);
            }), function () {
                defer.resolve();
            });
            return defer;
        },

        /**
        * perform required operation when data is fetched for all the layers
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onGetAllLayerDetails: function (operationalLayersData) {
            //update infoWindow setting
            appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings = operationalLayersData;
            //add layer url in layer's configured search setting
            this._setLayerSearchSetting(operationalLayersData);
            //check legend visibility in config
            if (appGlobals.configData.ShowLegend) {
                this._createWebmapLegendLayerList(operationalLayersData);
                if (query(".esriControlsBR")[0]) {
                    domClass.add(query(".esriControlsBR")[0], "esriLogoLegend");
                }
            }
            if (appGlobals.share) {
                topic.publish("locateAddressOnMap");
            }
            topic.publish("hideLoadingIndicatorHandler");
        },

        /**
        * set search setting configuration for webmap layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setLayerSearchSetting: function (opLayersData) {
            var configSearchSettings, i, j, layerTitle, urlstr, layerId;
            configSearchSettings = appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings;
            this.operationalLayers = [];
            for (i = 0; i < configSearchSettings.length; i++) {
                for (j = 0; j < opLayersData.length; j++) {
                    //get layer title
                    layerTitle = opLayersData[j].layer.title;
                    //fetch layer id
                    urlstr = opLayersData[j].layer.url.split('/');
                    layerId = urlstr[urlstr.length - 1];
                    //check if search setting is configured for this layer
                    if (configSearchSettings[i].Title === layerTitle && configSearchSettings[i].QueryLayerId === layerId) {
                        //set QueryURL for layer if its's search configuration is available
                        configSearchSettings[i].QueryURL = opLayersData[j].layer.url;
                        opLayersData[j].layer.searchSettingIndex = i;
                        configSearchSettings[i].index = j;
                        configSearchSettings[i].objectIDField = opLayersData[j].layer.layerObject.objectIdField;
                        if (!opLayersData[j].layer.isMapServerLayer) {
                            this.operationalLayers.push(opLayersData[j].layer);
                        }
                    }
                }
            }
        },

        /**
        * get infowindow setting from config
        * @param{string} searchKey is layer id to find infowindow setting in config
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getConfigInfoData: function (layerTitle, layerId) {
            var i, infoObj = {}, infoWindowSettings = appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings;
            if (infoWindowSettings) {
                for (i = 0; i < infoWindowSettings.length; i++) {
                    //check if layer title and layer id is configured in infoWindow setting
                    if (infoWindowSettings[i].Title === layerTitle && infoWindowSettings[i].QueryLayerId === layerId) {
                        infoObj = infoWindowSettings[i];
                        break;
                    }
                }
            }
            return infoObj;
        },

        /**
        * get search setting from config
        * @param{string} searchKey is layer id to find search setting in config
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getConfigSearchSetting: function (layerTitle, layerId) {
            var i, configSearchSettings = appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings;
            if (configSearchSettings) {
                for (i = 0; i < configSearchSettings.length; i++) {
                    //check if layer title and layer id is configured in search setting
                    if (configSearchSettings[i].Title === layerTitle && configSearchSettings[i].QueryLayerId === layerId) {
                        return configSearchSettings[i];
                    }
                }
                //return false if search configuration is not available for the layer
                if (i === configSearchSettings.length) {
                    return false;
                }
            } else {
                return false;
            }
        },

        /**
        * show infowindow on map
        * @param{object} mapPoint is location on map to show infowindow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showInfoWindowOnMap: function (mapPoint) {
            var deferredArray = [], featureArray, j, i, configInfowindowSettings = appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings;
            for (i = 0; i < configInfowindowSettings.length; i++) {
                //skip queries for those layers whose infoWindowdata is not available
                if (configInfowindowSettings[i].QueryLayerId) {
                    this._executeQueryTask(configInfowindowSettings[i].layer, mapPoint, deferredArray, i);
                }
            }
            if (deferredArray.length > 0) {
                all(deferredArray).then(lang.hitch(this, function (result) {
                    featureArray = [];
                    //fetch feature data
                    for (j = 0; j < result.length; j++) {
                        if (result[j]) {
                            if (result[j].features.length > 0) {
                                for (i = 0; i < result[j].features.length; i++) {
                                    //add feature details into featureArray
                                    featureArray.push({
                                        attr: result[j].features[i],
                                        layerIndex: result[j].layerIndex,
                                        fields: result[j].fields
                                    });
                                }
                            }
                        }
                    }
                    this._fetchQueryResults(featureArray, mapPoint);
                }));
            } else {
                topic.publish("hideLoadingIndicatorHandler");
            }
        },

        /**
        * execute query task to find infowindow data
        * @param{string} index is layer index in operational layer array
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeQueryTask: function (operationalLayer, mapPoint, deferredArray, index) {
            var esriQuery, queryTask, currentTime, isLayerVisible, deferred;
            //check layer visibility on current map scale
            if (operationalLayer.layerObject) {
                //if layer is webmap operational layer
                isLayerVisible = operationalLayer.layerObject.visibleAtMapScale;
            } else {
                isLayerVisible = operationalLayer.visibleAtMapScale;
            }
            if (isLayerVisible) {
                deferred = new Deferred();
                queryTask = new QueryTask(operationalLayer.url);
                esriQuery = new Query();
                //add time stamp in query param to avoid fetching results from cache
                currentTime = new Date().getTime() + index.toString();
                esriQuery.where = currentTime + "=" + currentTime;
                esriQuery.returnGeometry = true;
                esriQuery.geometry = this._extentFromPoint(mapPoint);
                esriQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                esriQuery.outSpatialReference = this.map.spatialReference;
                esriQuery.outFields = ["*"];
                //execute query task to get features lies in clicked area
                queryTask.execute(esriQuery, lang.hitch(this, function (results) {
                    results.layerIndex = index;
                    deferred.resolve(results);
                }), function () {
                    deferred.resolve();
                });
            }
            deferredArray.push(deferred);
        },

        /**
        * get extent from mappoint
        * @memberOf widgets/mapSettings/mapSettings
        */
        _extentFromPoint: function (point) {
            var screenPoint, sourcePoint, destinationPoint, sourceMapPoint, destinationMapPoint, tolerance = 15;
            screenPoint = this.map.toScreen(point);
            sourcePoint = new Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            destinationPoint = new Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            sourceMapPoint = this.map.toMap(sourcePoint);
            destinationMapPoint = this.map.toMap(destinationPoint);
            return new GeometryExtent(sourceMapPoint.x, sourceMapPoint.y, destinationMapPoint.x, destinationMapPoint.y, this.map.spatialReference);
        },

        /**
        * fetch infowindow data from query task result
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchQueryResults: function (featureArray, mapPoint) {
            var point;
            if (featureArray.length > 0) {
                appGlobals.shareOptions.mapClickedPoint = mapPoint;
                this.count = 0;
                //take feature's geometry if geometry type is point else take map point where map is clicked
                if (featureArray[0].attr.geometry.type !== "point") {
                    point = mapPoint;
                } else {
                    point = featureArray[0].attr.geometry;
                }
                topic.publish("showInfoWindow", point, featureArray, this.count, false);
                if (featureArray.length === 1) {
                    domStyle.set(query(".esriCTdivInfoWindowCarousal")[0], "display", "none");
                    //hide right navigation arrow of infoWindow, if only one feature is found
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    domClass.add(this.infoWindowPanel.divInfoHeaderPanel, "esriCTCarouselHidden");
                } else {
                    domStyle.set(query(".esriCTdivInfoWindowCarousal")[0], "display", "block");
                    domClass.remove(this.infoWindowPanel.divInfoHeaderPanel, "esriCTCarouselHidden");
                    //display pagination on infoWindow header
                    domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                    //attach click event on right and left navigation arrow
                    query(".esriCTdivInfoRightArrow")[0].onclick = lang.hitch(this, function () {
                        this._nextInfoContent(featureArray, point);
                    });
                    query(".esriCTdivInfoLeftArrow")[0].onclick = lang.hitch(this, function () {
                        this._previousInfoContent(featureArray, point);
                    });
                }
            } else {
                topic.publish("hideLoadingIndicatorHandler");
            }
        },

        /**
        * set infowindow anchor position on map
        * @memberOf widgets/locator/locator
        */
        _onSetMapTipPosition: function () {
            if (appGlobals.selectedMapPoint) {
                var screenPoint = this.map.toScreen(appGlobals.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                this.infoWindowPanel.setLocation(screenPoint);
            }
        },

        /**
        * display next page of infowindow on clicking of next arrow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _nextInfoContent: function (featureArray, point) {
            //display next feature info if next arrow is enable
            if (!domClass.contains(query(".esriCTdivInfoRightArrow")[0], "disableArrow")) {
                if (this.count < featureArray.length) {
                    this.count++;
                }
                if (featureArray[this.count]) {
                    //disable right arrow if current displayed feature is the last one in the feature list
                    domClass.add(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                    topic.publish("showInfoWindow", point, featureArray, this.count, true);
                }
            }
        },

        /**
        * display previous page of infowindow on clicking of previous arrow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _previousInfoContent: function (featureArray, point) {
            //display previous feature info if previous arrow is enable
            if (!domClass.contains(query(".esriCTdivInfoLeftArrow")[0], "disableArrow")) {
                if (this.count !== 0 && this.count < featureArray.length) {
                    this.count--;
                }
                if (featureArray[this.count]) {
                    //disable left arrow if current displayed feature is the first one in the feature list
                    domClass.add(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                    topic.publish("showInfoWindow", point, featureArray, this.count, true);
                }
            }
        }
    });
});
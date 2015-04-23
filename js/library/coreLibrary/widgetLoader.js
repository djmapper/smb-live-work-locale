/*global define,dojo,require,console,alert,appGlobals */
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
    "dijit/_WidgetBase",
    "widgets/mapSettings/mapSettings",
    "widgets/appHeader/appHeader",
    "widgets/splashScreen/splashScreen",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/promise/all",
    "esri/request",
    "esri/arcgis/utils",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "dojo/topic",
    "dojo/dom-style",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/dijit/BasemapGallery",
    "dojo/domReady!"
], function (declare, _WidgetBase, Map, AppHeader, SplashScreen, array, lang, Deferred, all, esriRequest, esriUtils, domClass, on, query, topic, domStyle, sharedNls, BasemapGallery) {

    //========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,

        /**
        * load widgets specified in Header Widget Settings of configuration file
        *
        * @class
        * @name coreLibrary/widgetLoader
        */
        startup: function () {
            var widgets, deferredArray, basemapDeferred, map, splashScreen, appUrl, workflow, mapInstance;
            widgets = {};
            appGlobals.share = false;
            deferredArray = [];

            topic.subscribe("filterRedundantBasemap", lang.hitch(this, function (bmLayers) {
                this._removeWorkFlowBasemap();
                this._filterRedundantBasemap(bmLayers, appGlobals.configData.BaseMapLayers, true);
            }));
            this._setWorkflowConfig();
            basemapDeferred = new Deferred();
            this._fetchBasemapCollection(basemapDeferred);
            basemapDeferred.then(lang.hitch(this, function (baseMapLayers) {
                if (baseMapLayers.length === 0) {
                    alert(sharedNls.errorMessages.noBasemap);
                    return;
                }
                appGlobals.configData.BaseMapLayers = baseMapLayers;
                map = new Map();


                mapInstance = this._initializeMap(map);

                /**
                * create an object with widgets specified in Header Widget Settings of configuration file
                * @param {array} appGlobals.configData.AppHeaderWidgets Widgets specified in configuration file
                */
                array.forEach(appGlobals.configData.AppHeaderWidgets, function (widgetConfig, index) {
                    var deferred = new Deferred();
                    widgets[widgetConfig.WidgetPath] = null;
                    require([widgetConfig.WidgetPath], function (Widget) {
                        widgets[widgetConfig.WidgetPath] = new Widget({ map: widgetConfig.MapInstanceRequired ? mapInstance : undefined, title: widgetConfig.Title });
                        deferred.resolve(widgetConfig.WidgetPath);
                    });
                    deferredArray.push(deferred.promise);
                });
                all(deferredArray).then(lang.hitch(this, function () {
                    try {
                        if (appGlobals.configData.SplashScreen) {
                            //initialize splash screen
                            splashScreen = new SplashScreen();
                            appUrl = window.location.toString();
                            //check if any workflow is configured
                            if (appGlobals.configData.Workflows.length > 0) {
                                if (appGlobals.configData.Workflows.length === 1) {
                                    //load app with workflow if only one workflow is available
                                    location.hash = "?app=" + appGlobals.configData.Workflows[0].Name;
                                    splashScreen._hideSplashScreenDialog();
                                    splashScreen._loadSelectedWorkflow(appGlobals.configData.Workflows[0].Name, map);
                                } else {
                                    //check if workflow is shared in app URL
                                    if (appUrl.split("?app=").length > 1) {
                                        //check if extent is shared in app URL
                                        if (appUrl.split("$extent=").length > 1) {
                                            appGlobals.share = true;
                                            workflow = appUrl.split("?app=")[1].split("$")[0].toUpperCase();
                                        } else {
                                            workflow = appUrl.split("?app=")[1].toUpperCase();
                                            if (workflow.split("$").length > 1) {
                                                workflow = workflow.split("$")[0].toUpperCase();
                                            }
                                        }
                                        splashScreen._hideSplashScreenDialog();
                                        //display shared workflow
                                        splashScreen._loadSelectedWorkflow(workflow, map);
                                    } else {
                                        //display splash screen if no workflow is given in app URL
                                        if (appGlobals.configData.SplashScreen.IsVisible && appGlobals.configData.Workflows.length > 1) {
                                            splashScreen.showSplashScreenDialog(map);
                                        } else {
                                            //display workflow if only one is available in config
                                            location.hash = "?app=" + appGlobals.configData.Workflows[0].Name;
                                            splashScreen._hideSplashScreenDialog();
                                            splashScreen._loadSelectedWorkflow(appGlobals.configData.Workflows[0].Name, map);
                                        }
                                    }
                                }

                                topic.subscribe("showSplashScreen", function () {
                                    splashScreen.showSplashScreenDialog(map);
                                });
                            } else {
                                alert(sharedNls.errorMessages.noWorkflowConfigured);
                            }
                        }

                        /**
                        * create application header
                        */
                        this._createApplicationHeader(widgets, map, splashScreen);

                    } catch (ex) {
                        //display error message if app fails to load widgets
                        alert(sharedNls.errorMessages.widgetNotLoaded);
                    }

                }));
            }));
        },

        /**
        * create map object
        * @return {object} Current map instance
        * @memberOf coreLibrary/widgetLoader
        */
        _initializeMap: function (map) {
            var mapInstance = map.getMapInstance();
            return mapInstance;
        },

        /**
        * create application header
        * @param {object} widgets Contain widgets to be displayed in header panel
        * @memberOf coreLibrary/widgetLoader
        */
        _createApplicationHeader: function (widgets, map, workflows) {
            var applicationHeader = new AppHeader({ mapObject: map, workflows: workflows });
            applicationHeader.loadHeaderWidgets(widgets);
        },

        /**
        * set workflow in config array if it is visible
        * @memberOf coreLibrary/widgetLoader
        */
        _setWorkflowConfig: function () {
            var i, WorkFlows = [];
            for (i = 0; i < appGlobals.configData.Workflows.length; i++) {
                //check if workflow is visibility is set to true in config
                if (appGlobals.configData.Workflows[i].Visible) {
                    WorkFlows.push(appGlobals.configData.Workflows[i]);
                }
            }
            //update array to contain visible workflows
            appGlobals.configData.Workflows = WorkFlows;
        },

        _fetchBasemapCollection: function (basemapDeferred) {
            var groupUrl, searchUrl, webmapRequest, groupRequest, deferred, agolBasemapsCollection, thumbnailSrc, baseMapArray = [], deferredArray = [], self = this;
            /**
            * If group owner & title are configured, create request to fetch the group id
            */
            if (appGlobals.configData.BasemapGroupTitle && appGlobals.configData.BasemapGroupOwner) {
                if (lang.trim(appGlobals.configData.PortalAPIURL) !== "") {
                    groupUrl = appGlobals.configData.PortalAPIURL + "community/groups?q=title:\"" + appGlobals.configData.BasemapGroupTitle + "\" AND owner:" + appGlobals.configData.BasemapGroupOwner + "&f=json";
                    groupRequest = esriRequest({
                        url: groupUrl,
                        callbackParamName: "callback"
                    });
                    groupRequest.then(function (groupInfo) {
                        if (groupInfo.results.length === 0) {
                            basemapDeferred.resolve(baseMapArray);
                            return;
                        }
                        /**
                        * Create request using group id to fetch all the items from that group
                        */
                        searchUrl = appGlobals.configData.PortalAPIURL + 'search?q=group:' + groupInfo.results[0].id + "&sortField=name&sortOrder=desc&num=50&f=json";
                        webmapRequest = esriRequest({
                            url: searchUrl,
                            callbackParamName: "callback"
                        });
                        webmapRequest.then(function (groupInfo) {
                            /**
                            * Loop for each item in the group
                            */
                            array.forEach(groupInfo.results, lang.hitch(this, function (info, index) {
                                /**
                                * If type is "Map Service", create the object and push it into "baseMapArray"
                                */
                                if (info.type === "Map Service") {
                                    thumbnailSrc = (groupInfo.results[index].thumbnail === null) ? appGlobals.configData.NoThumbnail : appGlobals.configData.PortalAPIURL + "content/items/" + info.id + "/info/" + info.thumbnail;
                                    baseMapArray.push({
                                        ThumbnailSource: thumbnailSrc,
                                        Name: info.title,
                                        MapURL: info.url
                                    });
                                    /**
                                    * If type is "Web Map", create requests to fetch all the items of the webmap (asynchronous request)
                                    */
                                } else if (info.type === "Web Map") {
                                    var mapDeferred = esriUtils.getItem(info.id);
                                    mapDeferred.then(lang.hitch(this, function () {
                                        deferred = new Deferred();
                                        deferred.resolve();
                                    }));
                                    deferredArray.push(mapDeferred);
                                }
                            }));
                            if (deferredArray.length > 0) {

                                all(deferredArray).then(function (res) {
                                    /**
                                    *If result of webmaps are empty
                                    */
                                    if (res.length === 0) {
                                        basemapDeferred.resolve(baseMapArray);
                                        return;
                                    }
                                    /**
                                    * Else for each items in the webmap, create the object and push it into "baseMapArray"
                                    */
                                    array.forEach(res, function (data, innerIdx) {
                                        self._filterRedundantBasemap(data, baseMapArray, false);
                                    });
                                    basemapDeferred.resolve(baseMapArray);
                                });
                            } else {
                                basemapDeferred.resolve(baseMapArray);
                            }
                        }, function (err) {
                            alert(err.message);
                        });
                    }, function (err) {
                        alert(err.message);
                    });
                } else {
                    alert(sharedNls.errorMessages.portalUrlNotFound);
                }
            } else {
                /**
                * If group owner & title are not configured, fetch the basemap collections from AGOL using BasemapGallery widget
                */
                agolBasemapsCollection = new BasemapGallery({
                    showArcGISBasemaps: true
                });
                on(agolBasemapsCollection, "load", function () {
                    /**
                    * onLoad, loop through each basemaps in the basemap gallery and push it into "baseMapArray"
                    */
                    deferred = new Deferred();
                    self._fetchBasemapFromGallery(agolBasemapsCollection, baseMapArray, deferred);
                    deferred.then(function () {
                        basemapDeferred.resolve(baseMapArray);
                    });

                });
            }
        },

        /**
        * remove basemap which is added by earlier selected workflow's webmap
        * @memberOf coreLibrary/widgetLoader
        */
        _removeWorkFlowBasemap: function () {
            var i, temBaseMapArray = [], baseMapArray = appGlobals.configData.BaseMapLayers;
            for (i = 0; i < baseMapArray.length; i++) {
                if (baseMapArray[i].length) {
                    if (!baseMapArray[i][0].isWorkFlowBasemap) {
                        temBaseMapArray.push(baseMapArray[i]);
                    }
                } else {
                    if (!baseMapArray[i].isWorkFlowBasemap) {
                        temBaseMapArray.push(baseMapArray[i]);
                    }
                }
            }
            //update basemap array when new workflow is selected
            appGlobals.configData.BaseMapLayers = temBaseMapArray;
        },

        /**
        * If basemap layer is already present in the "baseMapArray", skip it
        * @memberOf coreLibrary/widgetLoader
        */
        _filterRedundantBasemap: function (bmLayers, baseMapArray, isWorkFlowBasemap) {
            var i, bmLayerData, multiBasemap = [];
            if (bmLayers.itemData.baseMap) {
                if (bmLayers.itemData.baseMap.baseMapLayers) {
                    bmLayerData = bmLayers.itemData.baseMap.baseMapLayers;
                } else {
                    bmLayerData = [];
                    bmLayerData.push(bmLayers);
                }
                //check if basemap is an open street map
                if (bmLayerData[0].layerType === "OpenStreetMap" || bmLayerData[0].type === "OpenStreetMap") {
                    bmLayerData[0].url = bmLayerData[0].id;
                }
                if (this._isUniqueBasemap(baseMapArray, bmLayerData, isWorkFlowBasemap)) {
                    if (isWorkFlowBasemap || bmLayerData[0].visibility) {
                        appGlobals.shareOptions.selectedBasemapIndex = baseMapArray.length;
                    }
                    if (bmLayerData.length === 1) {
                        this._setBasemapAttribute(baseMapArray, bmLayerData[0], bmLayers, isWorkFlowBasemap);
                    } else if (bmLayerData.length > 1) {
                        for (i = 0; i < bmLayerData.length; i++) {
                            this._setBasemapAttribute(multiBasemap, bmLayerData[i], bmLayers, isWorkFlowBasemap);
                        }
                        baseMapArray.push(multiBasemap);
                    }
                }
            }
        },

        /**
        * set required basemap attribute
        * @memberOf coreLibrary/widgetLoader
        */
        _setBasemapAttribute: function (baseMapArray, bmLayerData, bmLayers, isWorkFlowBasemap) {
            bmLayerData.isWorkFlowBasemap = isWorkFlowBasemap;
            bmLayerData.id = bmLayers.item.id;
            bmLayerData.thumbnail = bmLayers.item.thumbnail;
            bmLayerData.title = bmLayers.itemData.baseMap.title;
            this._storeUniqueBasemap(bmLayerData, baseMapArray);

        },

        /**
        * check new basemap exists in basemap array or not
        * @memberOf coreLibrary/widgetLoader
        */
        _isUniqueBasemap: function (baseMapArray, bmLayerData, isWorkFlowBasemap) {
            var i, j, k, pushBasemap = true, count = 1;
            for (i = 0; i < baseMapArray.length; i++) {
                if (!baseMapArray[i].length) {
                    if (bmLayerData[0].url === baseMapArray[i].MapURL) {
                        if (bmLayerData.length > 1) {
                            pushBasemap = true;
                        } else {
                            pushBasemap = false;
                        }
                        if (bmLayerData[0].visibility) {
                            appGlobals.shareOptions.selectedBasemapIndex = i;
                        }
                        break;
                    }
                } else {
                    for (j = 0; j < baseMapArray[i].length; j++) {
                        if (bmLayerData[0].url === baseMapArray[i][j].MapURL) {
                            for (k = 1; k < bmLayerData.length; k++) {
                                if (bmLayerData[k].url === baseMapArray[i][j].MapURL) {
                                    count++;
                                }
                            }
                            if (bmLayerData[0].visibility) {
                                appGlobals.shareOptions.selectedBasemapIndex = i;
                            }
                            break;
                        }
                    }
                    if (i === baseMapArray.length - 1) {
                        if (count === baseMapArray[i].length) {
                            pushBasemap = false;
                        } else {
                            pushBasemap = true;
                        }
                    }
                }
            }
            return pushBasemap;
        },

        /**
        * store unique base map
        * @memberOf coreLibrary/widgetLoader
        */
        _storeUniqueBasemap: function (bmLayer, baseMapArray) {
            var thumbnailSrc, layerType;
            if (bmLayer.url || (bmLayer.layerType === "OpenStreetMap" || bmLayer.type === "OpenStreetMap")) {
                if (bmLayer.layerType) {
                    layerType = bmLayer.layerType;
                } else {
                    layerType = bmLayer.type;
                }
                thumbnailSrc = (bmLayer.thumbnail === null) ? appGlobals.configData.NoThumbnail : appGlobals.configData.PortalAPIURL + "content/items/" + bmLayer.id + "/info/" + bmLayer.thumbnail;
                baseMapArray.push({
                    ThumbnailSource: thumbnailSrc,
                    Name: bmLayer.title,
                    MapURL: bmLayer.url,
                    isWorkFlowBasemap: bmLayer.isWorkFlowBasemap,
                    layerType: layerType
                });
            }
        },

        /**
        * get basemap from basmeap gallery
        * @memberOf coreLibrary/widgetLoader
        */
        _fetchBasemapFromGallery: function (agolBasemapsCollection, baseMapArray, basemapDeferred) {
            var deferred, deferredArray = [];
            array.forEach(agolBasemapsCollection.basemaps, lang.hitch(this, function (basemap) {
                var basemapRequest, basemapLayersArray = [];
                basemapRequest = basemap.getLayers();
                basemapRequest.then(function () {
                    /**
                    *If array contains only single layer object, push it into "baseMapArray"
                    */
                    if (basemap.layers.length === 1) {
                        baseMapArray.push({
                            ThumbnailSource: basemap.thumbnailUrl,
                            Name: basemap.title,
                            MapURL: basemap.layers[0].url
                        });
                    } else {
                        array.forEach(basemap.layers, lang.hitch(this, function (basemapLayers) {
                            basemapLayersArray.push({
                                ThumbnailSource: basemap.thumbnailUrl,
                                Name: basemap.title,
                                MapURL: basemapLayers.url
                            });
                        }));
                        baseMapArray.push(basemapLayersArray);
                    }
                    /** If array contains more than one layer object, loop through each layer, create object for each one of them
                    and push it into "basemapLayersArray", finally push "basemapLayersArray" into "baseMapArray" */

                    deferred = new Deferred();
                    deferred.resolve();
                });
                deferredArray.push(basemapRequest);
            }));
            all(deferredArray).then(function (res) {
                basemapDeferred.resolve(baseMapArray);
            });
        }
    });
});

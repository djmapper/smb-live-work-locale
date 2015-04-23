/*global define,dojo,dojoConfig,alert,console,esri,appGlobals */
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
    "dojo/date/locale",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/keys",
    "dojo/_base/html",
    "dojo/string",
    "esri/tasks/locator",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojo/window",
    "esri/graphic",
    "esri/tasks/query",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/geometry/Polyline",
    "dojo/query",
    "../scrollBar/scrollBar",
    "esri/geometry/Point",
    "dojo/Deferred",
    "dojo/promise/all",
    "esri/tasks/QueryTask",
    "dojo/text!./templates/locatorTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/_base/Color",
    "esri/geometry/Extent",
    "esri/urlUtils",
    "dojo/topic",
    "dojo/mouse",
    "esri/tasks/FeatureSet",
    "esri/units",
    "esri/SpatialReference",
    "esri/tasks/RouteTask",
    "esri/tasks/RouteParameters",
    "dojo/i18n!application/js/library/nls/localizedStrings"
], function (declare, dojoDateLocale, domConstruct, domStyle, domAttr, array, lang, on, domGeom, dom, domClass, dojoKeys, html, string, Locator, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, dojoWindow, Graphic, Query, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Polyline, query, ScrollBar, Point, Deferred, all, QueryTask, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Color, GeometryExtent, urlUtils, topic, mouse, FeatureSet, Units, SpatialReference, RouteTask, RouteParameters, sharedNls) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        lastSearchString: null,
        lastSearchTime: 0,
        stagedSearch: null,
        locatorScrollbar: null,
        geometryArrayForPolyline: [],
        logoContainer: null,
        selectedPolygon: null,
        /**
        * display locator widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            /**
            * close locator widget if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            urlUtils.addProxyRule({
                urlPrefix: appGlobals.configData.RouteTask,
                proxyUrl: appGlobals.configData.ProxyUrl
            });
            urlUtils.addProxyRule({
                urlPrefix: appGlobals.configData.GeometryService,
                proxyUrl: appGlobals.configData.ProxyUrl
            });
            this.logoContainer = (query(".map .logo-sm") && query(".map .logo-sm")[0]) || (query(".map .logo-med") && query(".map .logo-med")[0]);
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "locator") {
                    if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearch-select");
                        if (query('.esriCTDivLegendBox')[0]) {
                            domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "1000");
                        }
                        domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
                        topic.publish("setMaxLegendLength");
                        domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                    }
                } else {
                    if (domClass.contains(this.divAddressHolder, "esriCTHideContainerHeight")) {
                        this._setAddressHolderHeight();
                    }
                }
            }));

            topic.subscribe("_createList", lang.hitch(this, function (featureList) {
                this._createFeatureList(featureList);
            }));

            topic.subscribe("_resetAddressContainer", lang.hitch(this, function () {
                this._resetAddressContainer();
            }));

            topic.subscribe("_setInfoWindowLocation", lang.hitch(this, function () {
                this._setInfoWindowLocation();
            }));

            topic.subscribe("showInfoWindow", lang.hitch(this, function (mapPoint, featureArray, count, isInfoArrowClicked) {
                this._createInfoWindowContent(mapPoint, featureArray, count, isInfoArrowClicked);
            }));
            topic.subscribe("clearSelectedFeature", lang.hitch(this, function () {
                this.map.getLayer("esriGraphicsLayerMapSettings").remove(this.selectedPolygon);
            }));
            topic.subscribe("setMap", lang.hitch(this, function (map) {
                if (this.map) {
                    this.map = map;
                }
                this._resetShareParameters();
            }));
            topic.subscribe("locateAddressOnMap", lang.hitch(this, function () {
                //set mode(drive/walk) and slider value from shared URL
                if (window.location.toString().split("$driveType=").length > 1) {
                    if (window.location.toString().split("$driveType=")[1].split("$")[0] === "false") {
                        domClass.replace(this.esriCTimgDrive, "driveIcon", "driveIconSelected");
                        domClass.replace(this.esriCTimgWalk, "walkIconSelected", "walkIcon");
                        this.sliderMessage.innerHTML = this.sliderMessage.innerHTML.replace(sharedNls.titles.driveTimeText, sharedNls.titles.walkTimeText);
                        appGlobals.shareOptions.driveTime = false;
                    }
                }
                this._shareAddress();
            }));
            window.onresize = lang.hitch(this, function () {
                if (domClass.contains(this.divAddressHolder, "esriCTShowContainerHeight")) {
                    if (domStyle.get(this.divSelectedFeature, "display") === "block") {
                        if (query('.esriCTDivLegendBox')[0]) {
                            domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "998");
                        }
                        this._createFeatureList(this.selectedFeatureList);
                        domClass.replace(query(".toggleExpandCollapse")[0], "collapse", "expand");
                        domAttr.set(query(".toggleExpandCollapse")[0], "title", appGlobals.configData.ExpandResultTooltip);
                    }
                }
            });

            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.search, "class": "esriCTHeaderSearch" }, null);
            domConstruct.place(this.divAddressContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                this._toggleTextBoxControls(false);
                // minimize other open header panel widgets and show locator widget
                topic.publish("toggleWidget", "locator");
                this._showLocateContainer();
            })));
            domStyle.set(this.divAddressContainer, "display", "block");
            domAttr.set(this.divAddressContainer, "title", "");
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/blue-loader.gif");
            this._setDefaultTextboxValue();
            this._attachLocatorEvents();
            this._createHorizontalSlider();
            appGlobals.shareOptions.driveTime = true;
            //attach click event on drive button
            on(this.esriCTDrive, "click", lang.hitch(this, function () {
                if (domClass.contains(this.esriCTimgDrive, "driveIcon")) {
                    domClass.replace(this.esriCTimgDrive, "driveIconSelected", "driveIcon");
                    domClass.replace(this.esriCTimgWalk, "walkIcon", "walkIconSelected");
                    this.sliderMessage.innerHTML = this.sliderMessage.innerHTML.replace("walk", "drive");
                    appGlobals.shareOptions.driveTime = true;
                    this._updateBufferArea();
                }
            }));
            //attach click event on walk button
            on(this.esriCTWalk, "click", lang.hitch(this, function () {
                if (domClass.contains(this.esriCTimgWalk, "walkIcon")) {
                    domClass.replace(this.esriCTimgDrive, "driveIcon", "driveIconSelected");
                    domClass.replace(this.esriCTimgWalk, "walkIconSelected", "walkIcon");
                    this.sliderMessage.innerHTML = this.sliderMessage.innerHTML.replace(sharedNls.titles.driveTimeText, sharedNls.titles.walkTimeText);
                    appGlobals.shareOptions.driveTime = false;
                    this._updateBufferArea();
                }
            }));
            on(query(".toggleExpandCollapse")[0], "click", lang.hitch(this, function (evt) {
                if (domClass.contains(evt.currentTarget, "collapse")) {
                    domClass.replace(evt.currentTarget, "expand", "collapse");
                    domAttr.set(evt.currentTarget, "title", appGlobals.configData.CollapseResultTooltip);
                    this._expandList();
                } else {
                    domClass.replace(evt.currentTarget, "collapse", "expand");
                    domAttr.set(evt.currentTarget, "title", appGlobals.configData.ExpandResultTooltip);
                    this._collapseList();
                }
                this.featureListScrollbar.resetScrollBar();
            }));
            domAttr.set(query(".toggleExpandCollapse")[0], "title", appGlobals.configData.ExpandResultTooltip);
            var defaultMode = appGlobals.shareOptions.driveTime ? sharedNls.titles.driveTimeText : sharedNls.titles.walkTimeText;
            domAttr.set(this.sliderMessage, "innerHTML", string.substitute(sharedNls.titles.sliderDisplayText, { defaultMinute: appGlobals.configData.DriveTimeSliderSettings.defaultMinutes, mode: defaultMode }));
            domAttr.set(this.esriCTimgDrive, "title", appGlobals.configData.DriveTimeButtonTooltip);
            domAttr.set(this.esriCTimgWalk, "title", appGlobals.configData.WalkTimeButtonTooltip);
            domAttr.set(query(".nearbyMessage")[0], "innerHTML", appGlobals.configData.ResultsPanelTitleText);
        },

        _setAddressHolderHeight: function () {
            if (domStyle.get(this.divSelectedFeature, "display") === "none") {
                domClass.remove(this.divAddressHolder, "esriCTFullHeight");
                var contHeight = domStyle.get(this.divAddressContent, "height");
                domStyle.set(this.divAddressHolder, "height", contHeight + 2 + "px");
            } else {
                domClass.add(this.divAddressHolder, "esriCTFullHeight");
            }
        },

        /**
        * set default value of locator textbox as specified in configuration file
        * @memberOf widgets/locator/locator
        */
        _setDefaultTextboxValue: function () {
            var locatorSettings;
            locatorSettings = appGlobals.configData.LocatorSettings;
            domAttr.set(this.txtAddress, "defaultAddress", locatorSettings.LocatorDefaultAddress);
            domClass.replace(this.close, "clearInput", "clearInputNotApear");
        },

        /**
        * attach locator events
        * @memberOf widgets/locator/locator
        */
        _attachLocatorEvents: function () {
            this.own(on(this.esriCTSearch, "click", lang.hitch(this, function (evt) {
                this._locateAddress(true);
            })));
            this.own(on(this.txtAddress, "keyup", lang.hitch(this, function (evt) {
                this._submitAddress(evt);
            })));
            this.own(on(this.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                this._clearDefaultText(evt);
            })));
            this.own(on(this.txtAddress, "focus", lang.hitch(this, function () {
                domClass.add(this.txtAddress, "esriCTColorChange");
            })));
            this.own(on(this.close, "click", lang.hitch(this, function () {
                this._hideText();
            })));
        },

        _hideText: function () {
            if (domClass.contains(this.close, "clearInput")) {
                this.txtAddress.value = "";
                domClass.replace(this.close, "clearInputNotApear", "clearInput");
                domConstruct.empty(this.divAddressResults);
                domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
                domClass.remove(this.divAddressContent, "esriCTAddressResultHeight");
                if (this.locatorScrollbar) {
                    domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                    this.locatorScrollbar.removeScrollBar();
                }
                domStyle.set(this.divAddressScrollContainer, "display", "none");
                domStyle.set(this.noResultFound, "display", "none");
            }
        },

        /**
        * show/hide locator widget and set default search text
        * @memberOf widgets/locator/locator
        */
        _showLocateContainer: function () {
            this.txtAddress.blur();
            if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                // when user clicks on locator icon in header panel, close the search panel if it is open
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearch-select");
                domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
                topic.publish("setMaxLegendLength");
                this.txtAddress.blur();
            } else {
                //when user clicks on locator icon in header panel, open the search panel if it is closed
                domClass.replace(this.domNode, "esriCTHeaderSearch-select", "esriCTHeaderSearch");
                domClass.replace(this.txtAddress, "esriCTBlurColorChange", "esriCTColorChange");
                domClass.replace(this.divAddressHolder, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                if (query('.esriCTDivLegendBox')[0]) {
                    domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "1000");
                }
                domStyle.set(this.txtAddress, "verticalAlign", "middle");
                if (domStyle.get(query(".divSelectedFeature")[0], "display") === "block") {
                    domClass.add(query(".esriControlsBR")[0], "esriLogoShiftRight");
                    topic.publish("setMinLegendLength");
                    if (query('.esriCTDivLegendBox')[0]) {
                        domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "998");
                    }
                }
                this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
            }
        },

        /**
        * search address on every key press
        * @param {object} evt Keyup event
        * @memberOf widgets/locator/locator
        */
        _submitAddress: function (evt) {
            if (evt) {
                //Enter key immediately starts search
                if (evt.keyCode === dojoKeys.ENTER) {
                    this._locateAddress(true);
                    return;
                }
                // do not perform auto complete search if control &| alt key pressed, except for ctrl-v
                if (evt.ctrlKey || evt.altKey ||
                        evt.keyCode === dojoKeys.UP_ARROW || evt.keyCode === dojoKeys.DOWN_ARROW ||
                        evt.keyCode === dojoKeys.LEFT_ARROW || evt.keyCode === dojoKeys.RIGHT_ARROW ||
                        evt.keyCode === dojoKeys.HOME || evt.keyCode === dojoKeys.END ||
                        evt.keyCode === dojoKeys.CTRL || evt.keyCode === dojoKeys.SHIFT) {
                    evt.cancelBubble = true;
                    evt.stopPropagation();
                    this._toggleTextBoxControls(false);
                    return;
                }
                this._locateAddress(false);
            }
        },

        /**
        * perform search by addess if search type is address search
        * @memberOf widgets/locator/locator
        */
        _locateAddress: function (launchImmediately) {
            var searchText = lang.trim(this.txtAddress.value).replace(/'/g, "''");
            if (launchImmediately || this.lastSearchString !== searchText) {
                this._toggleTextBoxControls(true);
                this.lastSearchString = searchText;
                appGlobals.shareOptions.searchText = searchText;
                // Clear any staged search
                clearTimeout(this.stagedSearch);
                // Hide existing results
                domConstruct.empty(this.divAddressResults);
                this._setAddressHolderHeight();
                this._setHeightAddressResults();
                domStyle.set(this.noResultFound, "display", "none");
                //stage a new search, which will launch if no new searches show up before the timeout
                this.stagedSearch = setTimeout(lang.hitch(this, function () {
                    var thisSearchTime;
                    // Replace search type-in box' clear X with a busy cursor
                    this._toggleTextBoxControls(false);
                    // Launch a search after recording when the search began
                    this.lastSearchTime = thisSearchTime = (new Date()).getTime();
                    this._searchLocation(searchText, thisSearchTime);
                }), (launchImmediately ? 0 : 500));
            }
        },

        /**
        * call locator service and get search results
        * @memberOf widgets/locator/locator
        */
        _searchLocation: function (searchText, thisSearchTime) {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent, options, searchFields, addressFieldValues,
                addressFieldIndex, deferredArray = [], index, locatorDef, resultLength, deferred, key, resultAttributes;
            this._resetShareParameters();
            // Discard searches made obsolete by new typing from user
            if (thisSearchTime < this.lastSearchTime) {
                return;
            }
            if (searchText === "") {
                this._locatorErrBack(true);
                domClass.replace(this.close, "clearInputNotApear", "clearInput");
            } else {
                nameArray = {};
                //get locator configuration
                locatorSettings = appGlobals.configData.LocatorSettings;
                nameArray[locatorSettings.DisplayText] = [];
                domAttr.set(this.txtAddress, "defaultAddress", searchText);

                this._toggleTextBoxControls(true);
                // call locator service specified in configuration file
                locator = new Locator(locatorSettings.LocatorURL);
                searchFieldName = locatorSettings.LocatorParameters.SearchField;
                addressField = {};
                addressField[searchFieldName] = searchText;
                //get full extent of selected basemap
                if (this.map.getLayer("defaultBasemap")) {
                    baseMapExtent = this.map.getLayer("defaultBasemap").fullExtent;
                } else if (this.map.getLayer("defaultBasemap0")) {
                    baseMapExtent = this.map.getLayer("defaultBasemap0").fullExtent;
                }
                options = {};
                options.address = addressField;
                options.outFields = locatorSettings.LocatorOutFields;
                options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
                locator.outSpatialReference = this.map.spatialReference;
                searchFields = [];
                addressFieldValues = locatorSettings.FilterFieldValues;
                for (addressFieldIndex in addressFieldValues) {
                    if (addressFieldValues.hasOwnProperty(addressFieldIndex)) {
                        searchFields.push(addressFieldValues[addressFieldIndex]);
                    }
                }

                // Get deferred for searching for search term in each feature layer in workflow in order
                for (index = 0; index < appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings.length; index++) {
                    this._layerSearchResults(searchText, deferredArray, appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings[index]);
                }

                // Get deferred for searching for search term in geocoding
                locatorDef = locator.addressToLocations(options);
                locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                    var deferred = new Deferred();
                    deferred.resolve(candidates);
                    return deferred.promise;
                }), function (e) {
                    deferred.resolve();
                });
                deferredArray.push(locatorDef);

                // When deferred all complete, process the list in workflow order followed by the geocoding
                all(deferredArray).then(lang.hitch(this, function (result) {
                    var num, results;
                    // Discard searches made obsolete by new typing from user
                    if (thisSearchTime < this.lastSearchTime) {
                        return;
                    }
                    if (result) {
                        if (result.length > 0) {
                            for (num = 0; num < result.length; num++) {
                                if (result[num]) {
                                    if (result[num].layerSearchSettings) {
                                        key = result[num].layerSearchSettings.SearchDisplayTitle;
                                        nameArray[key] = [];
                                        if (result[num].featureSet.features) {
                                            for (index = 0; index < result[num].featureSet.features.length; index++) {
                                                resultAttributes = result[num].featureSet.features[index].attributes;
                                                for (results in resultAttributes) {
                                                    //set default value for fields if its value is null or undefined
                                                    if (resultAttributes.hasOwnProperty(results)) {
                                                        if (!resultAttributes[results]) {
                                                            resultAttributes[results] = appGlobals.configData.ShowNullValueAs;
                                                        }
                                                    }
                                                }
                                                //add feature data into nameArray
                                                if (nameArray[key].length < locatorSettings.MaxResults) {
                                                    nameArray[key].push({
                                                        name: string.substitute(result[num].layerSearchSettings.SearchDisplayFields, resultAttributes),
                                                        attributes: resultAttributes,
                                                        fields: result[num].fields,
                                                        layer: result[num].layerSearchSettings,
                                                        geometry: result[num].featureSet.features[index].geometry
                                                    });
                                                }
                                            }
                                        }
                                    } else if (result[num].length) {
                                        this._addressResult(result[num], nameArray, searchFields);
                                    }
                                    if (result[num].length) {
                                        //result length in case of address
                                        resultLength = result[num].length;
                                    } else if (result[num].featureSet && result[num].featureSet.features && result[num].featureSet.features.length > 0) {
                                        //result length in case of features
                                        resultLength = result[num].featureSet.features.length;
                                    }
                                }
                            }
                            this._showLocatedAddress(searchText, nameArray, resultLength);
                        }
                    } else {
                        this._locatorErrBack(true);
                    }
                }));
            }
        },

        /**
        * toggle visibility of loader and close icon text box controls
        * @memberOf widgets/locator/locator
        */
        _toggleTextBoxControls: function (isShow) {
            if (isShow) {
                domStyle.set(this.imgSearchLoader, "display", "block");
                domStyle.set(this.close, "display", "none");
            } else {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                domClass.replace(this.close, "clearInput", "clearInputNotApear");
            }
        },

        /**
        * query layer for searched result
        * @memberOf widgets/locator/locator
        */
        _layerSearchResults: function (searchText, deferredArray, layerobject) {
            var queryTask, queryLayer, deferred, currentTime, featureObject;
            if (layerobject.QueryURL) {
                deferred = new Deferred();
                //query layer if its unifiedSearch is set to true in config
                if (layerobject.UnifiedSearch.toLowerCase() === "true") {
                    currentTime = new Date();
                    queryTask = new QueryTask(layerobject.QueryURL);
                    queryLayer = new Query();
                    queryLayer.where = string.substitute(layerobject.SearchExpression, [searchText.toUpperCase()]) + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
                    queryLayer.outSpatialReference = this.map.spatialReference;
                    // set return geometry true if object id field  is not available in layer
                    queryLayer.returnGeometry = layerobject.objectIDField ? false : true;
                    queryLayer.outFields = ["*"];
                    queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                        featureObject = {
                            "featureSet": featureSet,
                            "layerSearchSettings": layerobject
                        };
                        deferred.resolve(featureObject);
                    }), function (err) {
                        deferred.resolve();
                    });
                } else {
                    deferred.resolve();
                }
                deferredArray.push(deferred);
            }
        },
        /**
        * push results into nameArray
        * @memberOf widgets/locator/locator
        */
        _addressResult: function (candidates, nameArray, searchFields) {
            var order, j;
            domStyle.set(this.noResultFound, "display", "none");
            domStyle.set(this.divAddressScrollContainer, "display", "block");
            domClass.add(this.divAddressScrollContent, "esriCTdivAddressScrollContent");
            for (order = 0; order < candidates.length; order++) {
                if (candidates[order].attributes[appGlobals.configData.LocatorSettings.AddressMatchScore.Field] > appGlobals.configData.LocatorSettings.AddressMatchScore.Value) {
                    for (j in searchFields) {
                        if (searchFields.hasOwnProperty(j)) {
                            if (candidates[order].attributes[appGlobals.configData.LocatorSettings.FilterFieldName] === searchFields[j]) {
                                if (nameArray[appGlobals.configData.LocatorSettings.DisplayText].length < appGlobals.configData.LocatorSettings.MaxResults) {
                                    nameArray[appGlobals.configData.LocatorSettings.DisplayText].push({
                                        name: string.substitute(appGlobals.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                                        attributes: candidates[order]
                                    });
                                }
                            }
                        }
                    }
                }
            }
        },


        /**
        * filter valid results from results returned by locator service
        * @param {object} candidates Contains results from locator service
        * @memberOf widgets/locator/locator
        */
        _showLocatedAddress: function (searchText, candidates, resultLength) {
            var addrListCount = 0, addrList = [], divAddressSearchCell, candidateArray, divAddressCounty, candiate, listContainer, i;
            domStyle.set(query(".esriCTAddressScrollContent")[0], "display", "block");
            domStyle.set(this.divSelectedFeature, "display", "none");
            if (query('.esriCTDivLegendBox')[0]) {
                domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "1000");
            }
            if (query('.esriCTDivLegendInnerBox')[0]) {
                domClass.remove(query('.esriCTDivLegendInnerBox')[0], "esriCTRightBorderNone");
            }
            topic.publish("clearFeatureList");
            if (this.map.getLayer("esriGraphicsLayerMapSettings")) {
                this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            }
            domConstruct.empty(this.divAddressResults);
            if (lang.trim(this.txtAddress.value) === "") {
                this.txtAddress.focus();
                domStyle.set(this.divSelectedFeature, "display", "none");
                domConstruct.empty(this.divAddressResults);
                this.locatorScrollbar = new ScrollBar({ domNode: this.divAddressScrollContent });
                this.locatorScrollbar.setContent(this.divAddressResults);
                this.locatorScrollbar.createScrollBar();
                this._toggleTextBoxControls(false);
                return;
            }

            /**
            * display all the located address in the address container
            * 'this.divAddressResults' div dom element contains located addresses, created in widget template
            */

            if (this.locatorScrollbar) {
                domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.locatorScrollbar.removeScrollBar();
            }

            //create UI for expandable/collapsible search results
            if (resultLength > 0) {
                this.locatorScrollbar = new ScrollBar({ domNode: this.divAddressScrollContent });
                this.locatorScrollbar.setContent(this.divAddressResults);
                domStyle.set(this.divAddressScrollContent, "height", "200px");
                this.locatorScrollbar.createScrollBar();
                this._toggleTextBoxControls(false);
                domClass.add(this.divAddressHolder, "esriCTAddressContentHeight");
                for (candidateArray in candidates) {
                    if (candidates.hasOwnProperty(candidateArray)) {
                        if (candidates[candidateArray].length > 0) {
                            divAddressCounty = domConstruct.create("div", { "class": "esriCTSearchGroupRow esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriAddressCounty" }, this.divAddressResults);
                            divAddressSearchCell = domConstruct.create("div", { "class": "esriCTSearchGroupCell" }, divAddressCounty);
                            candiate = candidateArray + " (" + candidates[candidateArray].length + ")";
                            domConstruct.create("div", { "innerHTML": "+", "class": "plus-minus" }, divAddressSearchCell);
                            domConstruct.create("div", { "innerHTML": candiate, "class": "esriCTGroupList" }, divAddressSearchCell);
                            addrList.push(divAddressSearchCell);
                            this._toggleAddressList(addrList, addrListCount);
                            addrListCount++;
                            listContainer = domConstruct.create("div", { "class": "listContainer hideAddressList" }, this.divAddressResults);
                            for (i = 0; i < candidates[candidateArray].length; i++) {
                                this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer);
                            }
                        }
                    }
                }
            }
            if (!addrListCount) {
                this._locatorErrBack(true);
            }
        },

        /**
        * display valid result in search panel
        * @param {object} candidate Contains valid result to be displayed in search panel
        * @return {Boolean} true if result is displayed successfully
        * @memberOf widgets/locator/locator
        */
        _toggleAddressList: function (addressList, idx) {
            on(addressList[idx], "click", lang.hitch(this, function () {
                if (domClass.contains(query(".listContainer")[idx], "showAddressList")) {
                    domClass.toggle(query(".listContainer")[idx], "showAddressList");
                    var listStatusSymbol = (domAttr.get(query(".plus-minus")[idx], "innerHTML") === "+") ? "-" : "+";
                    domAttr.set(query(".plus-minus")[idx], "innerHTML", listStatusSymbol);
                    this.locatorScrollbar.resetScrollBar();
                } else {
                    domClass.add(query(".listContainer")[idx], "showAddressList");
                    domAttr.set(query(".plus-minus")[idx], "innerHTML", "-");
                }
                this.locatorScrollbar.resetScrollBar();
            }));
        },

        /**
        * display valid result in search panel
        * @param {object} candidate Contains valid result to be displayed in search panel
        * @return {Boolean} true if result is displayed successfully
        * @memberOf widgets/locator/locator
        */
        _displayValidLocations: function (candidate, index, candidateArray, listContainer) {
            var divCandidateContent, divCandidate, i, mapPoint;
            domClass.remove(this.divAddressScrollContent, "esriCTdivAddressScrollContent");
            domClass.remove(this.divAddressContent, "esriCTAddressHolderHeight");
            domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
            topic.publish("setMaxLegendLength");
            divCandidateContent = domConstruct.create("div", { "class": "esriCTrowTable esriCTContentBottomBorder" }, listContainer);
            divCandidate = domConstruct.create("div", { "class": "esriCTrowTableSerchClm  esriCTCursorPointer" }, divCandidateContent);
            domAttr.set(divCandidate, "index", index);
            try {
                if (candidate.name) {
                    domAttr.set(divCandidate, "innerHTML", candidate.name);
                } else {
                    domAttr.set(divCandidate, "innerHTML", candidate);
                }
                if (candidate.attributes.location) {
                    domAttr.set(divCandidate, "x", candidate.attributes.location.x);
                    domAttr.set(divCandidate, "y", candidate.attributes.location.y);
                    domAttr.set(divCandidate, "address", string.substitute(appGlobals.configData.LocatorSettings.DisplayField, candidate.attributes.attributes));
                }
            } catch (err) {
                alert(sharedNls.errorMessages.falseConfigParams);
            }

            on(divCandidate, "click", lang.hitch(this, function () {
                topic.publish("showProgressIndicator");
                if (this.map.infoWindow) {
                    this.map.infoWindow.hide();
                }
                appGlobals.shareOptions.searchText = divCandidate.innerHTML;
                this.txtAddress.value = divCandidate.innerHTML;
                domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
                if (candidate.attributes.location) {
                    mapPoint = new Point(domAttr.get(divCandidate, "x"), domAttr.get(divCandidate, "y"), this.map.spatialReference);
                    this._locateAddressOnMap(mapPoint);
                } else if (candidate.geometry) {
                    if (candidate.geometry.type === "point") {
                        this._locateAddressOnMap(candidate.geometry);
                    } else {
                        this._showFeatureOnMap(candidate);
                    }
                } else {
                    for (i = 0; i < appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings.length; i++) {
                        if (appGlobals.configData.Workflows[appGlobals.workFlowIndex].SearchSettings[i].QueryURL === candidate.layer.QueryURL) {
                            this._getSelectedCandidateGeometry(candidate.layer, candidate);
                        }
                    }
                }
            }));
        },

        /**
        * query to get geometry of selected candidate
        * @memberOf widgets/locator/locator
        */
        _getSelectedCandidateGeometry: function (layerobject, candidate) {
            var queryTask, queryLayer, currentTime;
            if (layerobject.QueryURL) {
                currentTime = new Date();
                queryTask = new QueryTask(layerobject.QueryURL);
                queryLayer = new Query();
                queryLayer.where = layerobject.objectIDField + " =" + candidate.attributes[layerobject.objectIDField] + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    candidate.geometry = featureSet.features[0].geometry;
                    if (candidate.geometry.type === "point") {
                        this._locateAddressOnMap(candidate.geometry);
                    } else {
                        this._showFeatureOnMap(candidate);
                    }
                    topic.publish("hideProgressIndicator");
                }), function (err) {
                    alert(err.message);
                });
            }
        },

        /**
        * add graphic on graphic layer of map
        * @memberOf widgets/locator/locator
        */
        _graphicLayerOnMap: function (geometry, symbol) {
            appGlobals.shareOptions.addressLocation = geometry;
            if (window.location.toString().split("$sliderValue=").length > 1) {
                appGlobals.shareOptions.sliderValue = Number(window.location.toString().split("$sliderValue=")[1].split("$")[0]);
            }
            var graphic = new Graphic(geometry, symbol, {}, null);
            if (this.map.getLayer("esriGraphicsLayerMapSettings")) {
                this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
            }
            topic.publish("hideProgressIndicator");
            appGlobals.shareOptions.addressLocation = graphic;
            topic.publish("SliderChange");
        },

        /**
        * locate address on map
        * @memberOf widgets/locator/locator
        */
        _showFeatureOnMap: function (candidate) {
            var rendererColor, lineColor, fillColor, symbol;
            rendererColor = appGlobals.configData.Workflows[appGlobals.workFlowIndex].FeatureHighlightColor;
            if (candidate.geometry.type === "polyline") {
                this.map.setExtent(candidate.geometry.getExtent());
            } else {
                this.map.centerAt(candidate.geometry);
            }
            lineColor = new Color();
            lineColor.setColor(rendererColor);
            fillColor = new Color();
            fillColor.setColor(rendererColor);
            fillColor.a = 0.25;
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
            this._graphicLayerOnMap(candidate.geometry, symbol);
        },

        /**
        * locate address on map
        * @memberOf widgets/locator/locator
        */
        _locateAddressOnMap: function (mapPoint) {
            var geoLocationPushpin, locatorMarkupSymbol;
            this.map.centerAt(mapPoint);
            geoLocationPushpin = dojoConfig.baseURL + appGlobals.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, appGlobals.configData.LocatorSettings.MarkupSymbolSize.width, appGlobals.configData.LocatorSettings.MarkupSymbolSize.height);
            this._graphicLayerOnMap(mapPoint, locatorMarkupSymbol);
        },

        /**
        * hide search panel
        * @memberOf widgets/locator/locator
        */
        _hideAddressContainer: function () {
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearch-select");
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            topic.publish("setMaxLegendLength");
            domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
        },

        /**
        * set height of the search panel
        * @memberOf widgets/locator/locator
        */
        _setHeightAddressResults: function () {
            var addressContentHeight = domGeom.getMarginBox(this.divAddressContent).h, coHeight;
            if (addressContentHeight > 0) {
                coHeight = { height: addressContentHeight - 120 };
                domStyle.set(this.divAddressScrollContent, "style", coHeight + "px");
            }
        },

        /**
        * display search by address tab
        * @memberOf widgets/locator/locator
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display") === "block") {
                return;
            }
            this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
            this.lastSearchString = lang.trim(this.txtAddress.value);
            domConstruct.empty(this.divAddressResults);
        },

        /**
        * clear results and optionally display error message
        * @memberOf widgets/locator/locator
        */
        _locatorErrBack: function (showMessage) {
            if (this.locatorScrollbar) {
                this.locatorScrollbar.removeScrollBar();
            }
            domConstruct.empty(this.divAddressResults);
            this._toggleTextBoxControls(false);
            domStyle.set(this.divAddressScrollContainer, "display", "none");
            domClass.add(this.divAddressContent, "esriCTAddressResultHeight");
            if (showMessage) {
                domStyle.set(this.noResultFound, "display", "block");
            }
            domClass.remove(this.divAddressScrollContent, "esriCTdivAddressScrollContent");
            domClass.remove(this.divAddressContent, "esriCTAddressHolderHeight");
            domClass.remove(this.divAddressHolder, "esriCTAddressContentHeight");
            domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
            this._setAddressHolderHeight();
            if (query('.esriCTDivLegendBox')[0]) {
                domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "1000");
            }
            topic.publish("setMaxLegendLength");
            this._resetFeatureList();
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/locator/locator
        */
        _clearDefaultText: function (evt) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.value = '';
            this.txtAddress.value = "";
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            domClass.replace(this.close, "clearInputNotApear", "clearInput");
        },

        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/locator/locator
        */
        _replaceDefaultText: function (evt) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress");
        },

        /**
        * set default value to search textbox
        * @param {object} target Textbox dom element
        * @param {string} title Default value
        * @param {string} color Background color of search textbox
        * @memberOf widgets/locator/locator
        */
        _resetTargetValue: function (target, title) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
                    target.value = domAttr.get(target, title);
                }
            }
            if (domClass.contains(target, "esriCTColorChange")) {
                domClass.remove(target, "esriCTColorChange");
            }
            domClass.add(target, "esriCTBlurColorChange");
            this.lastSearchString = lang.trim(this.txtAddress.value);
        },
        /*Start of  slider*/
        _createHorizontalSlider: function () {
            var horizontalRule, horizontalSlider;
            if (window.location.toString().split("$sliderValue=").length > 1) {
                appGlobals.shareOptions.sliderValue = Number(window.location.toString().split("$sliderValue=")[1].split("$")[0]);
                setTimeout(lang.hitch(this, function () {
                    this._setSliderValueLabel();
                }), 100);
            } else {
                appGlobals.shareOptions.sliderValue = appGlobals.configData.DriveTimeSliderSettings.defaultMinutes;
            }
            horizontalRule = new HorizontalRule({
                SliderRulerContainer: "topDecoration",
                count: appGlobals.configData.DriveTimeSliderSettings.discreteValues,
                "class": "horizontalRule"
            }, this.horizontalRuleContainer);
            horizontalRule.domNode.firstChild.innerHTML = appGlobals.configData.DriveTimeSliderSettings.minMinutes;
            horizontalRule.domNode.firstChild.style.border = "none";
            horizontalRule.domNode.lastChild.innerHTML = appGlobals.configData.DriveTimeSliderSettings.maxMinutes;
            horizontalRule.domNode.lastChild.style.border = "none";
            domClass.add(horizontalRule.domNode.lastChild, "esriCTLastChild");
            horizontalSlider = new HorizontalSlider({
                value: appGlobals.shareOptions.sliderValue,
                discreteValues: appGlobals.configData.DriveTimeSliderSettings.discreteValues,
                minimum: appGlobals.configData.DriveTimeSliderSettings.minMinutes,
                maximum: appGlobals.configData.DriveTimeSliderSettings.maxMinutes,
                showButtons: false,
                "class": "horizontalSlider"
            }, this.horizontalSliderContainer);
            on(horizontalSlider, "change", lang.hitch(this, function (defaultMinutes) {
                if (appGlobals.shareOptions.sliderValue !== defaultMinutes) {
                    appGlobals.shareOptions.sliderValue = defaultMinutes;
                    this._setSliderValueLabel();
                    if (appGlobals.shareOptions.addressLocation) {
                        topic.publish("SliderChange");
                    }
                }
            }));
            domClass.add(query(".dijitRuleMark")[0], "moveLeft");
        },

        /**
        * set slider value and label
        * @memberOf widgets/locator/locator
        */
        _setSliderValueLabel: function () {
            var currentMode;
            //check if drive time mode is enabled
            currentMode = appGlobals.shareOptions.driveTime ? sharedNls.titles.driveTimeText : sharedNls.titles.walkTimeText;
            //set slider status
            this.sliderMessage.innerHTML = string.substitute(sharedNls.titles.sliderDisplayText, {
                defaultMinute: Math.round(appGlobals.shareOptions.sliderValue),
                mode: currentMode
            });
        },

        /**
        * update buffer area
        * @memberOf widgets/locator/locator
        */
        _updateBufferArea: function () {
            if (appGlobals.shareOptions.addressLocation) {
                topic.publish("SliderChange");
            }
        },

        _resetFeatureList: function () {
            domStyle.set(this.divSelectedFeature, "display", "none");
            domStyle.set(query('.divAddressScrollContainer')[0], "display", "none");
            domClass.remove(this.divAddressContent, "esriCTAddressHolderHeight");
            domClass.remove(this.divAddressHolder, "esriCTFullHeight");

        },

        /**
        * create feature list of near by addresses
        * @memberOf widgets/locator/locator
        */
        _createFeatureList: function (featureList) {
            var featureListArray = [], scrollContentHeight, totalHeight;
            if (featureList.length > 0) {
                topic.subscribe("resetLocatorContainer", lang.hitch(this, function () {
                    this._resetLocateContainer();
                }));
                this.expandedListItem = 0;
                domClass.remove(this.divAddressResultContainer, "borderbottom");
                topic.publish("setMinLegendLength");
                domStyle.set(this.noResultFound, "display", "none");
                domClass.add(this.divAddressContent, "esriCTAddressHolderHeight");
                domStyle.set(this.divSelectedFeature, "display", "block");
                if (query('.esriCTDivLegendBox')[0]) {
                    domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "998");
                }
                domStyle.set(query(".esriCTAddressScrollContent")[0], "display", "none");
                if (this.featureListScrollbar) {
                    domClass.add(this.featureListScrollbar._scrollBarContent, "esriCTZeroHeight");
                    this.featureListScrollbar.removeScrollBar();
                }
                if (featureList.length) {
                    domStyle.set(this.headerContainer, "display", "block");
                    this.selectedFeatureList = featureList;
                    domClass.add(query(".esriControlsBR")[0], "esriLogoShiftRight");
                } else {
                    domStyle.set(this.headerContainer, "display", "none");
                }
                totalHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                scrollContentHeight = totalHeight - (domGeom.getMarginBox(this.divAddressResultContainer).h + domGeom.getMarginBox(this.SliderContainer).h + 100);
                domStyle.set(this.divSelectedFeatureContent, "height", scrollContentHeight + "px");
                this.featureListScrollbar = new ScrollBar({ domNode: this.divSelectedFeatureContent });
                this.featureListScrollbar.setContent(this.divSelectedFeatureList);
                this.featureListScrollbar.createScrollBar();
                domConstruct.empty(this.divSelectedFeatureList);
                array.forEach(featureList, lang.hitch(this, function (featureGroup, idx) {
                    if (featureGroup.length > 0) {
                        var divLayerTitle, divLayerTitleContent, divAddressListGroup;
                        divLayerTitle = domConstruct.create("div", { "class": "esriCTSearchGroupRow esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriAddressCounty" }, this.divSelectedFeatureList);
                        divLayerTitleContent = domConstruct.create("div", { "class": "esriCTSearchGroupCell" }, divLayerTitle);
                        domConstruct.create("div", { "innerHTML": "+", "class": "plusMinusFeatureTitle" }, divLayerTitleContent);
                        domConstruct.create("div", { "innerHTML": featureGroup[0].name + " (" + featureGroup.length + ")", "class": "esriCTGroupList" }, divLayerTitleContent);
                        featureListArray.push(divLayerTitle);
                        this._toggleFeatureList(divLayerTitle, featureListArray.length - 1);
                        divAddressListGroup = domConstruct.create("div", { "class": "divAddressListGroup listCollapse" }, this.divSelectedFeatureList);
                        array.forEach(featureGroup, lang.hitch(this, function (feature, featureId) {
                            var featureNamediv, featureName, showDistanceNode;
                            featureNamediv = domConstruct.create("div", { "class": "esriCTContentBottomBorder divAddressListGrouprow esriCTCursorPointer" }, divAddressListGroup);
                            featureName = domConstruct.create("div", { "innerHTML": feature.featureName, "class": "featureName" }, featureNamediv);
                            if (feature.geometry.type === "point") {
                                showDistanceNode = domConstruct.create("div", { "innerHTML": sharedNls.titles.showDistanceText, "class": "spanRouteLength" }, featureNamediv);
                                //handler for show route button click
                                on.once(showDistanceNode, "click", lang.hitch(this, function () {
                                    this._onShowDistanceClicked(feature, showDistanceNode);
                                }));
                            }
                            //handler for feature item click event
                            on(featureName, "click", lang.hitch(this, function () {
                                this._onFeatureItemClicked(feature, featureGroup, featureId);
                            }));
                        }));
                    }
                }));
                topic.publish("hideLoadingIndicatorHandler");
            } else {
                topic.publish("clearFeatureList");
                this._resetFeatureList();
                topic.publish("hideLoadingIndicatorHandler");
            }
        },

        /**
        * perform operation on clicking of feature item
        * @memberOf widgets/locator/locator
        */
        _onFeatureItemClicked: function (feature, featureGroup, featureId) {
            var featurePoint;
            topic.publish("hideInfoWindow");
            setTimeout(lang.hitch(this, function () {
                this._removeHighlightingFeature();
                if (feature.geometry.type === "point") {
                    featurePoint = feature.geometry;
                } else if (feature.geometry.type === "polygon") {
                    featurePoint = feature.geometry.getCentroid();
                } else if (feature.geometry.type === "polyline") {
                    featurePoint = this._getPolylineCenterPoints(feature.geometry);
                }
                this._createInfoWindowContent(featurePoint, featureGroup, featureId, false, true);
                //on selection feature from proximity result list, highlight feature if it is polygon
                if (feature.geometry.type === "polygon") {
                    this._highlightFeature(feature);
                }
                this.map.centerAndZoom(featurePoint, appGlobals.configData.ZoomLevel);
            }), 0);
        },

        /**
        * display distance value
        * @memberOf widgets/locator/locator
        */
        _onShowDistanceClicked: function (feature, showDistanceNode) {
            domClass.add(showDistanceNode, "routeDistanceLoading");
            domAttr.set(showDistanceNode, "innerHTML", "");
            domStyle.set(showDistanceNode, "cursor", "default");
            this._calculateRouteDistance(feature, showDistanceNode);
        },

        /**
        * handle toggling of expanding and collapsing nearby address list
        * @memberOf widgets/locator/locator
        */
        _toggleFeatureList: function (layerTitle, idx) {
            var sign;
            on(layerTitle, "click", lang.hitch(this, function (evt) {
                this.featureListScrollbar.resetScrollBar();
                sign = (query(".plusMinusFeatureTitle")[idx].innerHTML === "+") ? "-" : "+";
                query(".plusMinusFeatureTitle")[idx].innerHTML = sign;
                if (domClass.contains(query(".divAddressListGroup")[idx], "listExpand")) {
                    this.expandedListItem--;
                    domClass.remove(query(".divAddressListGroup")[idx], "listExpand");
                } else {
                    this.expandedListItem++;
                    domClass.add(query(".divAddressListGroup")[idx], "listExpand");
                }
                if (this.expandedListItem === 0) {
                    domClass.replace(query(".toggleExpandCollapse")[0], "collapse", "expand");
                    domAttr.set(query(".toggleExpandCollapse")[0], "title", appGlobals.configData.ExpandResultTooltip);
                } else if (query(".plusMinusFeatureTitle").length === this.expandedListItem) {
                    domClass.replace(query(".toggleExpandCollapse")[0], "expand", "collapse");
                    domAttr.set(query(".toggleExpandCollapse")[0], "title", appGlobals.configData.CollapseResultTooltip);
                }
            }));
        },

        /**
        * expand address from nearby address list
        * @memberOf widgets/locator/locator
        */
        _expandList: function () {
            array.forEach(query(".plusMinusFeatureTitle"), function (featureNode, idx) {
                domClass.replace(featureNode, "esriCTExpand", "esriCTCollapse");
                domClass.add(query(".divAddressListGroup")[idx], "listExpand");
                query(".plusMinusFeatureTitle")[idx].innerHTML = "-";
            });
            this.expandedListItem = query(".plusMinusFeatureTitle").length;
        },

        /**
        * collapse address from nearby address list
        * @memberOf widgets/locator/locator
        */
        _collapseList: function () {
            array.forEach(query(".plusMinusFeatureTitle"), function (featureNode, idx) {
                domClass.replace(featureNode, "esriCTCollapse", "esriCTExpand");
                domClass.remove(query(".divAddressListGroup")[idx], "listExpand");
                query(".plusMinusFeatureTitle")[idx].innerHTML = "+";
            });
            this.expandedListItem = 0;
        },

        /**
        * calculate route distance
        * @memberOf widgets/locator/locator
        */
        _calculateRouteDistance: function (pointFeature, distanceHolder) {
            var routeTask, routeParams, stopPushpin, locatorMarkupSymbol, pointGraphic, milesDistance;
            routeTask = new RouteTask(appGlobals.configData.RouteTask);
            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.returnRoutes = false;
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = Units.MILES;
            routeParams.outSpatialReference = new SpatialReference({ wkid: 102100 });
            stopPushpin = dojoConfig.baseURL + appGlobals.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(stopPushpin, appGlobals.configData.LocatorSettings.MarkupSymbolSize.width, appGlobals.configData.LocatorSettings.MarkupSymbolSize.height);
            pointGraphic = new Graphic(pointFeature.geometry, locatorMarkupSymbol, {}, null);
            routeParams.stops.features.push(appGlobals.shareOptions.addressLocation);
            routeParams.stops.features.push(pointGraphic);
            routeTask.solve(routeParams, lang.hitch(this, function (route) {
                milesDistance = route.routeResults[0].directions.totalLength.toFixed(1) + " miles";
                domAttr.set(distanceHolder, "innerHTML", milesDistance);
                domClass.add(distanceHolder, "totalDistance");
                domClass.remove(distanceHolder, "routeDistanceLoading");
            }));
        },

        /**
        * open link in a window on clicking of it
        * @memberOf widgets/locator/locator
        */
        _makeWindowOpenHandler: function (link) {
            return function () {
                window.open(link);
            };
        },

        /**
        * create infowindow content for selected address
        * @memberOf widgets/locator/locator
        */
        _createInfoWindowContent: function (mapPoint, featureArray, count, isInfoArrowClicked, isFeatureListClicked) {
            var layerInfoPopupSettings, divInfoDetailsTab, divInfoDetailsContainer, divInfoFieldValue, divInfoRow, i, infoTitle, attributes,
                spanWebsiteLink, domainValue, operationalLayer, fieldName, fieldValue, urlRegex, fieldInfo, isLink, screenPoint;

            if (featureArray[count].attr && featureArray[count].attr.attributes) {
                attributes = featureArray[count].attr.attributes;
            } else if (featureArray[count].attribute) {
                attributes = featureArray[count].attribute;
            } else {
                attributes = featureArray[count].attributes;
            }
            layerInfoPopupSettings = appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings[featureArray[count].layerIndex];
            // return from function if infoWindow setting is not configured for selected layer
            if (!layerInfoPopupSettings.QueryLayerId) {
                return;
            }
            this._setInfoWindowArrows(featureArray.length, count, isFeatureListClicked);
            //check if any of attribute value of feature is null or undefined
            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    if (!attributes[i] && attributes[i] !== 0) {
                        //set default value of attribute if it's value is not available
                        attributes[i] = appGlobals.configData.ShowNullValueAs;
                    }
                }
            }
            operationalLayer = layerInfoPopupSettings.layer.layerObject || layerInfoPopupSettings.layer;
            appGlobals.shareOptions.featureID = attributes[operationalLayer.objectIdField];
            appGlobals.shareOptions.layerID = layerInfoPopupSettings.QueryLayerId;
            divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
            divInfoDetailsContainer = domConstruct.create("div", { "class": "divInfoDetailsContainer" }, divInfoDetailsTab);
            if (layerInfoPopupSettings.hasDescription) {
                fieldValue = this._getDescription(attributes, layerInfoPopupSettings.layer);
                divInfoRow = domConstruct.create("div", { "class": "esriCTDisplayRow" }, divInfoDetailsContainer);
                domConstruct.create("div", {
                    "class": "esriCTPopupDescription",
                    "innerHTML": fieldValue
                }, divInfoRow);
            } else {
                urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
                for (i = 0; i < layerInfoPopupSettings.InfoWindowData.length; i++) {
                    divInfoRow = domConstruct.create("div", { "class": "esriCTDisplayRow" }, divInfoDetailsContainer);
                    isLink = false;
                    domConstruct.create("div", { "class": "esriCTDisplayField", "innerHTML": layerInfoPopupSettings.InfoWindowData[i].DisplayText }, divInfoRow);
                    divInfoFieldValue = domConstruct.create("div", { "class": "esriCTValueField" }, divInfoRow);
                    try {
                        //get field value from feature attributes
                        fieldValue = string.substitute(layerInfoPopupSettings.InfoWindowData[i].FieldName, attributes);
                    } catch (ex) {
                        fieldValue = appGlobals.configData.ShowNullValueAs;
                    }
                    if (fieldValue !== appGlobals.configData.ShowNullValueAs) {
                        //fetch field name
                        fieldName = layerInfoPopupSettings.InfoWindowData[i].FieldName.split("{")[1].split("}")[0];
                        //check if field type is date
                        fieldInfo = this._isDateField(fieldName, operationalLayer);
                        if (fieldInfo) {
                            fieldValue = this._setDateFormat(layerInfoPopupSettings.InfoWindowData[i], fieldValue);
                        } else {
                            //check if fild has coded values
                            fieldInfo = this._hasDomainCodedValue(fieldName, attributes, operationalLayer);
                            if (fieldInfo) {
                                if (fieldInfo.isTypeIdField) {
                                    fieldValue = fieldInfo.name;
                                } else {
                                    domainValue = this._domainCodedValues(fieldInfo, fieldValue);
                                    fieldValue = domainValue.domainCodedValue;
                                }
                            } else if (fieldValue.toString().match(urlRegex)) {
                                isLink = true;
                                spanWebsiteLink = domConstruct.create("span", { "class": "esriCTLink", "innerHTML": sharedNls.titles.moreInfo }, divInfoFieldValue);
                                on(spanWebsiteLink, "click", lang.hitch(this, this._makeWindowOpenHandler(fieldValue)));
                            } else {
                                // Check whether format for digit separator is available
                                if (layerInfoPopupSettings.InfoWindowData[i].format && fieldValue !== appGlobals.configData.ShowNullValueAs) {
                                    fieldValue = this._numberFormatCorverter(layerInfoPopupSettings.InfoWindowData[i], fieldValue);
                                }
                            }
                        }
                    }
                    if (!isLink) {
                        divInfoFieldValue.innerHTML = fieldValue;
                    }
                }
            }
            //infoWindow header title
            infoTitle = this._getInfoWindowTitle(layerInfoPopupSettings, attributes);

            //Create Attachments if layer has attachments and showAttachments is set to true in pop-up configuration.
            if (layerInfoPopupSettings.showAttachments) {
                if (appGlobals.shareOptions.featureID) {
                    this._showAttachments(operationalLayer, appGlobals.shareOptions.featureID, divInfoDetailsContainer);
                }
            }
            topic.publish("hideLoadingIndicatorHandler");
            appGlobals.selectedMapPoint = mapPoint;
            if (!isInfoArrowClicked && !appGlobals.extentShared) {
                this._removeHighlightingFeature();
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                this._centralizeInfowindowOnMap(infoTitle, divInfoDetailsTab, appGlobals.configData.InfoPopupWidth, appGlobals.configData.InfoPopupHeight);

            } else {
                if (appGlobals.extentShared > 0) {
                    appGlobals.extentShared--;
                }
                screenPoint = this.map.toScreen(appGlobals.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, appGlobals.configData.InfoPopupWidth, appGlobals.configData.InfoPopupHeight);
            }
        },

        /**
        * set infoWindow arrow's visibility
        * @param{object} layerInfoPopupSettings is layers' infowindow setting
        * @param{object} attributes contains feature attributes
        * @memberOf widgets/locator/locator
        */
        _getInfoWindowTitle: function (layerInfoPopupSettings, attributes) {
            var domainValue, infoTitle, fieldName, fieldInfo;
            try {
                //check if layer is a webmap operational layer
                if (layerInfoPopupSettings.layer.layerObject) {
                    infoTitle = this._getPopupTitle(attributes, layerInfoPopupSettings.layer);
                } else {
                    fieldName = layerInfoPopupSettings.InfoWindowHeaderField.split("{")[1].split("}")[0];
                    infoTitle = string.substitute(layerInfoPopupSettings.InfoWindowHeaderField, attributes);
                    //check if field type is date
                    fieldInfo = this._isDateField(fieldName, layerInfoPopupSettings.layer);
                    if (fieldInfo) {
                        //set format of field value
                        infoTitle = this._setDateFormat(fieldInfo, infoTitle);
                    } else {
                        //check if field has coded domain value
                        fieldInfo = this._hasDomainCodedValue(fieldName, attributes, layerInfoPopupSettings.layer);
                        if (fieldInfo) {
                            //check if field is a typeIdField
                            if (fieldInfo.isTypeIdField) {
                                infoTitle = fieldInfo.name;
                            } else {
                                //fetch domain values
                                domainValue = this._domainCodedValues(fieldInfo, infoTitle);
                                infoTitle = domainValue.domainCodedValue;
                            }
                        }
                    }
                }
            } catch (e) {
                infoTitle = appGlobals.configData.ShowNullValueAs;
            }
            return infoTitle;
        },

        /**
        * set infoWindow arrow's visibility
        * @param{int} featureArrayLength - is length of feature array
        * @param{int} count - current opened page
        * @param{boolean} isFeatureListClicked flag is true if feature is clicked on map not selected from list
        * @memberOf widgets/locator/locator
        */
        _setInfoWindowArrows: function (featureArrayLength, count, isFeatureListClicked) {
            if (featureArrayLength > 1 && (!isFeatureListClicked)) {
                if (featureArrayLength > 1 && count !== featureArrayLength - 1) {
                    domClass.add(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count);
                } else {
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                }
                if (count > 0 && count < featureArrayLength) {
                    domClass.add(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                } else {
                    domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                }
            } else {
                domStyle.set(query(".esriCTdivInfoWindowCarousal")[0], "display", "none");
                domClass.add(query(".esriCTInfoHeaderPanel")[0], "esriCTCarouselHidden");
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", "");
            }
        },

        /**
        * check if field type is date
        * @param{object} layerObj - layer data
        * @param{string} fieldName - current field
        * @memberOf widgets/locator/locator
        */
        _isDateField: function (fieldName, layerObj) {
            var i, isDateField = null;
            for (i = 0; i < layerObj.fields.length; i++) {
                if (layerObj.fields[i].name === fieldName && layerObj.fields[i].type === "esriFieldTypeDate") {
                    isDateField = layerObj.fields[i];
                    break;
                }
            }
            return isDateField;
        },


        /**
        * Format date value based on the format received from info popup
        * @param{object} dateFieldInfo
        * @param{string} dataFieldValue
        * @memberOf widgets/locator/locator
        */
        _setDateFormat: function (dateFieldInfo, dateFieldValue) {
            var dateObj = new Date(Number(dateFieldValue)), popupDateFormat;
            if (dateFieldInfo.format && dateFieldInfo.format.dateFormat) {
                popupDateFormat = this._getDateFormat(dateFieldInfo.format.dateFormat);
                dateFieldValue = dojoDateLocale.format(this._utcTimestampFromMs(dateObj), {
                    datePattern: popupDateFormat,
                    selector: "date"
                });
            } else {
                dateFieldValue = dateObj.toLocaleDateString();
            }
            return dateFieldValue;
        },

        /**
        * get date format supported by dojo from the format configured for poopup in webmap
        *@ configured date format
        * @memberOf widgets/locator/locator
        */
        _getDateFormat: function (type) {
            var dateFormat;
            switch (type) {
            case "shortDate":
                dateFormat = "MM/dd/yyyy";
                break;
            case "shortDateLE":
                dateFormat = "dd/MM/yyyy";
                break;
            case "longMonthDayYear":
                dateFormat = "MMMM dd, yyyy";
                break;
            case "dayShortMonthYear":
                dateFormat = "dd MMM yyyy";
                break;
            case "longDate":
                dateFormat = "EEEE, MMMM dd, yyyy";
                break;
            case "shortDateLongTime":
                dateFormat = "MM/dd/yyyy hh:mm:ss a";
                break;
            case "shortDateLELongTime":
                dateFormat = "dd/MM/yyyy hh:mm:ss a";
                break;
            case "shortDateShortTime":
                dateFormat = "MM/dd/yyyy hh:mm a";
                break;
            case "shortDateLEShortTime":
                dateFormat = "dd/MM/yyyy hh:mm a";
                break;
            case "shortDateShortTime24":
                dateFormat = "MM/dd/yyyy HH:mm";
                break;
            case "shortDateLEShortTime24":
                dateFormat = "dd/MM/yyyy HH:mm";
                break;
            case "longMonthYear":
                dateFormat = "MMMM yyyy";
                break;
            case "shortMonthYear":
                dateFormat = "MMM yyyy";
                break;
            case "year":
                dateFormat = "yyyy";
                break;
            default:
                dateFormat = "MMMM dd, yyyy";
            }
            return dateFormat;
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/locator/locator
        */
        _utcTimestampFromMs: function (utcMilliseconds) {
            return this._localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/locator/locator

        */
        _localToUtc: function (localTimestamp) { // returns Date
            return new Date(localTimestamp.getTime());
        },

        /**
        * Fetch field from popup info
        * @param{string} fieldName - current field
        * @param{object} popupInfo - operational layer popupInfo object
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getPopupInfo: function (fieldName, popupInfo) {
            var i, fieldInfo;
            for (i = 0; i < popupInfo.fieldInfos.length; i++) {
                if (popupInfo.fieldInfos[i].fieldName === fieldName) {
                    fieldInfo = popupInfo.fieldInfos[i];
                    break;
                }
            }
            return fieldInfo;
        },

        /**
        * Sets the info popup header
        * @param{array} featureSet
        * @param{object} operationalLayer - operational layer data
        * @memberOf widgets/locator/locator
        */
        _getPopupTitle: function (featureSet, operationalLayer) {
            var i, j, titleField, fieldValue, domainValue, popupTitle, titleArray, headerValue, headerFieldArray, fieldInfo, popupInfoValue;
            headerValue = null;
            // split info popup header fields
            popupTitle = operationalLayer.popupInfo.title.split("{");
            headerFieldArray = [];
            // if header contains more than 1 fields
            if (popupTitle.length > 1) {
                // get strings from header
                titleField = lang.trim(popupTitle[0]);
                for (i = 0; i < popupTitle.length; i++) {
                    // insert remaining fields in an array
                    titleArray = popupTitle[i].split("}");
                    if (i === 0) {
                        if (featureSet.hasOwnProperty(titleArray[0])) {
                            fieldValue = featureSet[titleArray[0]];
                            // concatenate string and first field from the header and insert in an array
                            headerFieldArray.push(fieldValue);
                        } else {
                            headerFieldArray.push(titleField);
                        }
                    } else {
                        for (j = 0; j < titleArray.length; j++) {
                            if (j === 0) {
                                if (featureSet.hasOwnProperty(titleArray[j])) {
                                    popupInfoValue = this._getPopupInfo(titleArray[j], operationalLayer.popupInfo);
                                    fieldValue = featureSet[lang.trim(titleArray[j])];
                                    if (fieldValue !== appGlobals.configData.ShowNullValueAs) {
                                        fieldInfo = this._isDateField(titleArray[j], operationalLayer.layerObject);
                                        if (fieldInfo) {
                                            //set date format
                                            fieldValue = this._setDateFormat(popupInfoValue, fieldValue);
                                        } else {
                                            fieldInfo = this._hasDomainCodedValue(titleArray[j], featureSet, operationalLayer.layerObject);
                                            if (fieldInfo) {
                                                if (fieldInfo.isTypeIdField) {
                                                    fieldValue = fieldInfo.name;
                                                } else {
                                                    domainValue = this._domainCodedValues(fieldInfo, fieldValue);
                                                    fieldValue = domainValue.domainCodedValue;
                                                }
                                            }
                                        }
                                        if (popupInfoValue.format) {
                                            // Check whether format for digit separator is available
                                            fieldValue = this._numberFormatCorverter(popupInfoValue, fieldValue);
                                        }
                                    }
                                    headerFieldArray.push(fieldValue);
                                }
                            } else {
                                headerFieldArray.push(titleArray[j]);
                            }
                        }
                    }
                }

                // form a string from the headerFieldArray array, to display in header
                for (j = 0; j < headerFieldArray.length; j++) {
                    if (headerValue) {
                        headerValue = headerValue + headerFieldArray[j];
                    } else {
                        headerValue = headerFieldArray[j];
                    }
                }
            } else {
                // if popup title is not empty, display popup field headerValue else display a configurable text
                if (lang.trim(operationalLayer.popupInfo.title) !== "") {
                    headerValue = operationalLayer.popupInfo.title;
                }
            }
            if (headerValue === null) {
                headerValue = appGlobals.configData.ShowNullValueAs;
            }
            return headerValue;
        },

        /**
        * Get description from layer pop up info
        * @param{array} featureSet
        * @param{object} operationalLayer - operational layer data
        * @memberOf widgets/locator/locator
        */
        _getDescription: function (featureSet, operationalLayerDetails) {
            var descriptionValue, i, field, splittedArrayForClosingBraces, popupInfoValue, fieldValue, fieldInfo, domainValue;
            // Assuming Fields will be configure within the curly braces'{}'
            // check if Custom Configuration has any fields Configured in it.
            if (operationalLayerDetails.popupInfo.description.split("{").length > 0) {
                // Add the data before 1st instance on curly '{' braces
                descriptionValue = operationalLayerDetails.popupInfo.description.split("{")[0];
                // Loop through the possible number of configured fields
                for (i = 1; i < operationalLayerDetails.popupInfo.description.split("{").length; i++) {
                    // check if string is having closing curly braces '}'. i.e. it has some field
                    if (array.indexOf(operationalLayerDetails.popupInfo.description.split("{")[i], "}") !== -1) {
                        splittedArrayForClosingBraces = operationalLayerDetails.popupInfo.description.split("{")[i].split("}");
                        field = string.substitute(splittedArrayForClosingBraces[0]);
                        popupInfoValue = this._getPopupInfo(field, operationalLayerDetails.popupInfo);
                        fieldInfo = this._isDateField(field, operationalLayerDetails.layerObject);
                        if (fieldInfo && featureSet[lang.trim(field)] !== appGlobals.configData.ShowNullValueAs) {
                            //set date format
                            fieldValue = this._setDateFormat(popupInfoValue, featureSet[lang.trim(field)]);
                            descriptionValue += fieldValue;
                        } else {
                            fieldInfo = this._hasDomainCodedValue(field, featureSet, operationalLayerDetails.layerObject);
                            if (fieldInfo) {
                                if (fieldInfo.isTypeIdField) {
                                    descriptionValue += fieldInfo.name;
                                } else {
                                    domainValue = this._domainCodedValues(fieldInfo, featureSet[lang.trim(field)]);
                                    descriptionValue += domainValue.domainCodedValue;
                                }
                            } else if (featureSet[field] || featureSet[field] === 0) {
                                // Check if the field is valid field or not, if it is valid then substitute its value.
                                fieldValue = featureSet[field];
                                if (popupInfoValue.format) {
                                    // Check whether format for digit separator is available
                                    fieldValue = this._numberFormatCorverter(popupInfoValue, fieldValue);
                                }
                                descriptionValue += fieldValue;
                            } else if (field === "") {
                                // if field is empty means only curly braces are configured in pop-up
                                descriptionValue += "{}";
                            }
                        }
                        splittedArrayForClosingBraces.shift();
                        // If splittedArrayForClosingBraces length is more than 1, then there are more closing braces in the string, so join the array with }
                        if (splittedArrayForClosingBraces.length > 1) {
                            descriptionValue += splittedArrayForClosingBraces.join("}");
                        } else {
                            descriptionValue += splittedArrayForClosingBraces.join("");
                        }
                    } else {
                        // If there is no closing bracket then add the rest of the string prefixed with '{' as we have split it with '{'
                        descriptionValue += "{" + operationalLayerDetails.popupInfo.description.split("{")[i];
                    }
                }
            } else {
                // No '{' braces means no field has been configured only Custom description is present in pop-up
                descriptionValue = operationalLayerDetails.popupInfo.description;
            }
            return descriptionValue;
        },

        /**
        * Check if field has domain coded values
        * @param{string} fieldName
        * @param{object} feature
        * @param{object} layerObject
        * @memberOf widgets/locator/locator
        */
        _hasDomainCodedValue: function (fieldName, feature, layerObject) {
            var i, j, fieldInfo;
            for (i = 0; i < layerObject.fields.length; i++) {
                if (layerObject.fields[i].name === fieldName) {
                    if (layerObject.fields[i].domain && layerObject.fields[i].domain.codedValues) {
                        fieldInfo = layerObject.fields[i];
                    } else if (layerObject.typeIdField) {
                        // get types from layer object, if typeIdField is available
                        for (j = 0; j < layerObject.types.length; j++) {
                            if (String(layerObject.types[j].id) === String(feature[layerObject.typeIdField])) {
                                fieldInfo = layerObject.types[j];
                                break;
                            }
                        }
                        // if types info is found for current value of typeIdField then break the outer loop
                        if (fieldInfo) {
                            break;
                        }
                    }
                }
            }
            // get domain values from layer types object according to the value of typeIdfield
            if (fieldInfo && fieldInfo.domains) {
                if (layerObject.typeIdField && layerObject.typeIdField !== fieldName) {
                    fieldInfo.isTypeIdField = false;
                    if (fieldInfo.domains.hasOwnProperty(fieldName)) {
                        fieldInfo.domain = {};
                        fieldInfo.domain = fieldInfo.domains[fieldName];
                    } else {
                        fieldInfo = null;
                    }
                } else {
                    // Set isTypeIdField to true if current field is typeIdField
                    fieldInfo.isTypeIdField = true;
                }
            }
            return fieldInfo;
        },

        /**
        * fetch domain coded value
        * @param{object} operationalLayerDetails
        * @param{string} fieldValue
        * @memberOf widgets/locator/locator
        */
        _domainCodedValues: function (operationalLayerDetails, fieldValue) {
            var k, codedValues, domainValueObj;
            domainValueObj = { domainCodedValue: appGlobals.configData.ShowNullValueAs };
            codedValues = operationalLayerDetails.domain.codedValues;
            if (codedValues) {
                // Loop for codedValue
                for (k = 0; k < codedValues.length; k++) {
                    // Check if the value is string or number
                    if (isNaN(codedValues[k].code)) {
                        // Check if the fieldValue and codedValue is equal
                        if (codedValues[k].code === fieldValue) {
                            fieldValue = codedValues[k].name;
                        }
                    } else if (codedValues[k].code === parseInt(fieldValue, 10)) {
                        fieldValue = codedValues[k].name;
                    }
                }
            }
            domainValueObj.domainCodedValue = fieldValue;
            return domainValueObj;
        },

        /**
        * Format number value based on the format received from info popup
        * @param{object} popupInfoValue
        * @param{string} fieldValue
        * @memberOf widgets/mapSettings/mapSettings
        */
        _numberFormatCorverter: function (popupInfoValue, fieldValue) {
            if (popupInfoValue.format && popupInfoValue.format.places !== null && popupInfoValue.format.places !== "" && !isNaN(parseFloat(fieldValue))) {
                fieldValue = parseFloat(fieldValue).toFixed(popupInfoValue.format.places);
                // Check if digit separator is available
                if (popupInfoValue.format.digitSeparator) {
                    fieldValue = this._convertNumberToThousandSeperator(fieldValue);
                }
            }
            return fieldValue;
        },

        /**
        * This function is used to convert number to thousand separator
        * @memberOf widgets/mapSettings/mapSettings
        */
        _convertNumberToThousandSeperator: function (number) {
            return number.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        },

        /**
        * Show attached images in the issue details
        * @param{array} operationalLayer
        * @param{object} parentDiv
        * @param{string} objectID
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showAttachments: function (operationalLayer, objectID, divInfoDetailsContainer) {
            var i, divInfoRow, attchmentNode;
            // Query attachments in layer
            operationalLayer.queryAttachmentInfos(objectID, lang.hitch(this, function (infos) {
                // If attachments found
                if (infos.length > 0) {
                    domConstruct.create("div", {
                        "innerHTML": sharedNls.titles.attachmentText,
                        "class": "esriCTDisplayField"
                    }, divInfoDetailsContainer);
                }
                for (i = 0; i < infos.length; i++) {
                    //create a div with pop up info description and add it to details div
                    divInfoRow = domConstruct.create("div", { "class": "esriCTDisplayRow" }, divInfoDetailsContainer);
                    attchmentNode = domConstruct.create("div", {
                        "innerHTML": infos[i].name,
                        "class": "esriCTLink"
                    }, divInfoRow);
                    domClass.add(attchmentNode, "esriCTAttchmentInfo");
                    domAttr.set(attchmentNode, "imgPath", infos[i].url);
                    on(attchmentNode, "click", lang.hitch(this, this._openAttachment));
                }
            }), function (err) {
                alert(err.message);
            });
        },

        /**
        * Show attachments in new window when user clicks on the attachment thumbnail
        * @param{object} evt
        * @memberOf widgets/mapSettings/mapSettings
        */
        _openAttachment: function (evt) {
            var node = evt.currentTarget || evt.srcElement, imgUrl;
            imgUrl = domAttr.get(node, "imgPath");
            window.open(imgUrl);
        },

        /**
        * set infowindow at the center of the screen
        * @memberOf widgets/locator/locator
        */
        _centralizeInfowindowOnMap: function (infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight) {
            var extentChanged, screenPoint;
            extentChanged = this.map.setExtent(this._calculateCustomMapExtent(appGlobals.selectedMapPoint));
            extentChanged.then(lang.hitch(this, function () {
                screenPoint = this.map.toScreen(appGlobals.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
            }));

        },

        /**
        * set infoWindow location on map
        * @memberOf widgets/locator/locator
        */
        _setInfoWindowLocation: function () {
            if (appGlobals.shareOptions.infoWindowIsShowing) {
                setTimeout(lang.hitch(this, function () {
                    this.map.setExtent(this._calculateCustomMapExtent(appGlobals.selectedMapPoint));
                    topic.publish("setMapTipPosition");
                }), 1000);
            }
        },

        /**
        * calculate extent of map
        * @memberOf widgets/locator/locator
        */
        _calculateCustomMapExtent: function (mapPoint) {
            var width, height, diff, ratioHeight, ratioWidth, totalYPoint, xmin, ymin, xmax, ymax;
            width = this.map.extent.getWidth();
            height = this.map.extent.getHeight();
            diff = 0;
            ratioHeight = height / this.map.height;
            ratioWidth = width / this.map.width;
            totalYPoint = appGlobals.configData.InfoPopupHeight + 30 + 61;
            xmin = mapPoint.x - (width / 2);
            if (dojoWindow.getBox().w >= 680) {
                ymin = mapPoint.y - height + (ratioHeight * totalYPoint);
                xmax = xmin + width + diff * ratioWidth;
            } else {
                ymin = mapPoint.y - (height / 2);
                xmax = xmin + width;
            }
            ymax = ymin + height;
            return new GeometryExtent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        },

        /**
        * reset locate container
        * @memberOf widgets/locator/locator
        */
        _resetLocateContainer: function () {
            domConstruct.empty(this.divAddressResults);
            domConstruct.empty(this.divSelectedFeatureList);
            domStyle.set(this.divSelectedFeature, "display", "none");
            if (query('.esriCTDivLegendBox')[0]) {
                domStyle.set(query('.esriCTDivLegendBox')[0], "zIndex", "1000");
                domClass.remove(query('.esriCTDivLegendInnerBox')[0], "esriCTRightBorderNone");
            }
            domStyle.set(query(".esriCTAddressScrollContent")[0], "display", "none");
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearch-select");
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            if (query(".esriControlsBR")[0]) {
                domClass.remove(query(".esriControlsBR")[0], "esriLogoShiftRight");
            }
            domClass.remove(this.divAddressContent, "esriCTAddressHolderHeight");
            topic.publish("setMaxLegendLength");
            this.txtAddress.blur();
        },

        /**
        * remove highlighting from earlier selected feature
        * @memberOf widgets/locator/locator
        */
        _removeHighlightingFeature: function () {
            var gLayer = this.map.getLayer("esriGraphicsLayerMapSettings");
            if (this.selectedPolygon) {
                gLayer.remove(this.selectedPolygon);
            }
        },

        /**
        * highlight selected feature
        * @memberOf widgets/locator/locator
        */
        _highlightFeature: function (feature) {
            var gLayer, symbolColor, outlineColor, customPolygon;
            gLayer = this.map.getLayer("esriGraphicsLayerMapSettings");
            symbolColor = outlineColor = new Color(appGlobals.configData.Workflows[appGlobals.workFlowIndex].FeatureHighlightColor);
            symbolColor.a = 0.6;
            customPolygon = {
                "geometry": feature.geometry,
                "symbol": {
                    "color": symbolColor,
                    "outline": {
                        "color": outlineColor,
                        "width": 1,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    },
                    "type": "esriSFS",
                    "style": "esriSFSSolid"
                }
            };
            this.selectedPolygon = new Graphic(customPolygon);
            gLayer.add(this.selectedPolygon);
        },

        /**
        * set address for sharing
        * @memberOf widgets/locator/locator
        */
        _shareAddress: function () {
            var sharedLocation, mapPoint, currentExtSplit, currentExt, currentExtent, sharedLayer, queryTask, queryFeature, featureObjId, currentTime, pointDecode, decodeMapPoint, featureGeometry;
            //display shared search address result
            if (window.location.toString().split("$locationPoint=").length > 1) {
                appGlobals.extentShared++;
                this._showLocateContainer();
                sharedLocation = window.location.toString().split("$locationPoint=")[1].split("$")[0];
                pointDecode = decodeURIComponent(sharedLocation).split(",");
                mapPoint = new Point(parseFloat(pointDecode[0]), parseFloat(pointDecode[1]), this.map.spatialReference);
                this._locateAddressOnMap(mapPoint);
            }

            //display shared extent on map
            if (window.location.toString().split("$extent=").length > 1) {
                currentExtent = window.location.toString().split("$extent=")[1].split("$")[0];
                if (currentExtent) {
                    currentExtSplit = decodeURIComponent(currentExtent).split(',');
                    currentExt = new GeometryExtent(parseFloat(currentExtSplit[0]), parseFloat(currentExtSplit[1]), parseFloat(currentExtSplit[2]), parseFloat(currentExtSplit[3]), this.map.spatialReference);
                    this.map.setExtent(currentExt);
                }
            }

            //display infowindow if shared from map click
            if (window.location.toString().split("$mapClickPoint=").length > 1) {
                appGlobals.extentShared++;
                appGlobals.sharedInfowindow = true;
                mapPoint = window.location.toString().split("$mapClickPoint=")[1].split("$")[0];
                decodeMapPoint = decodeURIComponent(mapPoint).split(",");
                appGlobals.shareOptions.mapClickedPoint = new Point([decodeMapPoint[0], decodeMapPoint[1]], this.map.spatialReference);
                setTimeout(lang.hitch(this, function () {
                    topic.publish("showInfoWindowOnMap", appGlobals.shareOptions.mapClickedPoint);
                }), 2000);
            }

            //display infow window if shared from proximity result
            if (window.location.toString().split("$layerID=").length > 1) {
                sharedLayer = parseFloat(window.location.toString().split("$layerID=")[1]);
                appGlobals.sharedInfowindow = true;
                array.some(appGlobals.configData.Workflows[appGlobals.workFlowIndex].InfowindowSettings, lang.hitch(this, function (layer, infoIndex) {
                    if (layer.QueryLayerId && Number(layer.QueryLayerId) === sharedLayer) {
                        currentTime = new Date().getTime().toString() + infoIndex;
                        appGlobals.extentShared++;
                        queryTask = new QueryTask(layer.InfoQueryURL);
                        queryFeature = new Query();
                        featureObjId = window.location.toString().split("$featureID=")[1].split("$")[0];
                        queryFeature.where = "OBJECTID=" + parseInt(featureObjId, 10) + " AND " + currentTime + "=" + currentTime;
                        queryFeature.outSpatialReference = this.map.spatialReference;
                        queryFeature.returnGeometry = true;
                        queryFeature.outFields = ["*"];
                        queryTask.execute(queryFeature, lang.hitch(this, function (featureSet) {
                            featureSet.features[0].layerIndex = infoIndex;
                            if (featureSet.features[0].geometry.type === "point") {
                                featureGeometry = featureSet.features[0].geometry;
                            } else if (featureSet.features[0].geometry.type === "polygon") {
                                featureGeometry = featureSet.features[0].geometry.getCentroid();
                            } else if (featureSet.features[0].geometry.type === "polyline") {
                                featureGeometry = this._getPolylineCenterPoints(featureSet.features[0].geometry);
                            }
                            this._createInfoWindowContent(featureGeometry, featureSet.features, 0, false, true);
                            if (featureSet.features[0].geometry.type === "polygon") {
                                this._highlightFeature(featureSet.features[0]);
                            }
                        }), function (error) {
                            console.log(error);
                        });
                        return false;
                    }
                }));
            }
            //display shared search address in address panel
            if (window.location.toString().split("$searchText=").length > 1) {
                this.txtAddress.value = decodeURIComponent(window.location.toString().split("$searchText=")[1].split("$")[0]);
                appGlobals.shareOptions.searchText = this.txtAddress.value;
            }
        },

        /**
        * get center points from the polyline path
        * @memberOf widgets/locator/locator
        */
        _getPolylineCenterPoints: function (featureGeometry) {
            var featurePoint, path = featureGeometry.paths[0];
            featurePoint = path[parseInt((path.length / 2), 10)];
            featurePoint = new Point(parseFloat(featurePoint[0]), parseFloat(featurePoint[1]), this.map.spatialReference);
            return featurePoint;
        },

        _resetAddressContainer: function () {
            this._resetShareParameters();
            domStyle.set(this.divAddressScrollContainer, "display", "none");
            domStyle.set(this.noResultFound, "display", "none");
            this._setDefaultTextboxValue();
            this._resetLocateContainer();
        },

        /**
        * reset shared parameters
        * @memberOf widgets/locator/locator
        */
        _resetShareParameters: function () {
            appGlobals.shareOptions.addressLocation = appGlobals.shareOptions.infoWindowIsShowing = appGlobals.shareOptions.mapClickedPoint = appGlobals.shareOptions.searchText = null;
        }
    });
});

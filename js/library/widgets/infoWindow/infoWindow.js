﻿/*global define,dojo,dojoConfig,esri,alert,appGlobals */
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
    "dojo/on",
    "dojo/dom",
    "dojo/topic",
    "esri/domUtils",
    "esri/InfoWindowBase",
    "../scrollBar/scrollBar",
    "dojo/text!./templates/infoWindow.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "esri/tasks/query",
    "dojo/query",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dijit/_WidgetsInTemplateMixin"
], function (declare, domConstruct, domStyle, lang, on, dom, topic, domUtils, InfoWindowBase, ScrollBar, template, _WidgetBase, _TemplatedMixin, queryTask, query, sharedNls, _WidgetsInTemplateMixin) {
    return declare([InfoWindowBase, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        InfoShow: null,
        sharedNls: sharedNls,

        /**
        * create infoWindow widget
        *
        * @class
        * @name widgets/infoWindow/infoWindow
        */
        postCreate: function () {
            if (!this.infoWindowWidth) {
                this.infoWindowWidth = "100px";
            }
            if (!this.infoWindowHeight) {
                this.infoWindowHeight = "100px";
            }
            this.infoWindowContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.infoWindowContainer.appendChild(this.domNode);
            this._anchor = domConstruct.create("div", { "class": "esriCTdivTriangle" }, this.domNode);
            domUtils.hide(this.domNode);
            this.own(on(this.esriCTclosediv, "click", lang.hitch(this, function () {
                if (query(".map .logo-sm")) {
                    this.InfoShow = true;
                } else {
                    this.InfoShow = false;
                }
                appGlobals.shareOptions.mapClickedPoint  = null;
                domUtils.hide(this.domNode);
                appGlobals.shareOptions.infoWindowIsShowing = false;
                topic.publish("clearSelectedFeature");
            })));

            topic.subscribe("setMap", lang.hitch(this, function (map) {
                this.map = map;
            }));
            this.own(on(window, "resize", lang.hitch(this, function () {
                topic.publish("_setInfoWindowLocation");
            })));
            topic.subscribe("hideInfoWindow", lang.hitch(this, function () {
                this._hideInfoWindow();
            }));
            this.own(on(window, "orientationchange", lang.hitch(this, function () {
                if (appGlobals.shareOptions.infoWindowIsShowing) {
                    domUtils.hide(query(".esriCTinfoWindow")[0]);
                    domStyle.set(query(".esriCTinfoWindow")[0], "visibility", "hidden");
                    this.isShowing = false;
                    topic.publish("_setInfoWindowLocation");
                    setTimeout(lang.hitch(this, function () {
                        domUtils.show(query(".esriCTinfoWindow")[0]);
                        domStyle.set(query(".esriCTinfoWindow")[0], "visibility", "visible");
                        this.isShowing = true;
                    }), 1500);
                }
            })));
        },

        /**
        * show infowindow
        * @param {object} screenPoint to show infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        show: function (detailsTab, screenPoint) {
            var scrollContentHeight;
            this.InfoShow = false;
            if (this.divInfoDetailsScroll) {
                while (this.divInfoDetailsScroll.hasChildNodes()) {
                    this.divInfoDetailsScroll.removeChild(this.divInfoDetailsScroll.lastChild);
                }
            }
            if (this.infoContainerScrollbar) {
                this.infoContainerScrollbar.removeScrollBar();
            }

            scrollContentHeight = appGlobals.configData.InfoPopupHeight - 50;
            domStyle.set(this.divInfoScrollContent, "height", scrollContentHeight + "px");
            this.setLocation(screenPoint);
            this.divInfoDetailsScroll.appendChild(detailsTab);
            this.infoContainerScrollbar = new ScrollBar({
                domNode: this.divInfoScrollContent
            });
            this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
            this.infoContainerScrollbar.createScrollBar();
            while (this.infoContainerScrollbar.domNode.children.length > 1) {
                this.infoContainerScrollbar.domNode.removeChild(this.infoContainerScrollbar.domNode.firstChild);
            }
        },

        /**
        * resize infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        resize: function (width, height) {
            this.infoWindowWidth = width;
            this.infoWindowHeight = height;
            domStyle.set(this.domNode, {
                width: width + "px",
                height: height + "px"
            });
        },

        /**
        * set title of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setTitle: function (infoTitle) {
            if (infoTitle.length > 0) {
                this.divInfoHeaderPanel.innerHTML = "";
                this.divInfoHeaderPanel.innerHTML = infoTitle;
                this.divInfoHeaderPanel.title = infoTitle;
            } else {
                this.divInfoHeaderPanel.innerHTML = appGlobals.configData.ShowNullValueAs;
            }
        },

        /**
        * set location of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setLocation: function (location) {
            if (location.spatialReference) {
                location = this.map.toScreen(location);
            }
            domStyle.set(this.domNode, {
                left: (location.x - (this.infoWindowWidth / 2)) + "px",
                bottom: (location.y + 15) + "px"
            });
            if (!this.InfoShow) {
                domUtils.show(this.domNode);
            }
            this.isShowing = true;
        },

        /**
        * hide infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        hide: function () {
            this.isShowing = false;
            this.onHide();
            domUtils.hide(this.domNode);
        },

        _hideInfoWindow: function () {
            appGlobals.shareOptions.infoWindowIsShowing = false;
            domUtils.hide(query(".esriCTinfoWindow")[0]);
            domStyle.set(query(".esriCTinfoWindow")[0], "visibility", "hidden");
            this.isShowing = false;
            appGlobals.shareOptions.mapClickedPoint  = null;
        },

        /**
        * hide infowindow container
        * @memberOf widgets/infoWindow/infoWindow
        */
        _hideInfoContainer: function () {
            this.own(on(this.esriCTclosediv, "click", lang.hitch(this, function () {
                domUtils.hide(this.domNode);
            })));
        }
    });
});

/*global define,dojo,dojoConfig,esri,appGlobals */
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
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/text!./templates/splashScreenTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "../scrollBar/scrollBar",
    "dojo/query",
    "dojo/topic",
    "dojo/dom"
], function (declare, domConstruct, domStyle, lang, domClass, domAttr, on, domGeom, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, scrollBar, query, topic, dom) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        currentIndex: null,
        splashScreenScrollbar: null,
        currentWorkflow: null,
        /**
        * create splashScreen widget
        *
        * @class
        * @name widgets/splashScreen/splashScreen
        */
        postCreate: function () {
            var holder, i, innercontainer, workflowContainer;
            this.showSplashScreenDialog();
            on(this.splashScreenScrollBarOuterContainer, "click", lang.hitch(this, function () {
                if (appGlobals.workFlowIndex && appGlobals.seletedWorkflow) {
                    domStyle.set(this.domNode, "display", "none");
                }
            }));

            on(this.splashScreenWorkflowsContainer, "click", lang.hitch(this, function (evt) {
                evt.stopPropagation();
            }));

            /**
            * create UI for splashscreen
            * @memberOf widgets/splashScreen/splashScreen
            */
            this.domNode = domConstruct.create("div", { "class": "esriGovtLoadSpashScreen" }, document.body);
            this.domNode.appendChild(this.splashScreenScrollBarOuterContainer);
            domConstruct.create("div", { "class": "esriGovtLoadingIndicator", "id": "splashscreenlodingIndicator" }, this.splashScreenScrollBarOuterContainer);
            holder = domConstruct.create("div", { "class": "holder", "id": "splashscreenUList" }, this.splashScreenScrollBarContainer);
            for (i = 0; i < appGlobals.configData.Workflows.length; i++) {
                workflowContainer = domConstruct.create("div", { "class": "workflowContainer" }, holder);
                innercontainer = domConstruct.create("div", { "class": "innerSlide", "index": i, "key": appGlobals.configData.Workflows[i].Name }, workflowContainer);
                domConstruct.create("div", { "innerHTML": appGlobals.configData.Workflows[i].Name, "class": "esriCTWorkflowText" }, innercontainer);
                domStyle.set(innercontainer, "backgroundColor", appGlobals.configData.Workflows[i].BgColor);
                domStyle.set(innercontainer, "backgroundImage", 'url(' + appGlobals.configData.Workflows[i].SplashscreenImage + ')');
                this.own(on(innercontainer, "click", lang.hitch(this, "_setWorkflowParameter")));
            }
            this.own(on(this.splashscreenPreviousPage, "click", lang.hitch(this, function () {
                if (!domClass.contains(this.splashscreenPreviousPage, "esriPrevDisabled")) {
                    this._slideSplashScreenPage(false);
                }
            })));

            this.own(on(this.splashscreenNextPage, "click", lang.hitch(this, function () {
                if (!domClass.contains(this.splashscreenNextPage, "esriNextDisabled")) {
                    this._slideSplashScreenPage(true);
                }
            })));

            this._setSplashContainerWidth();
            if (i <= 3) {
                domClass.add(this.splashscreenNextPage, "esriNextDisabled");
            }
        },

        /**
        * set parameters for selected workflow
        * @memberOf widgets/splashScreen/splashScreen
        */
        _setWorkflowParameter: function (evt) {
            var key, currentWorkflow;
            key = domAttr.get(evt.currentTarget, "key");
            currentWorkflow = domAttr.get(evt.currentTarget, "index");
            this._setWorkflow(key, currentWorkflow);
        },

        /**
        * set splashContainer width
        * @memberOf widgets/splashScreen/splashScreen
        */
        _setSplashContainerWidth: function () {
            var slideWidth, outerSplashContainerWidth;
            if (query('.workflowContainer')[0]) {
                slideWidth = domStyle.get(query('.workflowContainer')[0], "width") * appGlobals.configData.Workflows.length;
                domStyle.set(dom.byId("splashscreenUList"), "width", slideWidth + 'px');
            }
            if (appGlobals.configData.Workflows.length < 3) {
                domStyle.set(this.splashScreenScrollBarContainer, "width", slideWidth + 'px');
                outerSplashContainerWidth = slideWidth + 2 * domStyle.get(query('.esriPrevious')[0], "width") + 10;
                domStyle.set(this.splashScreenDialogContainer, "width", outerSplashContainerWidth + 'px');
            }
            domStyle.set(this.splashScreenLableDiv, "width", slideWidth + 'px');
        },
        /**
        * load selected workflow
        * @memberOf widgets/splashScreen/splashScreen
        */
        _setWorkflow: function (key, currentWorkflow) {
            if (appGlobals.seletedWorkflow === key && appGlobals.workFlowIndex === currentWorkflow) {
                this._hideSplashScreenDialog();
                return;
            }
            appGlobals.workFlowIndex = currentWorkflow;
            appGlobals.seletedWorkflow = key;
            this._selectWorkflow(key);
            this._hideSplashScreenDialog();
            this.mapObject._clearMapGraphics();
            if (appGlobals.configData.Workflows[currentWorkflow].WebMapId && lang.trim(appGlobals.configData.Workflows[currentWorkflow].WebMapId).length !== 0) {
                topic.publish("initializeWebmap");
                topic.publish("loadingIndicatorHandler");
            } else {
                topic.publish("loadBasemapToggleWidget");
            }
        },

        /**
        * show splash screen dialog
        * @memberOf widgets/splashScreen/splashScreen
        */
        showSplashScreenDialog: function (map) {
            if (map) {
                this.mapObject = map;
                domStyle.set(this.domNode, "display", "block");
                this.splashScreenLableDiv.innerHTML = appGlobals.configData.SplashScreen.SplashScreenContent;
            }
        },

        /**
        * set workflow in app url
        * @memberOf widgets/splashScreen/splashScreen
        */
        _selectWorkflow: function (Workflows, share) {
            var url, j;
            this._removeParamFromAppUrl(Workflows);
            url = "?app=" + Workflows;
            location.hash = url;
            this._applicationThemeLoader();
            if (!share) {
                for (j = 0; j < appGlobals.configData.Workflows.length; j++) {
                    domClass.remove(query("." + appGlobals.configData.Workflows[j].Name)[0], "esriCTApplicationHeaderTextSelected");
                    domClass.add(query("." + appGlobals.seletedWorkflow)[0], "esriCTApplicationHeaderTextSelected");
                }
            }
        },

        /**
        * remove parameters from application url
        * @memberOf widgets/splashScreen/splashScreen
        */
        _removeParamFromAppUrl: function (Workflows) {
            var href = parent.location.href.split('?');
            if (href.length > 1) {
                if (history.pushState) {
                    history.pushState({ "id": 1 }, Workflows, href[0]);
                } else {
                    window.location.href = href[0] + "#?app=" + Workflows;
                }
            }
        },
        /**
        * load theme for selected workflow
        * @memberOf widgets/splashScreen/splashScreen
        */
        _applicationThemeLoader: function () {
            if (appGlobals.configData.Workflows[appGlobals.workFlowIndex].ThemeColor) {
                if (dom.byId("theme")) {
                    domAttr.set(dom.byId("theme"), "href", appGlobals.configData.Workflows[appGlobals.workFlowIndex].ThemeColor);
                }
            }
        },

        /**
        * load selected workfow from app url
        * @memberOf widgets/splashScreen/splashScreen
        */
        _loadSelectedWorkflow: function (Workflows, map) {
            var i;
            this.mapObject = map;
            appGlobals.seletedWorkflow = Workflows;
            for (i = 0; i < appGlobals.configData.Workflows.length; i++) {
                if (appGlobals.configData.Workflows[i].Name.toUpperCase() === Workflows.toUpperCase()) {
                    appGlobals.workFlowIndex = i.toString();
                    break;
                }
            }
            if (appGlobals.workFlowIndex) {
                this._applicationThemeLoader();
                if (appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId && lang.trim(appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId).length !== 0) {
                    setTimeout(function () {
                        topic.publish("initializeWebmap");
                        topic.publish("loadingIndicatorHandler");
                    }, 2000);
                } else {
                    topic.publish("loadBasemapToggleWidget");
                }
            } else {
                this.showSplashScreenDialog(map);
            }
        },

        /**
        * hide splash screen dialog
        * @memberOf widgets/splashScreen/splashScreen
        */
        _hideSplashScreenDialog: function () {
            domStyle.set(this.domNode, "display", "none");
        },

        /**
        * set splash screen slider position
        * @memberOf widgets/splashScreen/splashScreen
        */
        _slideSplashScreenPage: function (isSlideNext) {
            var pageWidth, left;
            pageWidth = domStyle.get(query(".workflowContainer")[0], "width");
            left = domStyle.get(dom.byId("splashscreenUList"), "marginLeft");
            if (isSlideNext) {
                left = left - pageWidth;
            } else {
                left = left + pageWidth;
            }
            dom.byId("splashscreenUList").style.marginLeft = left + 'px';
            this._slidePage(isSlideNext);
        },

        /**
        * slide splash screen page
        * @memberOf widgets/splashScreen/splashScreen
        */
        _slidePage: function (slideLeft) {
            if (slideLeft) {
                this.currentIndex--;
            } else {
                this.currentIndex++;
            }
            this._setArrowVisibility();
        },

        /**
        * set splash screen arrow visibility
        * @memberOf widgets/splashScreen/splashScreen
        */
        _setArrowVisibility: function () {
            if (this.currentIndex === 0) {
                domClass.remove(this.splashscreenNextPage, "esriNextDisabled");
                domClass.add(this.splashscreenPreviousPage, "esriPrevDisabled");
            } else if (this.currentIndex === -1) {
                domClass.add(this.splashscreenNextPage, "esriNextDisabled");
                domClass.remove(this.splashscreenPreviousPage, "esriPrevDisabled");
            }
        }
    });
});

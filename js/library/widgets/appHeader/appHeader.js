/*global define,dojo,dojoConfig,esri,alert ,appGlobals*/
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
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/query",
    "dojo/text!./templates/appHeaderTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin"
], function (declare, domConstruct, lang, array, domAttr, on, dom, domClass, domStyle, topic, query, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        /**
        * create header panel
        *
        * @param {string} appGlobals.configData.ApplicationName Application name specified in configuration file
        *
        * @class
        * @name widgets/appHeader/appHeader
        */
        postCreate: function () {
            var applicationHeaderDiv, i, workflowSpan, applicationName = "";
            topic.subscribe("loadingIndicatorHandler", (lang.hitch(this, function () {
                this._showProgressIndicator();
            })));
            topic.subscribe("hideLoadingIndicatorHandler", (lang.hitch(this, function () {
                this._hideProgressIndicator();
            })));

            /**
            * add applicationHeaderParentContainer to div for header panel and append to esriCTParentDivContainer container
            *
            * applicationHeaderParentContainer container for application header
            * @member {div} applicationHeaderParentContainer
            * @private
            * @memberOf widgets/appHeader/appHeader
            */
            for (i = 0; i < appGlobals.configData.Workflows.length; i++) {
                applicationName = applicationName + appGlobals.configData.Workflows[i].Name + " ";
            }
            document.title = applicationName;
            applicationHeaderDiv = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            domConstruct.place(this.applicationHeaderParentContainer, applicationHeaderDiv);
            this._setApplicationTitle();
            this._loadApplicationHeaderIcon();
            /**
            * set browser header and application header to application name
            *
            * applicationHeaderName container for application name
            * @member {div} applicationHeaderName
            * @private
            * @memberOf widgets/appHeader/appHeader
            */
            for (i = 0; i < appGlobals.configData.Workflows.length; i++) {
                workflowSpan = domConstruct.create("span", { innerHTML: appGlobals.configData.Workflows[i].Name, index: i, title: appGlobals.configData.SwitchWorkflowsTooltip, "class": "esriCTApplicationHeaderTextTD " + appGlobals.configData.Workflows[i].Name }, this.divWorkflowNameContainer);
                on(workflowSpan, "click", lang.hitch(this, "_setSelectedWorkflow"));
            }
        },

        /**
        * set application name
        * @memberOf widgets/appHeader/appHeader
        */
        _setApplicationTitle: function () {

            if (lang.trim(appGlobals.configData.ApplicationName) !== "") {
                domAttr.set(this.applicationHeaderName, "innerHTML", appGlobals.configData.ApplicationName);
            }
        },
        _setSelectedWorkflow: function (evt) {
            if (appGlobals.seletedWorkflow !== evt.currentTarget.innerHTML) {
                appGlobals.workFlowIndex = domAttr.get(evt.currentTarget, "index");
                appGlobals.seletedWorkflow = evt.currentTarget.innerHTML;
                this.workflows._selectWorkflow(appGlobals.seletedWorkflow);
                this.mapObject._clearMapGraphics();
                if (appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId && lang.trim(appGlobals.configData.Workflows[appGlobals.workFlowIndex].WebMapId).length !== 0) {
                    topic.publish("initializeWebmap");
                    topic.publish("loadingIndicatorHandler");
                } else {
                    topic.publish("loadBasemapToggleWidget");
                }
                topic.publish("_resetAddressContainer");

            }
        },

        /**
        * append widgets to header panel
        * @param {object} widgets Contain widgets to be displayed in header panel
        * @memberOf widgets/appHeader/appHeader
        */
        loadHeaderWidgets: function (widgets) {
            var widgetPath;
            /**
            * applicationHeaderWidgetsContainer container for header panel widgets
            * @member {div} applicationHeaderWidgetsContainer
            * @private
            * @memberOf widgets/appHeader/appHeader
            */
            for (widgetPath in widgets) {
                if (widgets.hasOwnProperty(widgetPath)) {
                    if (widgets[widgetPath].domNode) {
                        domConstruct.place(widgets[widgetPath].domNode, this.applicationHeaderWidgetsContainer);
                    }
                }
            }
            if (appGlobals.workFlowIndex) {
                if (location.hash) {
                    domClass.add(query(".esriCTApplicationHeaderTextTD")[Number(appGlobals.workFlowIndex)], "esriCTApplicationHeaderTextSelected");
                    if (query(".esriCTExitImg")[0]) {
                        domStyle.set(query(".esriCTExitImg")[0], "display", "none");
                    }
                } else if (appGlobals.share || window.location.toString().search("app") > 0) {
                    domClass.add(query(".esriCTApplicationHeaderTextTD")[Number(appGlobals.workFlowIndex)], "esriCTApplicationHeaderTextSelected");
                }
                if (query(".esriCTExitImg")[0]) {
                    domStyle.set(query(".esriCTExitImg")[0], "display", "none");
                }
            }
        },

        /**
        * load Application Header Icon
        * @memberOf widgets/appHeader/appHeader
        */
        _loadApplicationHeaderIcon: function () {
            if (appGlobals.configData.ApplicationFavicon && lang.trim(appGlobals.configData.ApplicationFavicon).length !== 0) {
                this._loadIcons("shortcut icon", appGlobals.configData.ApplicationFavicon);
            }
            if (appGlobals.configData.ApplicationIcon && lang.trim(appGlobals.configData.ApplicationIcon).length !== 0) {
                this._loadIcons("apple-touch-icon-precomposed", appGlobals.configData.ApplicationIcon);
                this._loadIcons("apple-touch-icon", appGlobals.configData.ApplicationIcon);
                this.applicationHeaderIcon.src = dojoConfig.baseURL + appGlobals.configData.ApplicationIcon;
            }

        },
        _loadIcons: function (rel, iconPath) {
            var icon = domConstruct.create("link");
            icon.rel = rel;
            icon.type = "image/x-icon";
            icon.href = dojoConfig.baseURL + iconPath;
            document.getElementsByTagName('head')[0].appendChild(icon);
        },
        _showProgressIndicator: function () {
            domClass.replace(this.divLoadingIndicator, "displayBlockAll", "displayNoneAll");
        },
        _hideProgressIndicator: function () {
            domClass.replace(this.divLoadingIndicator, "displayNoneAll", "displayBlockAll");
        }
    });
});

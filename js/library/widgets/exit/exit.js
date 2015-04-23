/*global define,dojo,dojoConfig,esri,alert,appGlobals */
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
    "dojo/on",
    "dojo/topic",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin"
], function (declare, domConstruct, on, topic, lang, _WidgetBase, _TemplatedMixin) {

    //========================================================================================================================//

    return declare([_WidgetBase], {
      /**
        * create exit widget
        *
        * @class
        * @name widgets/exit/exit
        */
        postCreate: function () {
            this.domNode = domConstruct.create("div", { "title": appGlobals.configData.ExitButtonTooltip, "class": "esriCTExitImg" }, null);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                this._exitPage();
            })));
        },

        /**
        * exit from workflow and show splash screen
        * @memberOf widgets/exit/exit
        */
        _exitPage: function () {
            topic.publish("showSplashScreen");
        }
    });
});

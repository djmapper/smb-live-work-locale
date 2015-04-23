/*global define,dojo,dojoConfig,esri */
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
define({
    root: {
        titles: {
            webpageDispalyText: "Copy/paste HTML into your web page",//Shown in share panel to embed application into other html/frame
            moreInfo: "Website",//Shown as hyper-link text in infoWindow for link attribute
            sliderDisplayText: "Show results within <span class='esriCTSliderMinutes'> ${defaultMinute} mins ${mode}</span>",//Shown in address panel to display slider status and app mode(drive/walk).
            driveTimeText: "drive",//Shown above the slider to display drive mode.
            walkTimeText: "walk", //Shown above the slider to display walk mode.
            showDistanceText: "Show distance",//Shown in proximity result panel beside the feature info to get the route length from the searched location.
            attachmentText: "Attachments:"//Shown in indoWindow for the attachments.
        },
        errorMessages: {
            invalidSearch: "No results found",//Shown in address panel when no results found for searched address.
            falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes, This message may appear multiple times.",//Shown in alert if required field is not configured for address search.
            invalidLocation: "Current Location not found.", //Shown in alert message when current location is not found.
            invalidProjection: "Unable to plot current location on the map.", //Shown in alert message when app fails to project the location on map.
            widgetNotLoaded: "Fail to load widgets.", //Shown in alert message when app fails to load any widget
            shareLoadingFailed: "Unable to shorten URL, Bit.ly failed to load.",//Shown in alert message if app fails to create bitly URL
            noLegend: "No Legend Available",//Shown in legend panel if no legend symbol found for layers.
            noBasemap: "No Basemap Found",//Shown in alert message if no basemap found for the configured basemap setting
            portalUrlNotFound: "Portal URL cannot be empty",//Shown in alert message if portal URL is not configured for basemap switcher.
            noWorkflowConfigured: "No workflow available"//Shown in alert message if no workflow is visible/configured.
        },
        buttons: {
            embedding: "Embedding", //Shown next to icon for sharing the map embedding in website
            email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
        },
        tooltips: {
            locate: "Locate", //Command button to locate current address on map.
            share: "Share", //Command button to open share panel.
            help: "Help", //Command button to open help page.
            clear: "Clear", //Command button to clear address string from text box.
            search: "Search", //Command button to open address panel to search address.
            locateAddress: "LocateAddress", //Command button to search address for input address string.
            loadingText: "Loading...",//Shown in legend panel while querying for layer renderer.
            previous: "Previous",//Command button to slide legend panel to view previous legends.
            next: "Next", //Command button to slide legend panel to view next legends.
            infowindowCloseBtn: "Close"//Command button to close info window.
        }
    },

    es: true,
    fr: true,
    it: true
});

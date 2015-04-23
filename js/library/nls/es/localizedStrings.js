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
    titles: {
        webpageDispalyText: "@ES@ Copy/paste HTML into your web page",
        moreInfo: "@ES@ Website",
        sliderDisplayText: "@ES@ Show results within <span class='esriCTSliderMinutes'> ${defaultMinute} mins ${mode}</span>",
        driveTimeText: "@ES@ drive",
        walkTimeText: "@ES@ walk",
        showDistanceText: "@ES@ Show distance",
        attachmentText: "@ES@ Attachments:"
    },
    errorMessages: {
        invalidSearch: "@ES@ No results found",
        falseConfigParams: "@ES@ Required configuration key values are either null or not exactly matching with layer attributes, This message may appear multiple times.",
        invalidLocation: "@ES@ Current Location not found.",
        invalidProjection: "@ES@ Unable to plot current location on the map.",
        widgetNotLoaded: "@ES@ Fail to load widgets.",
        shareLoadingFailed: "@ES@ Unable to shorten URL, Bit.ly failed to load.",
        noLegend: "@ES@ No Legend Available",
        noBasemap: "@ES@ No Basemap Found",
        portalUrlNotFound: "@ES@ Portal URL cannot be empty",
        noWorkflowConfigured: "@ES@ No workflow available"
    },
    buttons: {
        embedding: "@ES@ Embedding", //Shown next to icon for sharing the map embedding in website
        email: "@ES@ Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        facebook: "@ES@ Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        twitter: "@ES@ Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        locate: "@ES@ Locate",
        share: "@ES@ Share",
        help: "@ES@ Help",
        clear: "@ES@ Clear",
        search: "@ES@ Search",
        locateAddress: "@ES@ LocateAddress",
        loadingText: "@ES@ Loading...",
        previous: "@ES@ Previous",
        next: "@ES@ Next",
        infowindowCloseBtn: "@ES@ Close"
    }
});

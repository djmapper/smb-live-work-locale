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
        webpageDispalyText: "@FR@ Copy/paste HTML into your web page",
        moreInfo: "@FR@ Website",
        sliderDisplayText: "@FR@ Show results within <span class='esriCTSliderMinutes'> ${defaultMinute} mins ${mode}</span>",
        driveTimeText: "@FR@ drive",
        walkTimeText: "@FR@ walk",
        showDistanceText: "@FR@ Show distance",
        attachmentText: "@FR@ Attachments:"
    },
    errorMessages: {
        invalidSearch: "@FR@ No results found",
        falseConfigParams: "@FR@ Required configuration key values are either null or not exactly matching with layer attributes, This message may appear multiple times.",
        invalidLocation: "@FR@ Current Location not found.",
        invalidProjection: "@FR@ Unable to plot current location on the map.",
        widgetNotLoaded: "@FR@ Fail to load widgets.",
        shareLoadingFailed: "@FR@ Unable to shorten URL, Bit.ly failed to load.",
        noLegend: "@FR@ No Legend Available",
        noBasemap: "@FR@ No Basemap Found",
        portalUrlNotFound: "@FR@ Portal URL cannot be empty",
        noWorkflowConfigured: "@FR@ No workflow available"
    },
    buttons: {
        embedding: "@FR@ Embedding", //Shown next to icon for sharing the map embedding in website
        email: "@FR@ Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        facebook: "@FR@ Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        twitter: "@FR@ Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        locate: "@FR@ Locate",
        share: "@FR@ Share",
        help: "@FR@ Help",
        clear: "@FR@ Clear",
        search: "@FR@ Search",
        locateAddress: "@FR@ LocateAddress",
        loadingText: "@FR@ Loading...",
        previous: "@FR@ Previous",
        next: "@FR@ Next",
        infowindowCloseBtn: "@FR@ Close"
    }
});

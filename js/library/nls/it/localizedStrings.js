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
        webpageDispalyText: "@IT@ Copy/paste HTML into your web page",
        moreInfo: "@IT@ Website",
        sliderDisplayText: "@IT@ Show results within <span class='esriCTSliderMinutes'> ${defaultMinute} mins ${mode}</span>",
        driveTimeText: "@IT@ drive",
        walkTimeText: "@IT@ walk",
        showDistanceText: "@IT@ Show distance",
        attachmentText: "@IT@ Attachments:"
    },
    errorMessages: {
        invalidSearch: "@IT@ No results found",
        falseConfigParams: "@IT@ Required configuration key values are either null or not exactly matching with layer attributes, This message may appear multiple times.",
        invalidLocation: "@IT@ Current Location not found.",
        invalidProjection: "@IT@ Unable to plot current location on the map.",
        widgetNotLoaded: "@IT@ Fail to load widgets.",
        shareLoadingFailed: "@IT@ Unable to shorten URL, Bit.ly failed to load.",
        noLegend: "@IT@ No Legend Available",
        noBasemap: "@IT@ No Basemap Found",
        portalUrlNotFound: "@IT@ Portal URL cannot be empty",
        noWorkflowConfigured: "@IT@ No workflow available"
    },
    buttons: {
        embedding: "@IT@ Embedding", //Shown next to icon for sharing the map embedding in website
        email: "@IT@ Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        facebook: "@IT@ Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        twitter: "@IT@ Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        locate: "@IT@ Locate",
        share: "@IT@ Share",
        help: "@IT@ Help",
        clear: "@IT@ Clear",
        search: "@IT@ Search",
        locateAddress: "@IT@ LocateAddress",
        loadingText: "@IT@ Loading...",
        previous: "@IT@ Previous",
        next: "@IT@ Next",
        infowindowCloseBtn: "@IT@ Close"
    }
});

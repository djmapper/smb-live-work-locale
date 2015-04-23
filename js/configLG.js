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
define([], function () {
    return {

        // This file contains various configuration settings for esri template
        //
        // Use this file to perform the following:
        //
        // 1.  Specify application Name                      - [ Tag(s) to look for: ApplicationName ]
        // 2.  Set path for application icon                 - [ Tag(s) to look for: ApplicationIcon ]
        // 3.  Set path for application favicon              - [ Tag(s) to look for: ApplicationFavicon ]
        // 4.  Set URL for help page                         - [ Tag(s) to look for: HelpURL ]
        // 5.  Set URL for logo                              - [ Tag(s) to look for: LogoURL ]
        // 6.  Set settings  for splash screen               - [ Tag(s) to look for: SplashScreen ]
        // 7.  Specify header widget settings                - [ Tag(s) to look for: AppHeaderWidgets ]
        // 8.  Set setting for base maps gallery             - [ Tag(s) to look for: BaseMapLayers ]
        // 9.  Geometry service setting                      - [ Tag(s) to look for: GeometryService ]
        // 10. RouteTask setting                             - [ Tag(s) to look for: RouteTask ]
        // 11. ServiceAreaTask setting                       - [ Tag(s) to look for: ServiceAreaTask ]
        // 12. set proxy url                                 - [ Tag(s) to look for: ProxyUrl ]
        // 13. Customize zoom level for address search       - [ Tag(s) to look for: ZoomLevel ]
        // 14. Customize InfoPopupHeight                     - [ Tag(s) to look for: InfoPopupHeight ]
        // 15. Customize InfoPopupWidth                      - [ Tag(s) to look for: InfoPopupWidth ]
        // 16. Specify ShowNullValueAs                       - [ Tag(s) to look for: ShowNullValueAs ]
        // 17. Customize DriveTimeSliderSettings             - [ Tag(s) to look for: DriveTimeSliderSettings ]
        // 18. set Legend visibility                         - [ Tag(s) to look for: ShowLegend ]
        // 19. Customize  DefaultExtent                      - [ Tag(s) to look for: DefaultExtent]
        // 20. Customize  Workflow                           - [ Tag(s) to look for: Workflow]
        // 21. Set URL for LocatorSettings                   - [ Tag(s) to look for: LocatorSettings ]
        // 22. Customize  DriveTimePolygonSymbology          - [ Tag(s) to look for: DriveTimePolygonSymbology ]
        // 23. Specify URLs for map sharing                  - [ Tag(s) to look for: MapSharingOptions,TinyURLServiceURL, TinyURLResponseAttribute, FacebookShareURL, TwitterShareURL, ShareByMailLink ]

        // ------------------------------------------------------------------------------------------------------------------------
        // GENERAL SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set application title
        ApplicationName: "Choose Naperville",
        // Set application icon path
        ApplicationIcon: "/js/library/themes/images/applicationIcon.png",

        // Set application Favicon path
        ApplicationFavicon: "/js/library/themes/images/favicon.ico",

        // Set URL of help page/portal
        HelpURL: "help.htm",

        // Set custom logo url, displayed in lower left corner. Set to empty "" to disable.
        LogoURL: "",

        // Set splash window content - Message that appears when the application starts
        SplashScreen: {
            IsVisible: true,
            SplashScreenContent: "Please select an app to continue"
        },

        //ExitButtonTooltip: Specify tooltip text for exit workflow button
        ExitButtonTooltip: "Exit",
        //DriveTimeButtonTooltip : Specify tooltip text for switch to drivetime button in distance slider
        DriveTimeButtonTooltip: "Drive Time",
        //WalkTimeButtonTooltip: Specify tooltip text for switch to walktime button in distance slider
        WalkTimeButtonTooltip: "Walk Time",
        //ExpandResultTooltip: Specify tooltip text for expand results button in results panel
        ExpandResultTooltip: "Expand Result",
        //CollapseResultTooltip: Specify tooltip text for collapse results button in results panel
        CollapseResultTooltip: "Collapse Result",
        //ResultsPanelTitleText: Specify label text for title of results panel
        ResultsPanelTitleText: "What's nearby?",
        //SwitchWorkflowsTooltip: Specify tooltip text for switch workflow buttons in header
        SwitchWorkflowsTooltip: "Click to switch workflows",

        // ------------------------------------------------------------------------------------------------------------------------
        // BASEMAP SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set options for basemap
        // Please note: All base-maps need to use the same spatial reference.

        // Specify URL to ArcGIS Portal REST API
        PortalAPIURL: "http://www.arcgis.com/sharing/rest/",
        // Specify the title of group that contains basemaps
        BasemapGroupTitle: "ArcGIS for Local Government TryItLive Basemaps",
        // Specify the user name of owner of the group that contains basemaps
        BasemapGroupOwner: "ArcGISforLocalGovTryIt",
        // Specify spatial reference for basemaps, since all basemaps need to use the same spatial reference
        BasemapSpatialReferenceWKID: 102100,
        // Specify path to image used to display the thumbnail for a basemap when portal does not provide it
        NoThumbnail: "js/library/themes/images/not-available.png",

        // ------------------------------------------------------------------------------------------------------------------------
        // GEOMETRY SERVICE SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Set geometry service URL
        GeometryService: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",

        // ------------------------------------------------------------------------------------------------------------------------
        //  ROUTE TASK SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set route task service URL
        RouteTask: "http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",

        // ------------------------------------------------------------------------------------------------------------------------
        //  SERVICE SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set Service Area Task  URL
        ServiceAreaTask: "http://route.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World",

        // Set proxy url
        ProxyUrl: "/proxy/proxy.ashx",

        // Following zoom level will be set for the map upon searching an address
        ZoomLevel: 16,

        //minimum height should be 250 for the info-popup in pixels
        InfoPopupHeight: 250,

        // Minimum width should be 300 for the info-popup in pixels
        InfoPopupWidth: 300,

        // Set string value to be shown for null or blank values
        ShowNullValueAs: "N/A",

        // ------------------------------------------------------------------------------------------------------------------------
        // DRIVE TIME SLIDER SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Specify drive/walk time slider settings
        // Possible Values for defaultMinutes should be between 0 to 60 and should be greater than minMinute and less than maxMinute
        // Possible Values for minMinute should be between 0 to 60 and less than maxMinute
        // Possible Values for maxMinute should be between 0 to 60 and greater than minMinute
        // Possible Values for discreteValues should be appropriate
        DriveTimeSliderSettings: {
            defaultMinutes: 10,
            minMinutes: 5,
            maxMinutes: 60,
            discreteValues: 12
        },

        //set legend panel visibility
        ShowLegend: true,

        // Initial map extent. Use comma (,) to separate values and dont delete the last comma
        // The coordinates must be specified in the basemap's coordinate system, usually WKID:102100, unless a custom basemap is used
        DefaultExtent: "-9817210,5127895,-9814287,5127905",

        // ------------------------------------------------------------------------------------------------------------------------
        // WORKFLOW SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure workflows

        // Name: Specify the workflow name. Workflow names have to be unique. It is displayed in the application header panel and splashscreen.
        // SplashscreenImage: Set image to be displayed in splashscreen for this workflow
        // ThemeColor: Set theme color
        // WebMapId: Choose if you want to use WebMap or Map Services for operational layers.
        // If using WebMap, specify WebMapId within quotes, otherwise leave this empty and configure operational layers
        // BgColor: Background color of workflow thumbnail in splashscreen
        // FeatureHighlightColor: To highlight selected polygon feature on map, when selected from proximity results
        // OperationalLayers: Configure operational layers for each workflow. The order of displaying layers is reversed on map. The last configured layer is displayed on top.
        // ServiceURL: URL of the layer.
        // LoadAsServiceType: Field to specify if the operational layers should be added as dynamic map service layer or feature layer.
        // Supported service types are 'dynamic' or 'feature'.
        // SearchSettings: Configure search settings for each workflow.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        // it should be the name of Map/Feature Service.
        // QueryLayerId: This is the layer index in the webmap or ArcGIS Map/Feature Service and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for search.
        // InfowindowSettings: Configure info-popup settings. The Title and QueryLayerId fields should be the same as configured in "Title" and "QueryLayerId" fields in SearchSettings.
        // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
        // it should be the name of Map/Feature Service.
        // QueryLayerId: Layer index used for performing queries.
        // InfoWindowHeader: Specify field for the info window header
        // ShowAllFields: When set to true, infowindow will display all fields from layer and InfoWindowData section is ignored
        // When set to false, only fields configured in InfoWindowData section will be displayed
        // InfoWindowData: Set the content to be displayed in the info-Popup. Define labels and field values.
        // These fields should be present in the layer referenced by 'QueryLayerId' specified under section 'SearchSettings'
        // DisplayText: Caption to be displayed instead of field alias names. Set this to empty string ("") if you wish to display field alias names as captions.
        // FieldName: Field used for displaying the value

        Workflows: [{
            Name: "LIVE",
            Visible: true,
            SplashscreenImage: "js/library/themes/images/live-img.png",
            ThemeColor: "js/library/themes/styles/blueTheme.css",
            WebMapId: "51bd8650f18842e7bd5aa7bf78abd9d7",
            BgColor: "#007ac2",
            FeatureHighlightColor: "#1C86EE",

            // ------------------------------------------------------------------------------------------------------------------------
            // SEARCH SETTINGS FOR THIS WORKFLOW
            // ------------------------------------------------------------------------------------------------------------------------

            // Title: In case of webmap implementations, it must match layer name specified in webmap and in case of operational layers
            // It should be the name of Map/Feature Service.
            // QueryLayerId: This is the layer index in the webmap or ArcGIS Map/Feature Service and is used for performing queries.
            // SearchDisplayTitle: This text is displayed in search results as the title to group results.
            // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
            // SearchExpression: Configure the query expression to be used for search.

            SearchSettings: [{
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Hospitals",
                QueryLayerId: "0",
                SearchDisplayTitle: "Hospitals",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Railroad Stations",
                QueryLayerId: "1",
                SearchDisplayTitle: "Railroad Stations",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Colleges",
                QueryLayerId: "2",
                SearchDisplayTitle: "Colleges",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Park and Recreation Areas",
                QueryLayerId: "3",
                SearchDisplayTitle: "Park and Recreation Areas",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Golf Courses",
                QueryLayerId: "4",
                SearchDisplayTitle: "Golf Courses",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Churches",
                QueryLayerId: "5",
                SearchDisplayTitle: "Churches",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Schools",
                QueryLayerId: "6",
                SearchDisplayTitle: "Schools",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Museums",
                QueryLayerId: "7",
                SearchDisplayTitle: "Museums",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Libraries",
                QueryLayerId: "8",
                SearchDisplayTitle: "Libraries",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Post Offices",
                QueryLayerId: "9",
                SearchDisplayTitle: "Post Offices",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }]

        }, {
            Name: "WORK",
            Visible: true,
            SplashscreenImage: "js/library/themes/images/work-img.png",
            ThemeColor: "js/library/themes/styles/greenTheme.css",
            WebMapId: "6c031b081b2b4c5996c514831d0c79b3",
            BgColor: "#028D6A",
            FeatureHighlightColor: "#1C86EE",
            SearchSettings: [{
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Railroad Stations",
                QueryLayerId: "1",
                SearchDisplayTitle: "Railroad Stations",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Colleges",
                QueryLayerId: "2",
                SearchDisplayTitle: "Colleges",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Post Offices",
                QueryLayerId: "9",
                SearchDisplayTitle: "Post Offices",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Corporate Headquarters",
                QueryLayerId: "10",
                SearchDisplayTitle: "Corporate Headquarters",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Retail Centers",
                QueryLayerId: "11",
                SearchDisplayTitle: "Retail Centers",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }]

        }, {
            Name: "LOCATE",
            Visible: true,
            SplashscreenImage: "js/library/themes/images/locate-img.png",
            ThemeColor: "js/library/themes/styles/orangeTheme.css",
            WebMapId: "3cc363d86ca0498197e6ab0c6a6391f6",
            BgColor: "#5C2E6F",
            FeatureHighlightColor: "#1C86EE",

            SearchSettings: [{
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Railroad Stations",
                QueryLayerId: "1",
                SearchDisplayTitle: "Railroad Stations",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Colleges",
                QueryLayerId: "2",
                SearchDisplayTitle: "Colleges",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Post Offices",
                QueryLayerId: "9",
                SearchDisplayTitle: "Post Offices",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Corporate Headquarters",
                QueryLayerId: "10",
                SearchDisplayTitle: "Corporate Headquarters",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "true",
                Title: "LiveWorkLocateTryItLive - Retail Centers",
                QueryLayerId: "11",
                SearchDisplayTitle: "Retail Centers",
                SearchDisplayFields: "${NAME}",
                SearchExpression: "UPPER(NAME) LIKE UPPER('${0}%')"
            }, {
                UnifiedSearch: "false",
                Title: "Tapestry_Households - ZIP Code",
                QueryLayerId: "2",
                SearchDisplayTitle: "ZIP Code",
                SearchDisplayFields: "${ID}",
                SearchExpression: "UPPER(ID) LIKE UPPER('${0}%')"
            }]
        }],


        // ------------------------------------------------------------------------------------------------------------------------
        // ADDRESS SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set locator settings such as locator symbol, size, display fields, match score
        // LocatorParameters: Parameters(text, outFields, maxLocations, bbox, outSR) used for address and location search.
        // AddressSearch: Candidates based on which the address search will be performed.
        // AddressMatchScore: Setting the minimum score for filtering the candidate results.
        // MaxResults: Maximum number of locations to display in the results menu.
        LocatorSettings: {
            DefaultLocatorSymbol: "/js/library/themes/images/redpushpin.png",
            MarkupSymbolSize: {
                width: 35,
                height: 35
            },
            DisplayText: "Address",
            LocatorDefaultAddress: "139 W Porter Ave Naperville IL 60540",
            LocatorParameters: {
                SearchField: "SingleLine",
                SearchBoundaryField: "searchExtent"
            },
            LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            LocatorOutFields: ["Addr_Type", "Type", "Score", "Match_Addr", "xmin", "xmax", "ymin", "ymax"],
            DisplayField: "${Match_Addr}",
            AddressMatchScore: {
                Field: "Score",
                Value: 80
            },
            FilterFieldName: 'Addr_Type',
            FilterFieldValues: ["StreetAddress", "StreetName", "PointAddress", "POI", "POSTAL"],
            MaxResults: 200
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // DRIVE TIME SYMBOLOGY SETTING
        // ------------------------------------------------------------------------------------------------------------------------
        // DriveTimePolygonSymbology: It shows symbology for polygon.
        // FillSymbolColor: It shows symbol color for feature.
        // FillSymbolTransparency: It shows transparency for symbol.
        // LineSymbolColor: It shows symbol color for line feature.
        // LineSymbolTransparency: it shows transparency for line.

        DriveTimePolygonSymbology: {
            FillSymbolColor: "255,255,102",
            FillSymbolTransparency: "0.4",
            LineSymbolColor: "255,255,102",
            LineSymbolTransparency: "1"
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // SETTINGS FOR MAP SHARING
        // ------------------------------------------------------------------------------------------------------------------------
        // Set URL for TinyURL service, and URLs for social media
        // MapSharingOptions: Allow user to share map using social media.
        // TinyURLServiceURL: Set URL for TinyURL service.
        // FacebookShareURL:  Allow user to share application using facebook.
        // TwitterShareURL:  Allow user to share application using twitter.
        // ShareByMailLink:  Allow user to share application using mail.

        MapSharingOptions: {
            TinyURLServiceURL: "https://api-ssl.bitly.com/v3/shorten?longUrl=${0}",
            FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Live%20Work%20Locate",
            TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=Live%20Work%20Locate ${0}",
            ShareByMailLink: "mailto:%20?subject=Check%20out%20this%20map!&body=${0}"
        },
        //-------------------------------------------------------------------------------------------------------------------
        // Header Widget Settings
        //-------------------------------------------------------------------------------------------------------------------
        // Set widgets settings such as widget title, widgetPath, mapInstanceRequired to be displayed in header panel
        // Title: Name of the widget, will displayed as title of widget in header panel
        // WidgetPath: path of the widget respective to the widgets package.
        // MapInstanceRequired: true if widget is dependent on the map instance.

        AppHeaderWidgets: [{
            WidgetPath: "widgets/locator/locator",
            MapInstanceRequired: true
        }, {
            WidgetPath: "widgets/geoLocation/geoLocation",
            MapInstanceRequired: true
        }, {
            WidgetPath: "widgets/share/share",
            MapInstanceRequired: true
        }, {
            WidgetPath: "widgets/help/help",
            MapInstanceRequired: false
        }, {
            WidgetPath: "widgets/exit/exit",
            MapInstanceRequired: false
        }]

    };
});

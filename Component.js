jQuery.sap.declare("ui.s2p.mm.purchorder.approve.POExtension_final.Component");
// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "ui.s2p.mm.purchorder.approve",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/MM_PO_APV" // we use a URL relative to our own component
		// extension application is deployed with customer namespace
});
this.ui.s2p.mm.purchorder.approve.Component.extend("ui.s2p.mm.purchorder.approve.POExtension_final.Component", {
	metadata: {
		version: "1.0",
		config: {
			"resourceBundle": "i18n/i18ncustom.properties",
			"titleResource": "app.Identity",
			"serviceConfig": {
				"name": "MM_PURCHASE_APPROVAL_SRV",
				"serviceUrl": "/sap/opu/odata/aag362/MM_PURCHASE_APPROVAL_SRV/"
			}
		},
		customizing: {
			"sap.ui.viewExtensions": {
				"ui.s2p.mm.purchorder.approve.view.S2": {
					"extListItemInfo": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "ui.s2p.mm.purchorder.approve.POExtension_final.view.S2_extListItemInfoCustom",
						"type": "XML"
					}
				}
			},
			"sap.ui.viewReplacements": {
				"ui.s2p.mm.purchorder.approve.view.S4": {
					"viewName": "ui.s2p.mm.purchorder.approve.POExtension_final.view.S4Custom",
					"type": "XML"
				}
			},
			"sap.ui.controllerExtensions": {
				"ui.s2p.mm.purchorder.approve.view.S4": {
					"controllerName": "ui.s2p.mm.purchorder.approve.POExtension_final.view.S4Custom"
				}
			}
		}
	}
});
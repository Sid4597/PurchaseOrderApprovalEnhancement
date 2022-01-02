jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.quickoverview.EmployeeLaunch");
jQuery.sap.require("ui.s2p.mm.purchorder.approve.util.Conversions");
jQuery.sap.require("sap.chart.Chart");
// jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.controller("ui.s2p.mm.purchorder.approve.POExtension_final.view.S4Custom", {
	sOrigin: "",
	sWorkitemID: "",
	sPoNumber: "",
	sItemNumber: "",
	onInit: function () {

		this.getView().getModel().setSizeLimit(1000000);
		if (!this.oApplication) {
			this.oApplication = sap.ca.scfld.md.app.Application.getImpl();
			this.oConfiguration = this.oApplication.oConfiguration;
			this.oConnectionManager = this.oApplication.getConnectionManager();
			this.resourceBundle = this.oApplication.getResourceBundle();
			this.oDataModel = this.oApplicationFacade.getODataModel();
		}
		this.oRouter.attachRouteMatched(function (e) {
			if (e.getParameter("name") === "itemDetails") {
				this.sOrigin = e.getParameter("arguments").SAP__Origin;
				this.sWorkitemID = e.getParameter("arguments").WorkitemID;
				this.sPoNumber = e.getParameter("arguments").PoNumber;
				this.sItemNumber = e.getParameter("arguments").ItemNumber;
				var i = "/WorkflowTaskCollection(SAP__Origin='" + this.sOrigin + "',WorkitemID='" + this.sWorkitemID + "')" +
					"/HeaderDetails/ItemDetails(SAP__Origin='" + this.sOrigin + "',PoNumber='" + this.sPoNumber + "',ItemNumber='" + this.sItemNumber +
					"')";
				var I = "/ItemDetailCollection(SAP__Origin='" + this.sOrigin + "',ItemNumber='" + this.sItemNumber + "',PoNumber='" + this.sPoNumber +
					"' )";
				var o = this.oDataModel.getProperty(I);
				var s = "";
				if (o) {
					s = o.ItemCategory;
				}
				var S = this.byId("SubcontractingTable");
				if (s === "3") {
					this.getView().bindElement(i, {
						expand: "Accountings,Notes,PricingConditions,Attachments,ServiceLines/Accountings,Limits/Accountings,Components"
					});
					this.getView().getElementBinding().attachEventOnce("dataReceived", function () {
						var c = [
							new sap.m.ObjectIdentifier({
								title: "{parts:[{path : 'Description'}, {path : 'Material'}], formatter : 'ui.s2p.mm.purchorder.approve.util.Conversions.IDFormatter'}"
							}),
							new sap.m.ObjectNumber({
								number: "{parts: [{path : 'Quantity'}], formatter : 'ui.s2p.mm.purchorder.approve.util.Conversions.formatQuantityWithoutUnit'}",
								numberUnit: "{BaseUnitDescription}"
							})
						];
						var t = new sap.m.ColumnListItem({
							cells: c
						});
						S.bindItems("Components", t, null, null);
						S.setVisible(true);
					}, this);
				} else {
					this.getView().bindElement(i, {
						expand: "Accountings,Notes,PricingConditions,Attachments,ServiceLines/Accountings,Limits/Accountings"
					});
					S.setVisible(false);
				}
				this.setLocalHeaderFooterOptions();

				this.getView().getModel().attachRequestCompleted(function (oEvent) {
					this.currentStock();
					var that = this;
					var oVendorCompareGraph = that.getView().byId("idVendorCompareGraph");
					var oPurchaseHistoryGraph = that.getView().byId("idPurchaseHistoryGraph");
					var oMovingAverageGraph = that.getView().byId("idMovingAverageGraph");
					var oStockValueGraph = that.getView().byId("idStockValueGraph");
					var oQuoteCompareTable = that.getView().byId("idQuoteCompareTable");

					if (oVendorCompareGraph.getVisible()) {
						oVendorCompareGraph.setVisible(false);
					}
					if (oPurchaseHistoryGraph.getVisible()) {
						oPurchaseHistoryGraph.setVisible(false);
					}
					if (oMovingAverageGraph.getVisible()) {
						oMovingAverageGraph.setVisible(false);
					}
					if (oStockValueGraph.getVisible()) {
						oStockValueGraph.setVisible(false);
					}
					if (oQuoteCompareTable.getVisible()) {
						oQuoteCompareTable.setVisible(false);
					}

				}, this);
			}
		}, this);
		if (this.extHookOnInit) {
			this.extHookOnInit();
		}

	},
	setLocalHeaderFooterOptions: function () {
		var t = this;
		var h = this._headerDetailCollection(this.sOrigin, this.sPoNumber);
		var i = this._itemDetailCollection(this.sOrigin, this.sItemNumber, this.sPoNumber);
		var I = this.oDataModel.getProperty("/" + h + "/ItemDetails");
		if (typeof I === "undefined") {
			this.navBack();
			return;
		}
		var l = I.length;
		var c = I.indexOf(i);
		var L = {
			onBack: function () {
				t.navBack();
			},
			oUpDownOptions: {
				iPosition: c,
				iCount: l,
				fSetPosition: function (n) {
					var p = I[n];
					var s = t.oDataModel.getProperty("/" + p).ItemNumber;
					t.oRouter.navTo("itemDetails", {
						SAP__Origin: t.sOrigin,
						WorkitemID: t.sWorkitemID,
						PoNumber: t.sPoNumber,
						ItemNumber: s
					}, true);
				},
				sI18NDetailTitle: "view.ItemDetails.title"
			}
		};
		if (this.extHookSetHeaderFooterOptions) {
			L = this.extHookSetHeaderFooterOptions(L);
		}
		this.setHeaderFooterOptions(L);
	},
	navBack: function () {
		if (this.sOrigin !== "" && this.sWorkitemID !== "") {
			var m = "WorkflowTaskCollection(SAP__Origin='" + this.sOrigin + "',WorkitemID='" + this.sWorkitemID + "')";
			this.oRouter.navTo("detail", {
				contextPath: m
			}, true);
		}
	},
	_refresh: function (c, e, d) {},
	onServiceItemPress: function (e) {
		var b = e.getSource().getBindingContext().getPath();
		var m = this.getView().getModel();

		this.oRouter.navTo("itemServiceLine", {
			SAP__Origin: this.getView().getBindingContext().getProperty("SAP__Origin"),
			WorkitemID: this.sWorkitemID,
			PoNumber: this.getView().getBindingContext().getProperty("PoNumber"),
			ItemNumber: this.getView().getBindingContext().getProperty("ItemNumber"),
			ServiceLineNumber: m.getProperty(b).ServiceLineNumber

		}, true);
	},
	onServiceLimitPress: function (e) {
		var b = e.getSource().getBindingContext().getPath();
		var m = this.getView().getModel();
		var d = b.substring(b.indexOf("LimitDescription='"), b.length);
		d = d.substring(d.indexOf("'") + 1, d.lastIndexOf("'"));
		this.oRouter.navTo("itemServiceLimit", {
			SAP__Origin: this.getView().getBindingContext().getProperty("SAP__Origin"),
			WorkitemID: this.sWorkitemID,
			PoNumber: this.getView().getBindingContext().getProperty("PoNumber"),
			ItemNumber: this.getView().getBindingContext().getProperty("ItemNumber"),
			LimitDescription: d
		}, true);
	},
	_headerDetailCollection: function (o, p) {
		var r = "HeaderDetailCollection(SAP__Origin='" + o + "',PoNumber='" + p + "')";
		return r;
	},
	_itemDetailCollection: function (o, i, p) {
		var r = "ItemDetailCollection(SAP__Origin='" + o + "',ItemNumber='" + i + "',PoNumber='" + p + "')";
		return r;
	},
	onAttachment: function (e) {
		ui.s2p.mm.purchorder.approve.util.Conversions.onAttachment(e);
	},
	onSenderPress: function (e) {
		this.openEmployeeLaunch(e, "CreatedByID");
	},
	openEmployeeLaunch: function (e, r) {
		var c = e.getSource();
		var t = this.resourceBundle.getText("BussinessCard.Employee");
		var o = function (d) {
			var a = d.results[0],
				E = {
					title: t,
					name: a.FullName,
					imgurl: ui.s2p.mm.purchorder.approve.util.Conversions.businessCardImg(a.Mime_Type, a.__metadata.media_src),
					department: a.Department,
					contactmobile: a.MobilePhone,
					contactphone: a.WorkPhone,
					contactemail: a.EMail,
					companyname: a.CompanyName,
					companyaddress: a.AddressString
				},
				b = new sap.ca.ui.quickoverview.EmployeeLaunch(E);
			b.openBy(c);
		};
		var O = e.getSource().getBindingContext().getProperty("SAP__Origin");
		var u = e.getSource().getBindingContext().getProperty(r);
		this.oDataModel = this.oConnectionManager.modelList[this.oConfiguration.getServiceList()[0].name];
		var f = "$filter=" + encodeURIComponent("=UserID eq '" + u + "' and SAP__Origin eq '" + O + "'");
		this.oDataModel.read("UserDetailsCollection", null, [f], true, jQuery.proxy(o, this), jQuery.proxy(this._onRequestFailed, this));
	},
	_onRequestFailed: function (e) {
		var m = "";
		var d = null;
		if (e.response && e.response.body !== "" && (e.response.statusCode === "400" || e.response.statusCode === "500")) {
			var M = JSON.parse(e.response.body);
			m = M.error.message.value;
		}
		if (m === "") {
			m = e.message;
			d = e.response.body;
		}
		sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: m,
			details: d
		});
	},
	currentStock: function () {
		var matId = this.getView().byId("matId").getText();
		var plantId = this.getView().byId("plantId").getText();
		var that = this;
		var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
		var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
		oModel.setUseBatch(false);
		var currentStock = "/CurrentStockSet?$filter=Material eq '" + matId + "' and Plant eq '" + plantId + "'";

		oModel.read(currentStock, {
			success: function (oData, response) {
				if (oData.results !== "undefined" || oData.results !== null) {
					var oJModel = new sap.ui.model.json.JSONModel();
					oJModel.setData(oData.results);
					that.getView().setModel(oJModel, "cStk");
					that.getView().byId("txtCStk").setText(oData.results[0].CurrentStk);
				}
			},
			error: function (error) {
				var message = "Error";
				sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
			}
		});
	},
	/////////////////////////////////////////////////////////
	vendorCompare: function () {
		var matId = this.getView().byId("matId").getText();
		var plantId = this.getView().byId("plantId").getText();
		var that = this;
		if (matId !== "" && plantId !== "") {
			var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var vendorCompare = "/VendorComparisonSet?$filter=Plant eq '" + plantId + "' and Material eq '" + matId + "'";
			oModel.setUseBatch(false);
			var oVendorCompareGraph = that.getView().byId("idVendorCompareGraph");
			oModel.read(vendorCompare, {
				success: function (oData, response) {
					if (oData.results !== "undefined" || oData.results !== null) {
						var UsageModel = new sap.ui.model.json.JSONModel({
							"VCdata": oData.results
						});
					}
					var oDim = {
						dimensions: [{
							axis: 1,
							name: "Month",
							value: "{Month}"
						}, {
							axis: 2,
							name: "Vendor",
							value: "{Vendor}"
						}],
						measures: [{

								name: "Price",
								value: "{NetPrice}"
							}
							// , {

							// 	name: "Budget",
							// 	value: "{PlanPrice1}"
							// }
						],
						data: {
							path: "/VCdata"
						}
					};
					var oDataset = new sap.viz.core.FlattenedDataset(oDim);
					oDataset.setModel(UsageModel);
					oVendorCompareGraph.setDataset(oDataset);
					matId = "";
					plantId = "";
				},
				error: function (error) {
					var message = "Error";
					sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
				}
			});
		} else {
			if (oVendorCompareGraph.setVisible(true)) {
				oVendorCompareGraph.setVisible(false);
			}
		}
	},
	/////////////////////////////////////////////////////////
	purchaseHistory: function () {
		var poNum = this.sPoNumber;
		var matId = this.getView().byId("matId").getText();
		var that = this;
		if (matId !== "") {
			var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var poHistory = "/GetLastSixPOSet?$filter=EBELN eq '" + poNum + "' and MATNR eq '" + matId + "'";
			oModel.setUseBatch(false);
			var oPurchaseHistoryGraph = that.getView().byId("idPurchaseHistoryGraph");

			oModel.read(poHistory, {
				success: function (oData, response) {
					if (oData.results !== "undefined" || oData.results !== null) {
						var UsageModel = new sap.ui.model.json.JSONModel({
							"PHdata": oData.results
						});
						oPurchaseHistoryGraph.setModel(UsageModel, "PoHis");
					}
					// popoverProps: {
					// 	'customDataControl': function (data) {
					// 		if (data.data.val) {
					// 			return new sap.m.Text({
					// 				text: "Testing"
					// 			});
					// 		}
					// 	}
					// }
					// that.oPopOver = new sap.viz.ui5.controls.Popover(bindValue.popoverProps);
					// that.oPopOver.connect(that.oVizFrame.getVizUid());
					// var oPurchaseHistoryPopOver = that.getView().byId("idPurchaseHistoryPopOver");
					// oPurchaseHistoryPopOver.connect(oPurchaseHistoryGraph.getVizUid());
					// oPurchaseHistoryPopOver.setFormatString(formatPattern.STANDARDFLOAT);

					poNum = "";
					matId = "";
				},
				error: function (error) {
					var message = "Error";
					sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
				}
			});
		} else {
			if (oPurchaseHistoryGraph.setVisible(true)) {
				oPurchaseHistoryGraph.setVisible(false);
			}
		}
	},
	/////////////////////////////////////////////////////////
	movingAverage: function () {
		var matId = this.getView().byId("matId").getText();
		var plantId = this.getView().byId("plantId").getText();
		var that = this;
		if (matId !== "" && plantId !== "") {
			var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var movingAverage = "/GET_MOVING_AVG_PRICESet?$filter=Plant eq '" + plantId + "' and Material eq '" + matId + "'";
			oModel.setUseBatch(false);
			var oMovingAverageGraph = that.getView().byId("idMovingAverageGraph");
			oModel.read(movingAverage, {
				success: function (oData, response) {
					if (oData.results !== "undefined" || oData.results !== null) {
						var UsageModel = new sap.ui.model.json.JSONModel({
							"MVdata": oData.results
						});
						oMovingAverageGraph.setModel(UsageModel, "movAvg");
					}
					var oMovingAveragePopOver = that.getView().byId("idMovingAveragePopOver");
					oMovingAveragePopOver.connect(oMovingAverageGraph.getVizUid());
					oMovingAveragePopOver.setFormatString(formatPattern.STANDARDFLOAT);
					matId = "";
					plantId = "";
				},
				error: function (error) {
					var message = "Error";
					sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
				}
			});
		} else {
			if (oMovingAverageGraph.setVisible(true)) {
				oMovingAverageGraph.setVisible(false);
			}
		}
	},
	/////////////////////////////////////////////////////////
	stockValue: function () {
		var matId = this.getView().byId("matId").getText();
		var plantId = this.getView().byId("plantId").getText();
		var that = this;
		if (matId !== "" && plantId !== "") {
			var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var stockValue = "/GetStockDataSet?$filter=Material eq '" + matId + "'and ValArea eq '" + plantId + "'";
			oModel.setUseBatch(false);
			var oStockValueGraph = that.getView().byId("idStockValueGraph");
			oModel.read(stockValue, {
				success: function (oData, response) {

					if (oData.results !== "undefined" || oData.results !== null) {
						var UsageModel = new sap.ui.model.json.JSONModel({
							"SVdata": oData.results
						});
						oStockValueGraph.setModel(UsageModel, "stkVal");
					}
					var oStockValuePopOver = that.getView().byId("idStockValuePopOver");
					oStockValuePopOver.connect(oStockValueGraph.getVizUid());
					oStockValuePopOver.setFormatString(formatPattern.STANDARDFLOAT);
					plantId = "";
					matId = "";
				},
				error: function (error) {
					var message = "Error";
					sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
				}
			});
		} else {
			if (oStockValueGraph.setVisible(true)) {
				oStockValueGraph.setVisible(false);
			}
		}
	},
	/////////////////////////////////////////////////////////
	quoteCompare: function () {
		var matId = this.getView().byId("matId").getText();
		var poNum = this.sPoNumber;
		var that = this;
		if (matId !== "") {
			var sServiceUrl = "/sap/opu/odata/AAG362/MM_PURCHASE_APPROVAL_SRV";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var quoteComparison = "/GetQuoteComparisonSet?$filter=Material eq '" + matId + "' and PONumber eq '" + poNum + "'";
			oModel.setUseBatch(false);
			var oQuoteCompareTable = that.getView().byId("idQuoteCompareTable");
			oModel.read(quoteComparison, {
				success: function (oData, response) {
					if (oData.results !== "undefined" || oData.results !== null) {
						var UsageModel = new sap.ui.model.json.JSONModel({
							"QCdata": oData.results
						});
						oQuoteCompareTable.setModel(UsageModel, "QuoteComp");
					}
					matId = "";
				},
				error: function (error) {
					var message = "Error";
					sap.m.MessageBox.show(message, sap.m.MessageBox.Icon.ERROR, "Error");
				}
			});
		} else {
			if (oQuoteCompareTable.setVisible(true)) {
				oQuoteCompareTable.setVisible(false);
			}
		}
	},
	/////////////////////////////////////////////////////////
	onPurHisPop: function (oEvent) {
		var that = this;
		var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
			pattern: "yyyy-MM-dd"
		});
		var oPurchaseHistoryGraph = that.getView().byId("idPurchaseHistoryGraph");

		var oPurHisPopover = sap.ui.xmlfragment("ui.s2p.mm.purchorder.approve.POExtension_final.view.purHisPopover", that);

		var oModel = oPurchaseHistoryGraph.getModel();
		var oFeed = oPurchaseHistoryGraph.getDataset().getBinding("data");
		var oTrig = oEvent.mParameters.data[0].data.PurchaseOrderNumber;
		var oPoNum, oDate, oPrice

		for (var i = 0; i < oFeed.oList.length; i++) {
			oPoNum = oFeed.oList[i].EBELN;
			if (oPoNum === oTrig) {
				oDate = oDateFormat.format(oFeed.oList[i].AEDAT);
				oPrice = oFeed.oList[i].NETPR;
			}
		}

		that.getView().addDependent(oPurHisPopover);
		oPurHisPopover.open();
	},
	onSelectionChange: function (oEvent) {
		var that = this;
		var key = oEvent.mParameters.item.mProperties.key;
		// console.log(key);
		// console.log(oEvent.getParameters());
		var oVendorCompareGraph = that.getView().byId("idVendorCompareGraph");
		var oPurchaseHistoryGraph = that.getView().byId("idPurchaseHistoryGraph");
		var oMovingAverageGraph = that.getView().byId("idMovingAverageGraph");
		var oStockValueGraph = that.getView().byId("idStockValueGraph");
		var oQuoteCompareTable = that.getView().byId("idQuoteCompareTable");

		if (key === "VendorCompare") {
			this.vendorCompare();
			oVendorCompareGraph.setVisible(true);
			oPurchaseHistoryGraph.setVisible(false);
			oMovingAverageGraph.setVisible(false);
			oStockValueGraph.setVisible(false);
			oQuoteCompareTable.setVisible(false);
		}
		if (key === "PurchaseHistory") {
			this.purchaseHistory();
			oVendorCompareGraph.setVisible(false);
			oPurchaseHistoryGraph.setVisible(true);
			oMovingAverageGraph.setVisible(false);
			oStockValueGraph.setVisible(false);
			oQuoteCompareTable.setVisible(false);
		}
		if (key === "MovingAvg") {
			this.movingAverage();
			oVendorCompareGraph.setVisible(false);
			oPurchaseHistoryGraph.setVisible(false);
			oMovingAverageGraph.setVisible(true);
			oStockValueGraph.setVisible(false);
			oQuoteCompareTable.setVisible(false);
		}
		if (key === "StockValue") {
			this.stockValue();
			oVendorCompareGraph.setVisible(false);
			oPurchaseHistoryGraph.setVisible(false);
			oMovingAverageGraph.setVisible(false);
			oStockValueGraph.setVisible(true);
			oQuoteCompareTable.setVisible(false);
		}
		if (key === "QuoteComparison") {
			this.quoteCompare();
			oVendorCompareGraph.setVisible(false);
			oPurchaseHistoryGraph.setVisible(false);
			oMovingAverageGraph.setVisible(false);
			oStockValueGraph.setVisible(false);
			oQuoteCompareTable.setVisible(true);

		}
	}
});
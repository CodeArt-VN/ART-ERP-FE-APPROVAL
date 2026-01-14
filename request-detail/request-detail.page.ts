import { Component, ChangeDetectorRef, Input, Type } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
	APPROVAL_CommentProvider,
	APPROVAL_RequestProvider,
	APPROVAL_TemplateProvider,
	BRA_BranchProvider,
	CRM_ContactProvider,
	HRM_StaffProvider,
	HRM_StaffScheduleProvider,
	PURCHASE_OrderDetailProvider,
	PURCHASE_RequestProvider,
} from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormGroup, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';
import { environment } from 'src/environments/environment';
import { PURCHASE_QuotationService } from '../../PURCHASE/purchase-quotation.service';
import { PURCHASE_OrderService } from '../../PURCHASE/purchase-order-service';
import { SaleOrderPickerModalPage } from '../../PURCHASE/sale-order-picker-modal/sale-order-picker-modal.page';

@Component({
	selector: 'app-request-detail',
	templateUrl: './request-detail.page.html',
	styleUrls: ['./request-detail.page.scss'],
	standalone: false,
})
export class RequestDetailPage extends PageBase {
	requestTypeList = [];
	statusList = [];
	timeOffTypeList = [];
	commentList = [];
	_currentVendor;
	imgPath = '';
	mappingList = [];
	approvalTemplate: any;
	isSupperApprover;
	_currentApprover;
	commentForm: FormGroup;
	purchaseOrderFormGroup: FormGroup; // FormGroup PurchaseOrder
	itemPurchaseOrder: any = {}; // orderline PurchaseOrder
	purchaseRequestFormGroup: FormGroup; // FormGroup PurchaseRequest
	itemPurchaseRequest: any = {}; // orderline PurchaseRequest
	purchaseQuotationFormGroup: FormGroup; // FormGroup PurchaseRequest
	itemPurchaseQuotation: any; // orderline PurchaseQuotation
	statusLineListPQ = []; // status orderline PurchaseQuotation
	branchList = [];
	vendorList = [];
	storerList = [];
	paymentStatusList = [];
	contentTypeList = [];
	jsonViewerConfig: any = {};

	propertiesLabelDataCorrection: any = null;
	oldItem: any = {};
	isLoadedOldItem = false;
	markAsPristine = false;
	_staffDataSource = this.buildSelectDataSource((term) => {
		return this.staffProvider.search({ Take: 20, Skip: 0, Keyword: term });
	});

	preloadItems: any = [];

	_vendorDataSource = this.buildSelectDataSource((term) => {
		return this.contactProvider.search({ SkipAddress: true, IsVendor: true, SortBy: ['Id_desc'], Take: 20, Skip: 0, Keyword: term });
	});

	quotationVendorView = false;
	quotationShowToggleAllQty = true;

	approvalRequestUDFTypes = {
		UDF01: 'number',
		UDF02: 'number',
		UDF03: 'number',
		UDF04: 'number',
		UDF05: 'number',
		UDF06: 'Date',
		UDF07: 'Date',
		UDF08: 'Date',
		UDF09: 'string',
		UDF10: 'string',
		UDF11: 'string',
		UDF12: 'string',
		UDF13: 'string',
		UDF14: 'string',
		UDF15: 'string',
		UDF16: 'string',
		UDF17: 'number',
		UDF18: 'number',
		UDF19: 'number',
		UDF20: 'number',
		UDF21: 'number',
		UDF22: 'number',
	};

	constructor(
		public pageProvider: APPROVAL_RequestProvider,
		public staffScheduleProvider: HRM_StaffScheduleProvider,
		public branchProvider: BRA_BranchProvider,
		public commentProvider: APPROVAL_CommentProvider,
		public purchaseRequestProvider: PURCHASE_RequestProvider,
		public purchaseOrderProvider: PURCHASE_OrderService,
		public purchaseOrderDetailProvider: PURCHASE_OrderDetailProvider,
		public purchaseQuotationProvider: PURCHASE_QuotationService,
		public approvalTemplateService: APPROVAL_TemplateProvider,
		public popoverCtrl: PopoverController,
		public modalController: ModalController,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public modal: ModalController,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService,
		public contactProvider: CRM_ContactProvider,

		public staffProvider: HRM_StaffProvider
	) {
		super();
		this.pageConfig.isDetailPage = true;
		this.pageConfig.ShowApprove = false;
		this.pageConfig.ShowDisapprove = false;
		//this.pageConfig.isShowFeature = true;
		this.imgPath = environment.staffAvatarsServer;
		this.commentForm = formBuilder.group({
			IDStaff: [this.env.user.StaffID],
			IDRequest: [this.id],
			Id: [0],
			Remark: ['', Validators.required],
		});
	}

	preLoadData(event?: any): void {
		this.query.IDStaff = this.env.user.StaffID;
		this.branchList = lib.cloneObject(this.env.branchList);
		this.contentTypeList = [
			{ Code: 'Item', Name: 'Items' },
			{ Code: 'Service', Name: 'Service' },
		];
		Promise.all([
			this.env.getType('RequestType'),
			this.env.getStatus('ApprovalStatus'),
			// this.env.getType('TimeOffType'),
			this.env.getStatus('POPaymentStatus'),
		]).then((values: any) => {
			this.requestTypeList = values[0];
			this.statusList = values[1];
			this.paymentStatusList = values[2];
			// this.timeOffTypeList = values[2];
			super.preLoadData(event);
		});

		this.loadComment();
	}

	loadedData(event?: any): void {
		this.item._Type = this.requestTypeList.find((d) => d.Code == this.item.Type);
		this.item._Status = this.statusList.find((d) => d.Code == this.item.Status);
		this.item._Approvers.forEach((i) => {
			i._Status = this.statusList.find((d) => d.Code == i.Status);
			if (i.Id == this.env.user.StaffID) {
				this._currentApprover = i;
			}
		});

		this.item._Logs.forEach((i) => {
			i._Status = this.statusList.find((d) => d.Code == i.Status);
			i.Date = lib.dateFormat(i.CreatedDate, 'dd/mm/yy');
			i.Time = lib.dateFormat(i.CreatedDate, 'hh:MM');
		});
		if (this.item.IDApprovalTemplate > 0) {
			this.approvalTemplateService.getAnItem(this.item.IDApprovalTemplate).then((value) => {
				if (value) {
					this.approvalTemplate = value;
					this.checkPermision();
					this.updateMappingList(this.item);
				}
			});
		} else {
			this.checkPermision();
		}
		super.loadedData(event);
		if (['Approved', 'Canceled', 'Submitted'].includes(this.item.Status)) this.pageConfig.canEdit = false;
		if (this.item.Type == 'DataCorrection' && this.item.UDF16) {
			if (this.item.SubType == 'BusinessPartner') {
				this.propertiesLabelDataCorrection = {
					Id: 'Id',
					CompanyName: 'Company name',
					TaxCode: 'Tax code',
					Email: 'Email',
					BillingAddress: 'Billing address',
					IsDefault: 'Default billing information',
					Remark: 'Remark',
					TaxInfos: 'Billing address',
					OtherPhone: 'Other phone',
					DeletedAddress: 'Deleted address',
					DeletedTaxInfo: 'Deleted billing address',
				};
				this.jsonViewerConfig.notShowProperties = ['DeletedAddressFields', 'DeletedTaxInfoFields'];
			}
			this.contactProvider
				.getAnItem(this.item.UDF01)
				.then((resp) => {
					if (resp) {
						this.oldItem = resp;
						let obj = JSON.parse(this.item.UDF16);
						this.jsonViewerConfig.showProperties = [];
						if (obj) this.jsonViewerConfig.showProperties = Object.keys(obj);
					}
				})
				.finally(() => (this.isLoadedOldItem = true));
		} else if (this.item.Type == 'PurchaseOrder') {
			this.buildFormPO();
			this.pageConfig.canEditPurchaseOrder = this.pageConfig.canEdit;
			this.contactProvider.read({ IsVendor: true, Take: 20 }).then((resp) => {
				this._vendorDataSource.selected.push(...resp['data']);
			});
			this.contactProvider.read({ IsStorer: true, Take: 5000 }).then((resp) => {
				this.storerList = resp['data'];
			});

			if (this.item.UDF01 > 0) {
				this.purchaseOrderProvider
					.getAnItem(this.item.UDF01)
					.then((response: any) => {
						if (response) {
							this.itemPurchaseOrder = response;
							this.cdr.detectChanges();
							if (this.itemPurchaseOrder) {
								//this.pageConfig.canEditPrice = true;
								if (this.itemPurchaseOrder.hasOwnProperty('IsDeleted') && this.itemPurchaseOrder.IsDeleted) this.nav('not-found', 'back');
								this.purchaseOrderFormGroup?.patchValue(this.itemPurchaseOrder);
								this.purchaseOrderFormGroup?.markAsPristine();
								if (this.itemPurchaseOrder._Vendor) {
									this._vendorDataSource.selected = [...this._vendorDataSource.selected, this.itemPurchaseOrder._Vendor];
								}

								if (!['Draft', 'Unapproved'].includes(this.itemPurchaseOrder.Status)) {
									this.purchaseOrderFormGroup.disable();
									this.pageConfig.canEditPurchaseOrder = false;
								}
							}
						}
					})
					.finally(() => {
						this._vendorDataSource.initSearch();
					});
			} else {
				this._vendorDataSource.initSearch();
			}
			if (!this.pageConfig.canEdit) this.purchaseOrderFormGroup.disable();
			this._currentVendor = this.purchaseOrderFormGroup.get('IDVendor').value;
		} else if (this.item.Type == 'PurchaseRequest') {
			this.buildFormPR();
			this.pageConfig.canEditPurchaseRequest = this.pageConfig.canEdit;
			this.contactProvider.read({ IsVendor: true, Take: 20 }).then((resp) => {
				this._vendorDataSource.selected.push(...resp['data']);
			});

			if (this.item.UDF01 > 0) {
				this.purchaseRequestProvider
					.getAnItem(this.item.UDF01)
					.then((response: any) => {
						if (response) {
							this.itemPurchaseRequest = response;
							this.cdr.detectChanges();
							if (this.itemPurchaseRequest) {
								if (this.itemPurchaseRequest.hasOwnProperty('IsDeleted') && this.itemPurchaseRequest.IsDeleted) this.nav('not-found', 'back');
								this.purchaseRequestFormGroup?.patchValue(this.itemPurchaseRequest);
								this.purchaseRequestFormGroup?.markAsPristine();
								if (this.itemPurchaseRequest._Vendor) {
									this._vendorDataSource.selected = [...this._vendorDataSource.selected, this.itemPurchaseRequest._Vendor];
								}
								if (this.itemPurchaseRequest._Requester) {
									this._staffDataSource.selected = [this.itemPurchaseRequest._Requester];
								}
								if (!this.itemPurchaseRequest || (!this.itemPurchaseRequest?.IDRequester && this.item._Staff)) {
									this.purchaseRequestFormGroup.get('IDRequester').setValue(this.item._Staff.Id);
									this.purchaseRequestFormGroup.controls['IDRequester'].markAsDirty();
									this._staffDataSource.selected = [this.item._Staff];
								}
								this._currentContentTypePR = this.itemPurchaseRequest?.ContentType;
								if (!['Draft', 'Unapproved'].includes(this.itemPurchaseRequest.Status)) {
									this.purchaseRequestFormGroup.disable();
									this.pageConfig.canEditPurchaseRequest = false;
								}
								this._currentContentTypePR = this.formGroup.controls['ContentType'].value;
							}
						}
					})
					.finally(() => {
						this._vendorDataSource.initSearch();
						this._staffDataSource.initSearch();
					});
			} else {
				this.purchaseRequestFormGroup.controls['ContentType'].markAsDirty();
				this.purchaseRequestFormGroup.get('IDRequester').setValue(this.item._Staff.Id);
				this.purchaseRequestFormGroup.controls['IDRequester'].markAsDirty();
				this._staffDataSource.selected = [this.item._Staff];
				this._vendorDataSource.initSearch();
				this._staffDataSource.initSearch();
			}
			if (!this.pageConfig.canEdit) this.purchaseRequestFormGroup.disable();
			this._currentVendor = this.purchaseRequestFormGroup.get('IDVendor').value;
		} else if (this.item.Type == 'PurchaseQuotation') {
			this.buildFormPQ();
			this.pageConfig.canEditPurchaseQuotation = this.pageConfig.canEdit;
			if (this.env.user.IDBusinessPartner > 0 && !this.env.user.SysRoles.includes('STAFF') && this.env.user.SysRoles.includes('VENDOR')) {
				this.quotationVendorView = true;
			}
			Promise.all([this.contactProvider.read({ IsVendor: true, Take: 20 }), this.env.getStatus('PurchaseQuotationLine')]).then((values: any) => {
				if (values[0] && values[0].data) {
					this._vendorDataSource.selected.push(...values[0].data);
				}
				if (values[1]) this.statusLineListPQ = values[1];
				if (this.item.UDF01 > 0) {
					this.purchaseQuotationProvider
						.getAnItem(this.item.UDF01)
						.then((resp: any) => {
							if (resp) {
								this.itemPurchaseQuotation = resp;

								this.purchaseQuotationFormGroup.patchValue(this.itemPurchaseQuotation);
								this.purchaseQuotationFormGroup.markAsPristine();

								if (this.itemPurchaseQuotation._Vendor) {
									this._vendorDataSource.selected = [...this._vendorDataSource.selected, this.itemPurchaseQuotation._Vendor];
								}

								if (!['Draft', 'Unapproved'].includes(this.itemPurchaseQuotation.Status)) {
									this.purchaseQuotationFormGroup.disable();
									this.pageConfig.canEditPurchaseQuotation = false;
								}

								if (!this.itemPurchaseQuotation.QuotationLines) {
									this.itemPurchaseQuotation.QuotationLines = [];
								}
								this.cdr.detectChanges();
							}
						})
						.catch((err) => {
							console.log(err);
							this.env.showMessage(err, 'danger');
						})
						.finally(() => {
							this._vendorDataSource.initSearch();
							this._staffDataSource.initSearch();
						});
				} else {
					this.itemPurchaseQuotation = {
						Id: 0,
						Status: 'Draft',
						ContentType: 'Item',
						QuotationLines: [],
					};
					this.purchaseQuotationFormGroup.get('ContentType').markAsDirty();
					this._vendorDataSource.initSearch();
				}

				if (!this.pageConfig.canEdit) {
					this.purchaseQuotationFormGroup.disable();
					this.pageConfig.canEditPurchaseQuotation = false;
				}
			});
		} else if (this.item.Type == 'TimeOff') {
			Promise.all([this.staffProvider.getAnItem(this.item.IDStaff)])
				.then((values: any) => {
					this.item.Staff = values[0];
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}

	updateMappingList(data) {
		this.mappingList = [];
		
		if (this.approvalTemplate) {
			var udfList = Object.keys(this.approvalTemplate).filter((d) => d.includes('IsUseUDF'));
			udfList.forEach((d) => {
				if (this.approvalTemplate[d]) {
					let label = this.approvalTemplate[d.replace('IsUseUDF', 'UDFLabel')];
					let value = data[d.replace('IsUseUDF', 'UDF')];
					let type = this.approvalRequestUDFTypes[d.replace('IsUseUDF', 'UDF')];
					if (type === 'Date' && value) {
						value = lib.dateFormat(value, 'dd/mm/yy hh:MM');
					}
					this.mappingList.push({
						Label: label,
						Value: value,
					});
				}
			});
		}
	}
	
	buildFormPO() {
		this.purchaseOrderFormGroup = this.formBuilder.group({
			IDBranch: [this.item.IDBranch],
			IDWarehouse: [],
			IDStorer: new FormControl({ value: '', disabled: false }, Validators.required),
			IDVendor: new FormControl({ value: '', disabled: false }, Validators.required),
			Id: [0],
			Code: [''],
			Name: [''],
			Remark: [''],
			Status: new FormControl({ value: 'Draft', disabled: true }),
			ExpectedReceiptDate: [''],
			Type: ['Regular'],
			PaymentStatus: new FormControl({ value: 'NotSubmittedYet', disabled: true }),
			OrderLines: [this.formBuilder.array([])],
			DeletedLines: [[]],
			TotalDiscount: new FormControl({ value: '', disabled: true }),
			TotalAfterTax: new FormControl({ value: '', disabled: true }),
		});
	}

	savePO() {
		if (!this.purchaseOrderFormGroup) return;

		if (!this.isAutoSave) return;

		if (this.submitAttempt) return;

		this.purchaseOrderFormGroup.updateValueAndValidity();
		if (!this.purchaseOrderFormGroup.valid) {
			let invalidControls = this.findInvalidControlsRecursive(this.purchaseOrderFormGroup);
			Promise.all(invalidControls.map((c) => this.env.translateResource(c))).then((values) => {
				this.env.showMessage('Please recheck control(s): {{value}}', 'warning', values.join(' | '));
			});
			return;
		}

		const poDirty = this.getDirtyValues(this.purchaseOrderFormGroup);
		if (Object.keys(poDirty).length === 0) return;

		const payload = {
			Id: this.item.Id,
			UDF01: this.item.UDF01,
			Type: 'PurchaseOrder',
			PurchaseOrder: poDirty,
		};

		this.submitAttempt = true;
		this.pageProvider
			.save(payload)
			.then((result: any) => {
				this.submitAttempt = false;
				if (result?.PurchaseOrder) {
					this.purchaseOrderFormGroup.markAsPristine();
					this.purchaseOrderFormGroup.patchValue(result.PurchaseOrder);
					this.itemPurchaseOrder = result.PurchaseOrder;
					if (this.itemPurchaseOrder?.Id && !this.item.UDF01) {
						this.item.UDF01 = this.itemPurchaseOrder.Id;
						this.loadedData();
					}
					this.updateMappingList(result);
					this.cdr.detectChanges();
					this.env.showMessage('Saving completed!', 'success');
				} else {
					this.env.showMessage('Cannot save, please try again', 'danger');
				}
			})
			.catch((err) => {
				this.cdr.detectChanges();
				this.submitAttempt = false;
				this.env.showMessage(err, 'danger');
			});
	}

	renderFormArrayPO(formArray: FormArray) {
		this.purchaseOrderFormGroup.controls.OrderLines = formArray as any;
	}

	removeItemPO(Ids: number[]) {
		if (!Ids || !Ids.length) return;
		this.purchaseOrderDetailProvider.delete(Ids.map((id) => ({ Id: id }))).then((resp) => {
			const groups = this.purchaseOrderFormGroup.get('OrderLines') as FormArray;
			for (let i = groups.length - 1; i >= 0; i--) {
				const id = groups.at(i).get('Id')?.value;
				if (Ids.includes(id)) {
					groups.removeAt(i);
				}
			}
			this.env.showMessage('Deleted!', 'success');
		});
		this.calcTotalAfterTaxPO();
	}

	calcTotalAfterTaxPO() {
		const orderLines = this.purchaseOrderFormGroup.get('OrderLines')?.getRawValue() ?? [];
		if (!Array.isArray(orderLines) || orderLines.length === 0) return 0;

		return orderLines
			.map((x) => {
				const price = +x.UoMPrice || 0;
				const qtyExpected = +x.UoMQuantityExpected || 0;
				const qtyAdjusted = +x.QuantityAdjusted || 0;
				const discount = +x.TotalDiscount || 0;
				const taxRate = +x.TaxRate || 0;
				return (price * (qtyExpected + qtyAdjusted) - discount) * (1 + taxRate / 100);
			})
			.reduce((a, b) => a + b, 0);
	}

	async showSaleOrderPickerModalPO() {
		const modal = await this.modalController.create({
			component: SaleOrderPickerModalPage,
			componentProps: { id: this.item.Id },
			cssClass: 'modal90',
		});

		await modal.present();
		const { data } = await modal.onWillDismiss();

		if (data && data.length) {
			console.log(data);
			console.log(data.map((i) => i.Id));

			const loading = await this.loadingController.create({
				cssClass: 'my-custom-class',
				message: 'Please wait for a few moments',
			});
			await loading.present().then(() => {
				let postData = { Id: this.item.Id, SOIds: data.map((i) => i.Id) };
				this.commonService
					.connect('POST', ApiSetting.apiDomain('PURCHASE/Order/ImportDetailFromSaleOrders/'), postData)
					.toPromise()
					.then((data) => {
						if (loading) loading.dismiss();
						this.refresh();
						this.env.publishEvent({ Code: this.pageConfig.pageName });
					})
					.catch((err) => {
						console.log(err);
						this.env.showMessage('Cannot add product. Please try again later.', 'danger');
						if (loading) loading.dismiss();
					});
			});
		}
	}

	buildFormPR() {
		this.purchaseRequestFormGroup = this.formBuilder.group({
			IDBranch: [this.item.IDBranch],
			IDRequester: [],
			IDVendor: ['', Validators.required],
			Id: [0],
			Code: [''],
			Name: [''],
			ForeignName: [''],
			Remark: [''],
			ForeignRemark: [''],
			ContentType: ['Item', Validators.required],
			Status: new FormControl({ value: 'Draft', disabled: true }, Validators.required),
			RequiredDate: ['', Validators.required],
			PostingDate: [''],
			DueDate: [''],
			DocumentDate: [''],
			IsDisabled: [''],
			IsDeleted: [''],
			CreatedBy: [''],
			ModifieddBy: [''],
			CreatedDate: [''],
			ModifieddDate: [''],
			OrderLines: [this.formBuilder.array([])],
			DeletedLines: [[]],
			TotalDiscount: new FormControl({ value: '', disabled: true }),
			TotalAfterTax: new FormControl({ value: '', disabled: true }),
		});
	}

	changeVendorPR(e) {
		let orderLines = this.purchaseRequestFormGroup.get('OrderLines') as FormArray;

		if (orderLines.controls.length > 0) {
			if (e) {
				this.env
					.showPrompt('Tất cả hàng hoá trong danh sách khác với nhà cung cấp được chọn sẽ bị xoá. Bạn có muốn tiếp tục ? ', null, 'Thông báo')
					.then(() => {
						let DeletedLines = orderLines
							.getRawValue()
							.filter((f) => f.Id && f.IDVendor != e.Id && !f._Vendors?.map((v) => v.Id)?.includes(e.Id))
							.map((o) => o.Id);

						orderLines.controls
							.filter((f) =>
								f
									.get('_Vendors')
									.value.map((v) => v.Id)
									.includes(e.Id)
							)
							.forEach((o) => {
								o.get('IDVendor').setValue(e.Id);
								o.get('IDVendor').markAsDirty();
							});
						this.purchaseRequestFormGroup.get('DeletedLines').setValue(DeletedLines);
						this.purchaseRequestFormGroup.get('DeletedLines').markAsDirty();
						this._currentVendor = e;

						this.savePR();
					})
					.catch(() => {
						this.purchaseRequestFormGroup.get('IDVendor').setValue(this._currentVendor?.Id);
					});
			} else {
				this._currentVendor = e;
				this.savePR();
			}
		} else {
			this._currentVendor = e;
			this.savePR();
		}
	}

	changeRequiredDatePR() {
		let orderLines = this.purchaseRequestFormGroup.get('OrderLines').value;
		orderLines.forEach((f) => {
			if (!f.RequiredDate) f.RequiredDate = this.purchaseRequestFormGroup.get('RequiredDate').value;
		});
		this.purchaseRequestFormGroup.get('OrderLines').setValue([...orderLines]);
		this.savePR();
	}

	_currentContentTypePR;
	changeContentTypePR(e) {
		console.log(e);
		let orderLines = this.purchaseRequestFormGroup.get('OrderLines') as FormArray;
		if (orderLines.controls.length > 0) {
			this.env
				.showPrompt('Tất cả hàng hoá trong danh sách sẽ bị xoá khi bạn chọn nhà cung cấp khác. Bạn chắc chắn chứ? ', null, 'Thông báo')
				.then(() => {
					let DeletedLines = orderLines
						.getRawValue()
						.filter((f) => f.Id)
						.map((o) => o.Id);
					this.purchaseRequestFormGroup.get('DeletedLines').setValue(DeletedLines);
					this.purchaseRequestFormGroup.get('DeletedLines').markAsDirty();
					orderLines.clear();
					this.itemPurchaseRequest.OrderLines = [];
					this.savePR();
					this._currentContentTypePR = e.Code;
					return;
				})
				.catch(() => {
					this.purchaseRequestFormGroup.get('ContentType').setValue(this._currentContentTypePR);
				});
		} else {
			this._currentContentTypePR = e.Code;
			this.savePR();
		}
	}

	renderFormArrayPR(e) {
		this.purchaseRequestFormGroup.controls.OrderLines = e;
	}

	savePR(isSubmit = false) {
		return new Promise((resolve, reject) => {
			if (this.submitAttempt) reject(false);
			if (this.isAutoSave || isSubmit) {
				this.purchaseRequestFormGroup.updateValueAndValidity();
				if (!this.purchaseRequestFormGroup.valid) {
					let invalidControls = this.findInvalidControlsRecursive(this.purchaseRequestFormGroup);
					const translationPromises = invalidControls.map((control) => this.env.translateResource(control));
					Promise.all(translationPromises).then((values: any[]) => {
						invalidControls = values;
						this.env.showMessage('Please recheck control(s): {{value}}', 'warning', invalidControls.join(' | '));
						reject(false);
					});
				} else {
					let purchaseRequest = this.getDirtyValues(this.purchaseRequestFormGroup);
					let obj = {
						Id: this.item.Id,
						UDF01: this.item.UDF01,
						Type: 'PurchaseRequest',
						PurchaseRequest: purchaseRequest,
					};

					this.submitAttempt = true;
					this.pageProvider
						.save(obj)
						.then((result: any) => {
							if (result) {
								this.purchaseRequestFormGroup.markAsPristine();
								this.markAsPristine = true;
								this.purchaseRequestFormGroup.patchValue(result.PurchaseRequest);
								this.itemPurchaseRequest = result.PurchaseRequest;
								if (this.itemPurchaseRequest?.Id && !this.item.UDF01) {
									this.item.UDF01 = this.itemPurchaseRequest.Id;
									this.loadedData();
								}
								this.updateMappingList(result);
								this.cdr.detectChanges();
								this.env.showMessage('Saving completed!', 'success');
								this.submitAttempt = false;
								resolve(true);
							} else this.env.showMessage('Cannot save, please try again', 'danger');
						})
						.catch(() => {
							this.cdr.detectChanges();
							this.submitAttempt = false;
							reject(false);
						});
				}
			}
		});
	}

	removeItemPR(Ids) {
		let groups = <FormArray>this.purchaseRequestFormGroup.controls.OrderLines;
		if (Ids && Ids.length > 0) {
			this.purchaseRequestFormGroup.get('DeletedLines').setValue(Ids);
			this.purchaseRequestFormGroup.get('DeletedLines').markAsDirty();
			this.savePR().then((s) => {
				Ids.forEach((id) => {
					let index = groups.controls.findIndex((x) => x.get('Id').value == id);
					if (index >= 0) groups.removeAt(index);
				});
			});
		}
	}

	calcTotalAfterTaxPR() {
		if (this.purchaseRequestFormGroup.get('OrderLines').getRawValue()) {
			return this.purchaseRequestFormGroup
				.get('OrderLines')
				.getRawValue()
				.map((x) => (x.UoMPrice * x.Quantity - x.TotalDiscount) * (1 + x.TaxRate / 100))
				.reduce((a, b) => +a + +b, 0);
		} else {
			return 0;
		}
	}

	buildFormPQ() {
		this.purchaseQuotationFormGroup = this.formBuilder.group({
			IDBranch: [this.item.IDBranch || this.env.selectedBranch],
			IDRequester: [],
			IDRequestBranch: [],
			IDBusinessPartner: [null, Validators.required],
			SourceKey: [''],
			SourceType: [''],
			Id: [0],
			Code: [''],
			//Name: ['', Validators.required],
			ForeignName: [''],
			Remark: [''],
			ForeignRemark: [''],
			ContentType: ['Item', Validators.required],
			Status: ['Draft', Validators.required],
			RequiredDate: ['', Validators.required],
			ValidUntilDate: ['', Validators.required],
			PostingDate: [''],
			DueDate: [''],
			DocumentDate: [''],
			IsDisabled: [''],
			IsDeleted: [''],
			CreatedBy: [''],
			ModifiedBy: [''],
			CreatedDate: [''],
			ModifiedDate: [''],
			QuotationLines: this.formBuilder.array([]),
			DeletedLines: [''],
			TotalDiscount: [''],
			TotalAfterTax: [''],
		});
	}

	renderFormArrayPQ(formArray: FormArray) {
		this.purchaseQuotationFormGroup.controls.QuotationLines = formArray as any;
	}

	changeRequiredDatePQ() {
		if (!this.purchaseQuotationFormGroup) return;
		const lines = this.purchaseQuotationFormGroup.get('QuotationLines') as FormArray;
		const requiredDate = this.purchaseQuotationFormGroup.get('RequiredDate')?.value;
		if (lines && requiredDate) {
			lines.controls.forEach((ctrl) => {
				const rd = ctrl.get('RequiredDate');
				if (rd && !rd.value) {
					rd.setValue(requiredDate);
					rd.markAsDirty();
					ctrl.markAsDirty();
				}
			});
		}
		this.savePQ();
	}

	_currentContentTypePQ;
	changeContentTypePQ(e: any) {
		if (!this.purchaseQuotationFormGroup) return;
		const quotationLines = this.purchaseQuotationFormGroup.get('QuotationLines') as FormArray;
		const newCode = e?.Code || e?.value || e;
		if (quotationLines?.length > 0) {
			this.env
				.showPrompt('Tất cả hàng hoá trong danh sách sẽ bị xoá khi bạn đổi loại nội dung. Bạn chắc chắn chứ?', null, 'Thông báo')
				.then(() => {
					// mark deleted existing persisted lines
					const deleted = quotationLines
						.getRawValue()
						.filter((l) => l.Id)
						.map((l) => l.Id);
					if (deleted.length) {
						this.purchaseQuotationFormGroup.get('DeletedLines')?.setValue(deleted);
						this.purchaseQuotationFormGroup.get('DeletedLines')?.markAsDirty();
					}
					// clear form array
					while (quotationLines.length) quotationLines.removeAt(0);
					if (this.itemPurchaseQuotation) this.itemPurchaseQuotation.QuotationLines = [];
					this.purchaseQuotationFormGroup.get('ContentType')?.setValue(newCode);
					this.purchaseQuotationFormGroup.get('ContentType')?.markAsDirty();
					this._currentContentTypePQ = newCode;
					this.savePQ();
				})
				.catch(() => {
					// revert
					this.purchaseQuotationFormGroup.get('ContentType')?.setValue(this._currentContentTypePQ);
				});
		} else {
			this.purchaseQuotationFormGroup.get('ContentType')?.setValue(newCode);
			this.purchaseQuotationFormGroup.get('ContentType')?.markAsDirty();
			this._currentContentTypePQ = newCode;
			this.savePQ();
		}
	}

	changeVendorPQ(e: any) {
		if (!this.purchaseQuotationFormGroup) return;
		const quotationLines = this.purchaseQuotationFormGroup.get('QuotationLines') as FormArray;
		if (quotationLines?.controls.length > 0) {
			if (e) {
				this.env
					.showPrompt('Tất cả hàng hoá trong danh sách khác với nhà cung cấp được chọn sẽ bị xoá. Bạn có muốn tiếp tục ?', null, 'Thông báo')
					.then(() => {
						// Lines having different vendor (Business Partner) will be deleted
						const raw = quotationLines.getRawValue();
						const deleted = raw.filter((l) => l.Id && l.IDBusinessPartner != e.Id).map((l) => l.Id);

						if (deleted.length) {
							this.purchaseQuotationFormGroup.get('DeletedLines')?.setValue(deleted);
							this.purchaseQuotationFormGroup.get('DeletedLines')?.markAsDirty();
						}

						// Update header vendor
						this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.setValue(e.Id);
						this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.markAsDirty();
						this._currentVendor = e;

						this.savePQ();

						if (deleted.length) {
							for (let i = quotationLines.length - 1; i >= 0; i--) {
								if (deleted.includes(quotationLines.at(i).get('Id')?.value)) {
									quotationLines.removeAt(i);
								}
							}
						}
					})
					.catch(() => {
						// Revert vendor
						this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.setValue(this._currentVendor ? this._currentVendor.Id : null);
					});
			} else {
				this._currentVendor = e;
				this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.setValue(null);
				this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.markAsDirty();
				this.savePQ();
			}
		} else {
			this._currentVendor = e;
			this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.setValue(e ? e.Id : null);
			this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.markAsDirty();
			this.savePQ();
		}
	}

	savePQ() {
		if (!this.purchaseQuotationFormGroup) return;

		if (!this.isAutoSave) return;

		if (this.submitAttempt) return;

		this.purchaseQuotationFormGroup.updateValueAndValidity();
		if (!this.purchaseQuotationFormGroup.valid) {
			let invalidControls = this.findInvalidControlsRecursive(this.purchaseQuotationFormGroup);
			Promise.all(invalidControls.map((c) => this.env.translateResource(c))).then((values) => {
				this.env.showMessage('Please recheck control(s): {{value}}', 'warning', values.join(' | '));
			});
			return;
		}

		const quotationDirty = this.getDirtyValues(this.purchaseQuotationFormGroup);
		if (Object.keys(quotationDirty).length === 0) return;

		const payload = {
			Id: this.item.Id,
			UDF01: this.item.UDF01,
			Type: 'PurchaseQuotation',
			PurchaseQuotation: quotationDirty,
		};

		this.submitAttempt = true;
		this.pageProvider
			.save(payload)
			.then((result: any) => {
				this.submitAttempt = false;
				if (result?.PurchaseQuotation) {
					this.purchaseQuotationFormGroup.markAsPristine();
					this.purchaseQuotationFormGroup.patchValue(result.PurchaseQuotation);
					this.itemPurchaseQuotation = result.PurchaseQuotation;
					if (this.itemPurchaseQuotation?.Id && !this.item.UDF01) {
						this.item.UDF01 = this.itemPurchaseQuotation.Id;
						this.loadedData();
					}
					this.updateMappingList(result);
					this.cdr.detectChanges();
					this.env.showMessage('Saving completed!', 'success');
				} else {
					this.env.showMessage('Cannot save, please try again', 'danger');
				}
			})
			.catch((err) => {
				this.cdr.detectChanges();
				this.submitAttempt = false;
				this.env.showMessage(err, 'danger');
			});
	}

	removeItemPQ(Ids: number[]) {
		if (!Ids || !Ids.length) return;
		const groups = this.purchaseQuotationFormGroup.get('QuotationLines') as FormArray;
		this.purchaseQuotationFormGroup.get('DeletedLines')?.setValue(Ids);
		this.purchaseQuotationFormGroup.get('DeletedLines')?.markAsDirty();
		this.savePQ();
		for (let i = groups.length - 1; i >= 0; i--) {
			const id = groups.at(i).get('Id')?.value;
			if (Ids.includes(id)) {
				groups.removeAt(i);
			}
		}
		this.calcTotalAfterTaxPQ();
	}

	addAllProductFromVendorPQ(products: any[]) {
		if (!products || !products.length) return;
		const linesFA = this.purchaseQuotationFormGroup.get('QuotationLines') as FormArray;
		const existing = new Set(linesFA.getRawValue().map((r) => r.IDItem || r.Id));
		products.forEach((p) => {
			const key = p.IDItem || p.Id;
			if (existing.has(key)) return;
			linesFA.push(
				this.formBuilder.group({
					Id: [0],
					IDItem: [key],
					IDBusinessPartner: [this.purchaseQuotationFormGroup.get('IDBusinessPartner')?.value],
					Quantity: [p.DefaultQuantity || 1],
					Price: [p.Price || p.LastPrice || 0],
					TaxRate: [p.TaxRate || 0],
					TotalDiscount: [0],
					TotalAfterTax: [0],
					Remark: [''],
					_Item: [p],
				})
			);
		});
		linesFA.markAsDirty();
		this.calcTotalAfterTaxPQ();
		this.savePQ();
	}

	calcTotalAfterTaxPQ() {
		if (this.purchaseQuotationFormGroup && this.purchaseQuotationFormGroup.get('QuotationLines')) {
			return this.purchaseQuotationFormGroup
				.get('QuotationLines')
				.getRawValue()
				.map((x) => (x.Price * x.Quantity - x.TotalDiscount) * (1 + x.TaxRate / 100))
				.reduce((a, b) => +a + +b, 0);
		} else {
			return 0;
		}
	}

	checkPermision() {
		let canDisapproveStatus = ['Approved', 'InProgress', 'Pending'];
		let canApproveStatus = ['InProgress', 'Pending', 'Unapproved'];
		let canDenyStatus = ['InProgress', 'Pending'];
		let canForwardStatus = ['Pending'];
		// let ignoredStatus = ['Draft', 'Approved', 'Denied'];
		// let lockStatus = ['Forward']; //'Approved', 'Denied',
		this.pageConfig.canApprove = false;
		if (canApproveStatus.includes(this.item.Status)) {
			if (!(this.item.Status == 'Unapproved' && this.item.Type == 'DataCorrection')) {
				if (this.approvalTemplate?.IsSupperApprover || (this._currentApprover && this.item.ApprovalMode?.trim() != 'SequentialApprovals')) {
					this.pageConfig.canApprove = true;
				} else {
					if (this._currentApprover) {
						// Duyệt tuần tự
						let approverIdx = this.item._Approvers.findIndex((d) => d.Id == this.env.user.StaffID);
						if (approverIdx != 0) {
							for (let index = approverIdx - 1; index == 0; index--) {
								const Approver = this.item._Approvers[index];
								if (Approver.Status != 'Approved') {
									break;
								}
								if (index == 0) {
									this.pageConfig.canApprove = true;
								}
							}
						} else {
							this.pageConfig.canApprove = true;
						}
					}
				}
			}
		}
		// this.pageConfig.canApprove = false;
		if (canDisapproveStatus.includes(this.item.Status) && (this.approvalTemplate?.IsSupperApprover || this._currentApprover)) {
			if (!(this.item.Status == 'Approved' && this.item.Type == 'DataCorrection')) this.pageConfig.canDisApprove = true;
		}
		this.pageConfig.canForward = false;
		if (canForwardStatus.includes(this.item.Status) && (this.approvalTemplate?.IsSupperApprover || this._currentApprover)) this.pageConfig.canForward = true;
		this.pageConfig.canDeny = false;
		if (canDenyStatus.includes(this.item.Status) && (this.approvalTemplate?.IsSupperApprover || this._currentApprover)) this.pageConfig.canDeny = true;
		if (this._currentApprover) {
			switch (this._currentApprover.Status) {
				case 'Approved':
					this.pageConfig.canApprove = false;
					break;
				// case 'Unapproved':
				// 	this.pageConfig.canApprove = false;
				// 	break;
				case 'Denied':
					this.pageConfig.canDeny = false;
					break;
				case 'Forward':
					this.pageConfig.canForward = false;
					break;
			}
		}
	}

	async disapprove() {
		if (!this.pageConfig.canDisApprove) {
			return;
		}
		let approval = {
			IDRequest: this.item.Id,
			IDApprover: this.env.user.StaffID,
			Status: 'Return',
			ForwardTo: null,
			Remark: '',
		};
		const modal = await this.modalController.create({
			component: ApproveModalPage,
			componentProps: {
				item: approval,
			},
			cssClass: 'modal90vh',
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();
		if (data) {
			Object.assign(approval, {
				Remark: data.Remark ?? approval.Remark,
				ForwardTo: data.ForwardTo ?? approval.ForwardTo,
				Status: data.Status ?? approval.Status,
			});
			this.pageProvider.commonService
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/DisapproveRequest/'), [approval])
				.toPromise()
				.then((result: any) => {
					this.env.publishEvent({ Code: this.pageConfig.pageName });
					this.submitAttempt = false;

					if (result) {
						this.env.showMessage('Success', 'success');
						this.refresh();
					} else {
						this.env.showMessage('Failure', 'warning');
					}
				})
				.catch((err) => {
					this.submitAttempt = false;
					this.env.showMessage(err.error?.ExceptionMessage || err, 'danger');
					console.log(err);
				});
		}
	}

	loadComment() {
		this.commentProvider.read({ IDRequest: this.id }).then((resp) => {
			this.commentList = resp['data'];
			this.commentList.forEach((i) => {
				i.Date = lib.dateFormatFriendly(i.CreatedDate);
			});
		});
	}

	async submitApproval(status) {
		console.log(status);
		let approval = {
			IDRequest: this.item.Id,
			IDApprover: this.env.user.StaffID,
			Status: status,
			ForwardTo: null,
			Remark: '',
		};
		if (status == 'Approved') {
			this.submitAttempt = true;
			this.pageProvider.commonService
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/Approve'), [approval])
				.toPromise()
				.then((resp: any) => {
					this.submitAttempt = false;
					super.loadData(null);
					this.env.publishEvent({ Code: this.pageConfig.pageName });
				})
				.catch((err) => {
					if (err.message != null) {
						this.env.showMessage(err.message, 'danger');
					} else {
						this.env.showMessage('Cannot extract data', 'danger');
					}
					this.submitAttempt = false;
					this.refresh();
				});
		} else {
			const modal = await this.modalController.create({
				component: ApproveModalPage,
				componentProps: {
					item: approval,
				},
				cssClass: 'modal90vh',
			});
			await modal.present();
			const { data } = await modal.onWillDismiss();
			if (data) {
				Object.assign(approval, {
					Remark: data.Remark ?? approval.Remark,
					ForwardTo: data.ForwardTo ?? approval.ForwardTo,
					Status: data.Status ?? approval.Status,
				});
				this.submitAttempt = true;
				this.pageProvider.commonService
					.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/Approve'), [approval])
					.toPromise()
					.then((resp: any) => {
						this.submitAttempt = false;
						super.loadData(null);
						this.env.publishEvent({
							Code: this.pageConfig.pageName,
						});
					})
					.catch((err) => {
						if (err.message != null) {
							this.env.showMessage(err.message, 'danger');
						} else {
							this.env.showMessage('Cannot extract data', 'danger');
						}
						this.submitAttempt = false;
						this.refresh();
					});
			}
		}
	}

	addComment() {
		let comment = this.commentForm.getRawValue();
		comment.IDRequest = this.id;
		this.commentProvider.save(comment).then((_) => {
			this.commentForm.controls.Remark.setValue('');
			this.loadComment();
		});
	}

	addNotShowProperty(index) {
		if (this.jsonViewerConfig.notShowProperties) {
			this.jsonViewerConfig.notShowProperties.push(this.jsonViewerConfig.showProperties[index]);
			this.jsonViewerConfig.showProperties.splice(index, 1);
			this.jsonViewerConfig.notShowProperties = [...this.jsonViewerConfig.notShowProperties];
		}
	}

	addShowProperty(index) {
		if (this.jsonViewerConfig.showProperties) {
			this.jsonViewerConfig.showProperties.push(this.jsonViewerConfig.notShowProperties[index]);
			this.jsonViewerConfig.notShowProperties.splice(index, 1);
			this.jsonViewerConfig.notShowProperties = [...this.jsonViewerConfig.notShowProperties];
		}
	}

}

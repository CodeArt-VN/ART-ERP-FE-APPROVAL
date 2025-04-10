import { Component, ChangeDetectorRef, Input } from '@angular/core';
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
	PURCHASE_RequestDetailProvider,
	PURCHASE_RequestProvider,
} from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormGroup, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';
import { environment } from 'src/environments/environment';
import { PURCHASE_QuotationService } from '../../PURCHASE/purchase-quotation.service';

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
	purchaseRequestFormGroup: FormGroup;
	itemPurchaseQuotation: any;
	branchList = [];
	vendorList = [];
	storerList = [];
	paymentStatusList = [];
	contentTypeList = [];
	jsonViewerConfig: any = {};
	itemPurchaseRequest: any = {};
	propertiesLabelDataCorrection: any = null;
	oldItem: any = {};
	isLoadedOldItem = false;
	markAsPristine = false;
	_staffDataSource = this.buildSelectDataSource((term) => {
		return this.staffProvider.search({ Take: 20, Skip: 0, Term: term });
	});

	preloadItems: any = [];

	_vendorDataSource = this.buildSelectDataSource((term) => {
		return this.contactProvider.search({ SkipAddress: true, IsVendor: true, SortBy: ['Id_desc'], Take: 20, Skip: 0, Term: term });
	});

	constructor(
		public pageProvider: APPROVAL_RequestProvider,
		public branchProvider: BRA_BranchProvider,
		public commentProvider: APPROVAL_CommentProvider,
		public purchaseRequestProvider: PURCHASE_RequestProvider,
		public purchaseRequestDetailProvider: PURCHASE_RequestDetailProvider,
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
		this.contentTypeList = [
			{ Code: 'Item', Name: 'Items' },
			{ Code: 'Service', Name: 'Service' },
		];
		Promise.all([
			this.env.getType('RequestType'),
			this.env.getStatus('ApprovalStatus'),
			// this.env.getType('TimeOffType'),
		]).then((values: any) => {
			this.requestTypeList = values[0];
			this.statusList = values[1];
			// this.timeOffTypeList = values[2];
			super.preLoadData(event);
		});

		this.loadComment();
	}

	loadedData(event?: any): void {
		this.mappingList = [];
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
					var udfList = Object.keys(this.approvalTemplate).filter((d) => d.includes('IsUseUDF'));
					udfList.forEach((d) => {
						if (this.approvalTemplate[d]) {
							let label = this.approvalTemplate[d.replace('IsUseUDF', 'UDFLabel')];
							let value = this.item[d.replace('IsUseUDF', 'UDF')];
							this.mappingList.push({
								Label: label,
								Value: value,
							});
						}
					});
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
				this.jsonViewerConfig.notShowProperties = ["DeletedAddressFields", "DeletedTaxInfoFields"];

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
		}

		if (this.item.Type == 'PurchaseRequest') {
			this.buildPurchaseForm();
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
								this._currentContentType = this.itemPurchaseRequest?.ContentType;
								if (!['Draft', 'Unapproved'].includes(this.itemPurchaseRequest.Status)) {
									this.purchaseRequestFormGroup.disable();
									this.pageConfig.canEditPurchaseRequest = false;
								}
								this._currentContentType = this.formGroup.controls['ContentType'].value;
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
		}

		if (this.item.Type == 'PurchaseQuotation') {
			if (this.item.UDF01 > 0) {
				this.purchaseQuotationProvider
					.getAnItem(this.item.UDF01)
					.then((resp) => {
						if (resp) {
							this.itemPurchaseQuotation = resp;
						}
					})
					.catch((err) => {
						console.log(err);
						this.env.showMessage(err, 'danger');
					});
			}
		}
	}

	buildPurchaseForm() {
		this.purchaseRequestFormGroup = this.formBuilder.group({
			IDBranch: [this.item.IDBranch],
			IDRequester: [],
			IDVendor: [],
			Id: [0],
			Code: [''],
			Name: [''],
			ForeignName: [''],
			Remark: [''],
			ForeignRemark: [''],
			ContentType: ['Item', Validators.required],
			Status: new FormControl({ value: 'Draft', disabled: true }, Validators.required),
			RequiredDate: [''],
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

	changeVendor(e) {
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

						this.saveChangePurchaseRequest();
					})
					.catch(() => {
						this.purchaseRequestFormGroup.get('IDVendor').setValue(this._currentVendor?.Id);
					});
			} else {
				this._currentVendor = e;
				this.saveChangePurchaseRequest();
			}
		} else {
			this._currentVendor = e;
			this.saveChangePurchaseRequest();
		}
	}

	_currentContentType;
	changeContentType(e) {
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
					this.saveChangePurchaseRequest();
					this._currentContentType = e.Code;
					return;
				})
				.catch(() => {
					this.purchaseRequestFormGroup.get('ContentType').setValue(this._currentContentType);
				});
		} else {
			this._currentContentType = e.Code;
			this.saveChangePurchaseRequest();
		}
	}
	renderFormArray(e) {
		this.purchaseRequestFormGroup.controls.OrderLines = e;
	}

	saveOrderBack(fg) {
		this.saveChangePurchaseRequest();
	}

	saveChangePurchaseRequest(isSubmit = false) {
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

					console.log('PurchaseForm: ', this.purchaseRequestFormGroup.getRawValue());
					this.submitAttempt = true;
					this.pageProvider
						.save(obj)
						.then((result: any) => {
							if (result) {
								this.purchaseRequestFormGroup.markAsPristine();
								this.markAsPristine = true;
								this.purchaseRequestFormGroup.patchValue(result.PurchaseRequest);
								this.itemPurchaseRequest = result.PurchaseRequest;
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

	removeItem(Ids) {
		let groups = <FormArray>this.purchaseRequestFormGroup.controls.OrderLines;
		if (Ids && Ids.length > 0) {
			this.purchaseRequestFormGroup.get('DeletedLines').setValue(Ids);
			this.purchaseRequestFormGroup.get('DeletedLines').markAsDirty();
			this.saveChangePurchaseRequest().then((s) => {
				Ids.forEach((id) => {
					let index = groups.controls.findIndex((x) => x.get('Id').value == id);
					if (index >= 0) groups.removeAt(index);
				});
			});
		}
	}

	calcTotalAfterTax() {
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
		this.pageConfig.canApprove = false;
		if (canDisapproveStatus.includes(this.item.Status) && (this.approvalTemplate?.IsSupperApprover || this._currentApprover)) {
			if (!(this.item.Status == 'Approved' && this.item.Type == 'DataCorrection')) this.pageConfig.canApprove = true;
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
				case 'Unapproved':
					this.pageConfig.canApprove = false;
					break;
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
		if (!this.pageConfig.canApprove) {
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
			cssClass: 'my-custom-class',
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();
		if (data) {
			this.pageProvider.commonService
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/DisapproveRequest/'), data)
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
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/Approve'), approval)
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
				cssClass: 'my-custom-class',
			});
			await modal.present();
			const { data } = await modal.onWillDismiss();
			if (data) {
				this.submitAttempt = true;
				this.pageProvider.commonService
					.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/Approve'), data)
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

	changeRequiredDate() {
		let orderLines = this.purchaseRequestFormGroup.get('OrderLines').value;
		orderLines.forEach((f) => {
			if (!f.RequiredDate) f.RequiredDate = this.purchaseRequestFormGroup.get('RequiredDate').value;
		});
		this.purchaseRequestFormGroup.get('OrderLines').setValue([...orderLines]);
		this.saveChangePurchaseRequest();
	}
}

import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { APPROVAL_RequestProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, HRM_LeaveTypeProvider, SYS_SchemaDetailProvider, SYS_SchemaProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { RequestModalPage } from '../request-modal/request-modal.page';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { environment } from 'src/environments/environment';
import { FormBuilder } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';

@Component({
	selector: 'app-request',
	templateUrl: 'request.page.html',
	styleUrls: ['request.page.scss'],
	standalone: false,
})
export class RequestPage extends PageBase {
	schema: any;
	IDSchema: any;
	type: any;
	subType;
	ApprovalRule: any;
	config: any;
	requestTypeList = [];
	statusList = [];
	timeOffTypeList = [];
	approvalTemplateList = [];
	requestFiltered = [];
	requestFilteredByStatus = [];

	_filterTemplateID = 0;
	_isFilterFollow = false;
	_isFilterMyRequest = false;
	listSupperApprover = [];
	imgPath = '';
	constructor(
		public pageProvider: APPROVAL_RequestProvider,
		public branchProvider: BRA_BranchProvider,
		public leaveTypeProvider: HRM_LeaveTypeProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location,
		public formBuilder: FormBuilder,
		public commonService: CommonService,
		public schemaService: SYS_SchemaProvider,
		public schemaDetailService: SYS_SchemaDetailProvider,
		public approvalTemplateService: APPROVAL_TemplateProvider
	) {
		super();
		this.imgPath = environment.staffAvatarsServer;
		this.pageConfig.isShowFeature = true;
		this.pageConfig.ShowFeature = true;
		this.pageConfig.mainPageActive = true;
		this.pageConfig.canSubmitOrdersForApproval = true;
	}

	preLoadData(event?: any): void {
		this.query.SortBy = 'Id_desc';
		this.query.IDStaff = this.env.user.StaffID;
		this.query.canViewAllData = this.pageConfig.canViewAllData;

		Promise.all([
			this.env.getType('RequestType'),
			this.env.getStatus('ApprovalStatus'),
			this.leaveTypeProvider.read(),
			this.approvalTemplateService.read(this.query, this.pageConfig.forceLoadData),
		]).then((values: any) => {
			this.requestTypeList = values[0];
			this.statusList = values[1];
			this.timeOffTypeList = values[2].data;
			this.approvalTemplateList = values[3].data;
			super.preLoadData(event);
		});
	}

	loadedData(event?: any, ignoredFromGroup?: boolean): void {
		this.approvalTemplateList.forEach((s) => {
			if (s.IsSupperApprover) {
				this.listSupperApprover.push(s.Id);
			}
		});
		let submitStatus = ['Draft', 'Unapproved'];
		this.items.forEach((i) => {
			i._Type = this.requestTypeList.find((d) => d.Code == i.Type);
			i._Status = this.statusList.find((d) => d.Code == i.Status);
			i.StartText = lib.dateFormat(i.Start, 'dd/mm/yy hh:MM');
			i.canSubmitOrdersForApproval = false;
			if (i.IDStaff == this.env.user.StaffID && submitStatus.findIndex((d) => d == i.Status) > -1) {
				i.canSubmitOrdersForApproval = true;
			}
		});
		super.loadedData(event, ignoredFromGroup);
	}

	async showModal(i) {
		const modal = await this.modalController.create({
			component: RequestModalPage,
			componentProps: {
				requestTypeList: this.requestTypeList,
				statusList: this.statusList,
				timeOffTypeList: this.timeOffTypeList,
				approvalTemplateList: this.approvalTemplateList,
				item: i,
				id: i.Id,
			},
			cssClass: 'my-custom-class',
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();

		if (data) {
			this.pageProvider.commonService
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/PostRequest'), data)
				.toPromise()
				.then((resp: any) => {
					this.submitAttempt = false;
					super.loadData(null);
					this.env.publishEvent({ Code: this.pageConfig.pageName });
				})
				.catch((err) => {
					this.submitAttempt = false;
					this.refresh();
				});
		}
	}

	add() {
		let newItem = {
			Id: 0,
		};
		this.showModal(newItem);
	}

	changeType(subType = null) {
		if (subType == null) {
			this.query.SubType_eq = null;
			this.subType = null;
		} else {
			this.query.SubType_eq = subType;
		}
		this.config = {
			Dimension: 'logical',
			Operator: 'AND',
			value: null,
			Logicals: [],
		};
		this.query.Type_eq = this.type;
		this.env
			.showLoading('Please wait for a few moments', this.approvalTemplateService.read(this.query))
			.then((response: any) => {
				if (response.data && response.data.length && response.data[0].IDSchema) {
					this.IDSchema = response.data[0].IDSchema;
					this.schemaService.getAnItem(this.IDSchema).then((value) => {
						this.schema = value;
					});
				}
			})
			.catch((err) => {});
		this.query.SubType_eq = undefined;
		this.query.Type_eq = undefined;
	}
	saveConfig(e) {
		this.config = e;
	}
	changeSubType(e) {
		return this.changeType(e.Code);
	}
	filterConfig() {
		let obj = {
			type: this.type,
			subType: this.subType,
			config: JSON.stringify(this.config),
		};
		let apiPath = {
			method: 'POST',
			url: function () {
				return ApiSetting.apiDomain('APPROVAL/Request/FilterRequest');
			},
		};
		this.env
			.showLoading('Please wait for a few moments', this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), obj).toPromise())

			.then((data: any) => {
				this.items = data;
				this.loadedData();
			});
	}

	filterBySubTab(key) {
		this.pageConfig.isSubActive = true;
		this.query.Follow = undefined;
		this.query.MyRequest = undefined;
		this.query.IDApprovalTemplate = undefined;
		this.query[key] = true;
		this.refresh();
	}
	changeTemplateFilter(id) {
		this.pageConfig.isSubActive = true;

		this.query.Follow = undefined;
		this.query.MyRequest = undefined;
		this.query.IDApprovalTemplate = undefined;
		if (id != 0) {
			this.query.IDApprovalTemplate = id;
		}
		this.refresh();
	}

	segmentView = 'All';
	listFilter = ['Approved', 'Denied', 'Draft', 'NeedApprove', 'WaitForApprove', 'Expired', 'Unapproved'];
	segmentChanged(e) {
		this.listFilter.forEach((d) => {
			this.query.Status = undefined;
			this.query[d] = undefined;
		});
		switch (e.detail.value) {
			case 'All':
				break;
			case 'Approved':
			case 'Denied':
			case 'Draft':
			case 'Pending':
			case 'Unapproved':
				this.query.Status = e.detail.value;
				break;
			default: //NeedApprove, WaitForApprove, Expired
				this.query[e.detail.value] = true;
		}
		this.refresh();
	}
	cancel() {
		if (!this.pageConfig.canCancel) return;
		if (this.submitAttempt) return;

		let itemsCanNotProcess = this.selectedItems.filter((i) => i.Status == 'Draft' || i.Status == 'Canceled');
		if (itemsCanNotProcess.length == this.selectedItems.length) {
			this.env.showMessage('Your selected invoices cannot be canceled. Please select draft or pending for approval invoice', 'warning');
		} else {
			itemsCanNotProcess.forEach((i) => {
				i.checked = false;
			});
			//this.selectedItems = this.selectedItems.filter(i => (i.Status == 'Pending' || i.Status == 'Unapproved'));
			this.env
				.showPrompt({ code: 'CANCEL_ROWS_CONFIRM_MESSAGE', value: { value: this.selectedItems.length } }, null, {
					code: 'Duyệt {{value}} yêu cầu',
					value: { value: this.selectedItems.length },
				})
				.then((_) => {
					this.submitAttempt = true;
					let postDTO = { Ids: [] };
					postDTO.Ids = this.selectedItems.map((e) => e.Id);

					this.pageProvider.commonService
						.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/CancelRequest/'), postDTO)
						.toPromise()
						.then((savedItem: any) => {
							this.env.publishEvent({
								Code: this.pageConfig.pageName,
							});
							this.env.showMessage('Saving completed!', 'success');
							this.submitAttempt = false;
						})
						.catch((err) => {
							this.submitAttempt = false;
							console.log(err);
						});
				});
		}
	}
	submitForApproval() {
		if (this.submitAttempt) return;

		let itemsCanNotProcess = this.selectedItems.filter((i) => !(i.Status == 'Draft' || i.Status == 'Unapproved'));
		if (itemsCanNotProcess.length == this.selectedItems.length) {
			this.env.showMessage('Your selected invoices cannot be approved. Please select new or draft or disapproved ones', 'warning');
		} else {
			itemsCanNotProcess.forEach((i) => {
				i.checked = false;
			});
			this.selectedItems = this.selectedItems.filter((i) => i.Status == 'Draft' || i.Status == 'Unapproved');

			this.env
				.showPrompt({ code: 'SUBMIT_FOR_APPROVE_MESSAGE', value: { value: this.selectedItems.length } }, null, {
					code: 'SUBMIT_FOR_APPROVE',
					value: { value: this.selectedItems.length },
				})
				.then((_) => {
					this.submitAttempt = true;
					let postDTO = { Ids: [] };
					postDTO.Ids = this.selectedItems.map((e) => e.Id);

					this.pageProvider.commonService
						.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/SubmitRequest/'), postDTO)
						.toPromise()
						.then((savedItem: any) => {
							this.env.publishEvent({
								Code: this.pageConfig.pageName,
							});
							this.submitAttempt = false;

							if (savedItem > 0) {
								this.env.showMessage('{{value}} orders sent for approval', 'success', savedItem);
							} else {
								this.env.showMessage('Please check again, orders must have at least 1 item to be approved', 'warning');
							}
						})
						.catch((err) => {
							this.submitAttempt = false;
							console.log(err);
						});
				});
		}
	}
	changeSelection(i, e = null) {
		super.changeSelection(i, e);
		const configs = this.selectedItems.map(item => this.getActionConfig(item));
		this.pageConfig.canApprove = configs.length > 0 && configs.every(cfg => cfg.canApprove);
    	this.pageConfig.canDisApprove = configs.length > 0 && configs.every(cfg => cfg.canDisApprove);
    	this.pageConfig.canDeny = configs.length > 0 && configs.every(cfg => cfg.canDeny);
    	this.pageConfig.canForward = configs.length > 0 && configs.every(cfg => cfg.canForward);
		this.pageConfig.ShowSubmit = this.pageConfig.canSubmit;
		this.pageConfig.ShowCancel = this.pageConfig.canCancel;
		this.selectedItems?.forEach((i) => {
			let notShowCancel = ['Closed'];
			if (notShowCancel.indexOf(i.Status) > -1 || i.DifferenceAmount != 0) {
				this.pageConfig.ShowCancel = false;
			}

			let notShowSubmit = ['Pending', 'Approved', 'InProgress', 'Forward', 'Denied', 'Canceled', 'Closed'];
			if (notShowSubmit.indexOf(i.Status) > -1 || (!i.UDF01 && i.Type == 'PurchaseRequest')) {
				this.pageConfig.ShowSubmit = false;
			}
		});
	}

	getActionConfig(item) {
		const canApproveStatus = ['InProgress', 'Pending', 'Unapproved'];
		const canDisapproveStatus = ['Approved', 'InProgress', 'Pending'];
		const canDenyStatus = ['InProgress', 'Pending'];
		const canForwardStatus = ['Pending'];

		const currentApprover = item._Approvers?.find((a) => a.Id == this.env.user.StaffID);
		const isSupperApprover = item._IsSuperApproval;

		let config = {
			canApprove: false,
			canDisApprove: false,
			canDeny: false,
			canForward: false,
		};

		// canApprove
		if (canApproveStatus.includes(item.Status)) {
			if (!(item.Status == 'Unapproved' && item.Type == 'DataCorrection')) {
				if (isSupperApprover || (currentApprover && item.ApprovalMode?.trim() != 'SequentialApprovals')) {
					config.canApprove = true;
				} else if (currentApprover) {
					let approverIdx = item._Approvers.findIndex((d) => d.Id == this.env.user.StaffID);
					if (approverIdx != 0) {
						for (let index = approverIdx - 1; index == 0; index--) {
							const Approver = item._Approvers[index];
							if (Approver.Status != 'Approved') {
								break;
							}
							if (index == 0) {
								config.canApprove = true;
							}
						}
					} else {
						config.canApprove = true;
					}
				}
			}
		}

		// canDisApprove
		if (canDisapproveStatus.includes(item.Status) && (isSupperApprover || currentApprover)) {
			if (!(item.Status == 'Approved' && item.Type == 'DataCorrection')) {
				config.canDisApprove = true;
			}
		}

		// canForward
		if (canForwardStatus.includes(item.Status) && (isSupperApprover || currentApprover)) {
			config.canForward = true;
		}

		// canDeny
		if (canDenyStatus.includes(item.Status) && (isSupperApprover || currentApprover)) {
			config.canDeny = true;
		}
		
		if (currentApprover) {
			switch (currentApprover.Status) {
				case 'Approved':
				case 'Unapproved':
					config.canApprove = false;
					break;
				case 'Denied':
					config.canDeny = false;
					break;
				case 'Forward':
					config.canForward = false;
					break;
			}
		}

		return config;
	}

	approve(){
		this.submitApproval('Approved');
	}
	async submitApproval(status: string) {
		if (!this.pageConfig.canApprove) return;
		if (!this.selectedItems || this.selectedItems.length === 0) return;

		this.submitAttempt = true;
		let approvals = this.selectedItems.map((item) => ({
			IDRequest: item.Id,
			IDApprover: this.env.user.StaffID,
			Status: status,
			ForwardTo: null,
			Remark: '',
		}));
		if (status !== 'Approved') {
			const modal = await this.modalController.create({
				component: ApproveModalPage,
				componentProps: {
					item: approvals[0],
				},
				cssClass: 'my-custom-class',
			});
			await modal.present();
			const { data } = await modal.onWillDismiss();
			if (data) {
				approvals.forEach((a) => {
					if (data.Remark) a.Remark = data.Remark;
					if (data.ForwardTo) a.ForwardTo = data.ForwardTo;
					if (data.Status) a.Status = data.Status;
				});
			}
		}
		await this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/Approve'), approvals).toPromise();

		this.submitAttempt = false;
		super.loadData(null);
		this.env.publishEvent({ Code: this.pageConfig.pageName });
	}

	async disapprove() {
		if (!this.pageConfig.canDisApprove) return;
		if (!this.selectedItems || this.selectedItems.length === 0) return;

		let approvals = this.selectedItems.map((item) => ({
			IDRequest: item.Id,
			IDApprover: this.env.user.StaffID,
			Status: 'Return',
			ForwardTo: null,
			Remark: '',
		}));
		const modal = await this.modalController.create({
			component: ApproveModalPage,
			componentProps: {
				item: approvals[0],
			},
			cssClass: 'my-custom-class',
		});
		await modal.present();
		const { data } = await modal.onWillDismiss();
		if (data) {
			approvals.forEach((a) => {
				if (data.Remark) a.Remark = data.Remark;
			});
			this.pageProvider.commonService
				.connect('POST', ApiSetting.apiDomain('APPROVAL/Request/DisapproveRequest/'), approvals)
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
}

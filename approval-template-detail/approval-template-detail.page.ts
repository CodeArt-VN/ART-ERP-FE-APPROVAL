import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute, Router } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_ApprovalRuleProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, HRM_StaffProvider, SYS_SchemaProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { Subject, catchError, concat, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

@Component({
	selector: 'app-approval-template-detail',
	templateUrl: './approval-template-detail.page.html',
	styleUrls: ['./approval-template-detail.page.scss'],
	standalone: false,
})
export class ApprovalTemplateDetailPage extends PageBase {
	schemaDetailList: any;
	filter: any;
	requestTypeList: any;
	requestSubTypeList: any;
	approvalModes: [];
	_schemaListDetail: any;
	_schemaListMappingDetail: any;
	schemaList: any;
	schema: any;
	approvalRuleList: [];
	countUDF = [];
	constructor(
		public pageProvider: APPROVAL_TemplateProvider,
		public approvalRuleService: APPROVAL_ApprovalRuleProvider,
		public schemaService: SYS_SchemaProvider,
		public branchProvider: BRA_BranchProvider,
		public staffService: HRM_StaffProvider,
		public popoverCtrl: PopoverController,
		public env: EnvService,
		public navCtrl: NavController,
		public route: ActivatedRoute,
		public alertCtrl: AlertController,
		public formBuilder: FormBuilder,
		public cdr: ChangeDetectorRef,
		public loadingController: LoadingController,
		public commonService: CommonService,
		public router: Router
	) {
		super();
		this.pageConfig.isDetailPage = true;
		this.formGroup = this.formBuilder.group({
			Id: new FormControl({ value: '', disabled: true }),
			IDBranch: new FormControl({
				value: this.env.selectedBranch,
				disabled: false,
			}),
			Name: [''],
			Type: ['', Validators.required],
			Remark: [''],
			SubType: [''],
			Sort: [''],
			// IDSchema:[''],
			IDSchemaMapping: [''],
			IsSentToSpecializedManager: [''],
			IsSentToAdministrationManager: [''],
			IsUserCanChooseApprover: [''],
			SelectableApproverList: [''],
			FixedApproverList: [''],
			FollowerList: [''],
			SupperApproverList: [''],
			HoursToApprove: [''],
			ApprovalMode: ['', Validators.required],
			IsDisabled: new FormControl({ value: '', disabled: true }),
			IsDeleted: new FormControl({ value: '', disabled: true }),
			CreatedBy: new FormControl({ value: '', disabled: true }),
			CreatedDate: new FormControl({ value: '', disabled: true }),
			ModifiedBy: new FormControl({ value: '', disabled: true }),
			ModifiedDate: new FormControl({ value: '', disabled: true }),
			DeletedFields: [[]],

			_SupperApproverList: [''],
			_SupperApproverListDataSource: this.buildSelectDataSource((term) => {
				return this.staffService.search({ Take: 20, Skip: 0, Term: term });
			}),

			// {
			// 	searchProvider: this.staffService,
			// 	loading: false,
			// 	input$: new Subject<string>(),
			// 	selected: [],
			// 	items$: null,
			// 	initSearch() {
			// 		this.loading = false;
			// 		this.items$ = concat(
			// 			of(this.selected),
			// 			this.input$.pipe(
			// 				distinctUntilChanged(),
			// 				tap(() => (this.loading = true)),
			// 				switchMap((term) =>
			// 					this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
			// 						catchError(() => of([])), // empty list on error
			// 						tap(() => (this.loading = false))
			// 					)
			// 				)
			// 			)
			// 		);
			// 	},
			// },

			_FixedApproverList: [''],
			_FixedApproverListDataSource:  this.buildSelectDataSource((term) => {
				return this.staffService.search({ Take: 20, Skip: 0, Term: term });
			}),
			
			// {
			// 	searchProvider: this.staffService,
			// 	loading: false,
			// 	input$: new Subject<string>(),
			// 	selected: [],
			// 	items$: null,
			// 	initSearch() {
			// 		this.loading = false;
			// 		this.items$ = concat(
			// 			of(this.selected),
			// 			this.input$.pipe(
			// 				distinctUntilChanged(),
			// 				tap(() => (this.loading = true)),
			// 				switchMap((term) =>
			// 					this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
			// 						catchError(() => of([])), // empty list on error
			// 						tap(() => (this.loading = false))
			// 					)
			// 				)
			// 			)
			// 		);
			// 	},
			// },

			_SelectableApproverList: [''],
			_SelectableApproverListDataSource:  this.buildSelectDataSource((term) => {
				return this.staffService.search({ Take: 20, Skip: 0, Term: term });
			}),
			
			
			// {
			// 	searchProvider: this.staffService,
			// 	loading: false,
			// 	input$: new Subject<string>(),
			// 	selected: [],
			// 	items$: null,
			// 	initSearch() {
			// 		this.loading = false;
			// 		this.items$ = concat(
			// 			of(this.selected),
			// 			this.input$.pipe(
			// 				distinctUntilChanged(),
			// 				tap(() => (this.loading = true)),
			// 				switchMap((term) =>
			// 					this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
			// 						catchError(() => of([])), // empty list on error
			// 						tap(() => (this.loading = false))
			// 					)
			// 				)
			// 			)
			// 		);
			// 	},
			// },
			_FollowerList: [''],
			_FollowerListDataSource:  this.buildSelectDataSource((term) => {
				return this.staffService.search({ Take: 20, Skip: 0, Term: term });
			}),
			
			// {
			// 	searchProvider: this.staffService,
			// 	loading: false,
			// 	input$: new Subject<string>(),
			// 	selected: [],
			// 	items$: null,
			// 	initSearch() {
			// 		this.loading = false;
			// 		this.items$ = concat(
			// 			of(this.selected),
			// 			this.input$.pipe(
			// 				distinctUntilChanged(),
			// 				tap(() => (this.loading = true)),
			// 				switchMap((term) =>
			// 					this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
			// 						catchError(() => of([])), // empty list on error
			// 						tap(() => (this.loading = false))
			// 					)
			// 				)
			// 			)
			// 		);
			// 	},
			// },

			IsUseUDF01: new FormControl({ value: '', disabled: false }),
			IsUseUDF02: new FormControl({ value: '', disabled: false }),
			IsUseUDF03: new FormControl({ value: '', disabled: false }),
			IsUseUDF04: new FormControl({ value: '', disabled: false }),
			IsUseUDF05: new FormControl({ value: '', disabled: false }),
			IsUseUDF06: new FormControl({ value: '', disabled: false }),
			IsUseUDF07: new FormControl({ value: '', disabled: false }),
			IsUseUDF08: new FormControl({ value: '', disabled: false }),
			IsUseUDF09: new FormControl({ value: '', disabled: false }),
			IsUseUDF10: new FormControl({ value: '', disabled: false }),
			IsUseUDF11: new FormControl({ value: '', disabled: false }),
			IsUseUDF12: new FormControl({ value: '', disabled: false }),
			IsUseUDF13: new FormControl({ value: '', disabled: false }),
			IsUseUDF14: new FormControl({ value: '', disabled: false }),
			IsUseUDF15: new FormControl({ value: '', disabled: false }),
			IsUseUDF16: new FormControl({ value: '', disabled: false }),
			IsUseUDF17: new FormControl({ value: '', disabled: false }),
			IsUseUDF18: new FormControl({ value: '', disabled: false }),
			IsUseUDF19: new FormControl({ value: '', disabled: false }),
			IsUseUDF20: new FormControl({ value: '', disabled: false }),
			IsUseUDF21: new FormControl({ value: '', disabled: false }),
			IsUseUDF22: new FormControl({ value: '', disabled: false }),

			UDFLabel01: new FormControl({ value: '', disabled: false }),
			UDFLabel02: new FormControl({ value: '', disabled: false }),
			UDFLabel03: new FormControl({ value: '', disabled: false }),
			UDFLabel04: new FormControl({ value: '', disabled: false }),
			UDFLabel05: new FormControl({ value: '', disabled: false }),
			UDFLabel06: new FormControl({ value: '', disabled: false }),
			UDFLabel07: new FormControl({ value: '', disabled: false }),
			UDFLabel08: new FormControl({ value: '', disabled: false }),
			UDFLabel09: new FormControl({ value: '', disabled: false }),
			UDFLabel10: new FormControl({ value: '', disabled: false }),
			UDFLabel11: new FormControl({ value: '', disabled: false }),
			UDFLabel12: new FormControl({ value: '', disabled: false }),
			UDFLabel13: new FormControl({ value: '', disabled: false }),
			UDFLabel14: new FormControl({ value: '', disabled: false }),
			UDFLabel15: new FormControl({ value: '', disabled: false }),
			UDFLabel16: new FormControl({ value: '', disabled: false }),
			UDFLabel17: new FormControl({ value: '', disabled: false }),
			UDFLabel18: new FormControl({ value: '', disabled: false }),
			UDFLabel19: new FormControl({ value: '', disabled: false }),
			UDFLabel20: new FormControl({ value: '', disabled: false }),
			UDFLabel21: new FormControl({ value: '', disabled: false }),
			UDFLabel22: new FormControl({ value: '', disabled: false }),

			UDFMapping01: new FormControl({ value: '', disabled: false }),
			UDFMapping02: new FormControl({ value: '', disabled: false }),
			UDFMapping03: new FormControl({ value: '', disabled: false }),
			UDFMapping04: new FormControl({ value: '', disabled: false }),
			UDFMapping05: new FormControl({ value: '', disabled: false }),
			UDFMapping06: new FormControl({ value: '', disabled: false }),
			UDFMapping07: new FormControl({ value: '', disabled: false }),
			UDFMapping08: new FormControl({ value: '', disabled: false }),
			UDFMapping09: new FormControl({ value: '', disabled: false }),
			UDFMapping10: new FormControl({ value: '', disabled: false }),
			UDFMapping11: new FormControl({ value: '', disabled: false }),
			UDFMapping12: new FormControl({ value: '', disabled: false }),
			UDFMapping13: new FormControl({ value: '', disabled: false }),
			UDFMapping14: new FormControl({ value: '', disabled: false }),
			UDFMapping15: new FormControl({ value: '', disabled: false }),
			UDFMapping16: new FormControl({ value: '', disabled: false }),
			UDFMapping17: new FormControl({ value: '', disabled: false }),
			UDFMapping18: new FormControl({ value: '', disabled: false }),
			UDFMapping19: new FormControl({ value: '', disabled: false }),
			UDFMapping20: new FormControl({ value: '', disabled: false }),
			UDFMapping21: new FormControl({ value: '', disabled: false }),
			UDFMapping22: new FormControl({ value: '', disabled: false }),
		});
	}

	preLoadData(event) {
		let querySchema = {
			Take: 500,
			Skip: 0,
		};
		Promise.all([this.env.getType('RequestType'), this.env.getType('ApprovalProcess'), this.schemaService.read()]).then((values: any) => {
			this.requestTypeList = values[0];
			// this.timeOffTypeList = values[1];
			this.approvalModes = values[1];
			this.schemaList = values[2].data;

			super.preLoadData(event);
		});
	}

	loadedData(event?: any, ignoredFromGroup?: boolean): void {
		// this.item.Fields.forEach(x=> this.addField(x));
		super.loadedData(event, ignoredFromGroup);
		this.countUDF = Array(22)
			.fill(22)
			.map((x, i) => (i < 9 ? '0' + (i + 1) : i + 1));
		this.patchFormValue();
		this.formGroup.get('_FixedApproverListDataSource').value.initSearch();
		this.formGroup.get('_FollowerListDataSource').value.initSearch();
		this.formGroup.get('_SelectableApproverListDataSource').value.initSearch();
		this.formGroup.get('_SupperApproverListDataSource').value.initSearch();
		this.formGroup.get('IDBranch').markAsDirty();

		if (this.item.IDSchemaMapping) {
			this.schemaService
				.getAnItem(this.item.IDSchemaMapping)
				.then((response: any) => {
					if (response) {
						this._schemaListMappingDetail = response.Fields;
					}
				})
				.catch((err) => {});
		}
		if (this.item.Type) {
			this.changeType(false);
		}
	}

	private patchFormValue() {
		if (this.formGroup.get('Id').value) {
			this.query.IDApprovalTemplate = this.item.Id;
			this.approvalRuleService.read(this.query).then((response: any) => {
				if (response && response.data && response.data.length > 0) this.approvalRuleList = response.data;
			});
			this.query.IDApprovalTemplate = undefined;
			if (this.item.FollowerList) {
				let followerList = this.patchConfig(this.item?.FollowerList);
				if (followerList) {
					this.formGroup.get('_FollowerList').setValue(followerList.map((m) => m.Id));
					this.formGroup.get('_FollowerListDataSource').value.selected = followerList;
				}
			}
			if (this.item.FixedApproverList) {
				let fixedApproverList = this.patchConfig(this.item.FixedApproverList);
				if (fixedApproverList) {
					this.formGroup.get('_FixedApproverList').setValue(fixedApproverList.map((m) => m.Id));
					this.formGroup.get('_FixedApproverListDataSource').value.selected = fixedApproverList;
				}
			}
			if (this.item.SelectableApproverList) {
				let selectableApproverList = this.patchConfig(this.item.SelectableApproverList);
				if (selectableApproverList) {
					this.formGroup.get('_SelectableApproverList').setValue(selectableApproverList.map((m) => m.Id));
					this.formGroup.get('_SelectableApproverListDataSource').value.selected = selectableApproverList;
				}
			}
			if (this.item.SupperApproverList) {
				let supperApproverList = this.patchConfig(this.item?.SupperApproverList);
				if (supperApproverList) {
					this.formGroup.get('_SupperApproverList').setValue(supperApproverList.map((m) => m.Id));
					this.formGroup.get('_SupperApproverListDataSource').value.selected = supperApproverList;
				}
			}
		}
	}
	patchConfig(config) {
		if (config) {
			return (config = JSON.parse(config));
		}
	}
	changeType(markAsDirty = true) {
		if (this.formGroup.get('Type').value == 'TimeOff') {
			this.env.getType('TimeOffType').then((rs) => {
				this.requestSubTypeList = rs;
			});
		} else {
			this.env.getType(this.formGroup.get('Type').value+'Type').then((rs) => {
				this.requestSubTypeList = rs;
			});
		}
		if (markAsDirty) {
			if(this.formGroup.get('SubType').value){
				this.formGroup.get('SubType').setValue(null);
				this.formGroup.get('SubType').markAsDirty();
			}
			this.saveChange();
			
		}
	}
	changeSchema() {
		this.query.Type = undefined;
		this.schemaService
			.getAnItem(this.formGroup.get('IDSchemaMapping').value)
			.then((response: any) => {
				if (response) {
					this._schemaListMappingDetail = response.Fields;
					Object.keys(this.formGroup.value).forEach((key) => {
						if (key.startsWith('UDFMapping') && this.formGroup.value[key]) {
							if (!this._schemaListMappingDetail.some((d) => d.Code == this.formGroup.value[key])) {
								this.formGroup.get(key).setValue(null);
								this.formGroup.get(key).markAsDirty();
							}
						}
					});
				}
			})
			.catch((err) => {})
			.finally(() => {
				this.saveChange();
			});
	}
	removeApprovalRule(index) {
		this.env.showPrompt('Bạn có chắc muốn xóa không?', null, 'Xóa approval rule').then((_) => {
			let apiPath = {
				delItem: {
					method: 'DELETE',
					url: function (id) {
						return ApiSetting.apiDomain('APPROVAL/ApprovalRule/') + id;
					},
				},
			};
			this.approvalRuleService.commonService.delete(this.approvalRuleList[index], apiPath).then((value) => {
				this.approvalRuleList.splice(index, 1);
			});
		});
	}
	segmentView = 's1';
	segmentChanged(ev: any) {
		if (ev.detail.value == 's2' && !this.approvalRuleList) {
			//approval Rule segment
			if (this.formGroup.get('Id').value) {
				this.query.IDApprovalTemplate = this.item.Id;
				this.env.showLoading('Please wait for a few moments', this.approvalRuleService.read(this.query)).then((response: any) => {
					if (response && response.data && response.data.length > 0) this.approvalRuleList = response.data;
				});
			}
		}
		this.segmentView = ev.detail.value;
	}

	changeStaffSelection(e, control) {
		e = JSON.stringify(e);
		this.formGroup.get(control).setValue(e);
		this.formGroup.get(control).markAsDirty();
		this.saveChange();
	}

	forwardToApprovalRule() {
		this.router.navigate(['/approval-rule/0'], {
			queryParams: { IDApprovalTemplate: this.formGroup.get('Id').value },
		});
	}

	async saveChange() {
		let submitItem = this.getDirtyValues(this.formGroup);
		super.saveChange2();
	}
}

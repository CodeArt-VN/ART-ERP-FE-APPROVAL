import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_AutoApprovalRuleProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, HRM_StaffProvider, SYS_SchemaDetailProvider, SYS_SchemaProvider, WMS_ZoneProvider, } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { Subject, catchError, concat, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-approval-rule-detail',
    templateUrl: './approval-rule-detail.page.html',
    styleUrls: ['./approval-rule-detail.page.scss'],
})
export class ApprovalRuleDetailPage extends PageBase {
    schemaDetailList: any;
    filter: any;
    schema: any;
    ApprovalRule: any;
    config : any;
    requestTypeList = [];
    statusList = [];
    timeOffTypeList = [];

    constructor(
        public pageProvider: APPROVAL_AutoApprovalRuleProvider,
        public branchProvider: BRA_BranchProvider,
        public env: EnvService,
        public navCtrl: NavController,
        public route: ActivatedRoute,
        public alertCtrl: AlertController,
        public formBuilder: FormBuilder,
        public cdr: ChangeDetectorRef,
        public loadingController: LoadingController,
        public commonService: CommonService,
        public schemaService: SYS_SchemaProvider,
        public schemaDetailService: SYS_SchemaDetailProvider,
        public approvalTemplateService: APPROVAL_TemplateProvider

    ) {
        super();
        this.pageConfig.isDetailPage = true;
        this.formGroup = this.formBuilder.group({
            Id: new FormControl({ value: '', disabled: true }),
            IDBranch:new FormControl({ value: env.selectedBranch, disabled: true }),
            Name: [''],
            Type: ['', Validators.required],
            SubType: [''],
            Remark: [''],
            Code: [''],
            IDSchema: [''],
            Sort: [''],
            SetStatus: [''],
            Config: [''],
            IsDisabled: new FormControl({ value: '', disabled: true }),
            IsDeleted: new FormControl({ value: '', disabled: true }),
            CreatedBy: new FormControl({ value: '', disabled: true }),
            CreatedDate: new FormControl({ value: '', disabled: true }),
            ModifiedBy: new FormControl({ value: '', disabled: true }),
            ModifiedDate: new FormControl({ value: '', disabled: true }),


        });
    }
    _IDSchemaDataSource:any= {
        searchProvider: this.schemaService,
        loading: false,
        input$: new Subject<string>(),
        selected: [],
        items$: null,
        initSearch() {
            this.loading = false;
            this.items$ = concat(
                of(this.selected),
                this.input$.pipe(
                    distinctUntilChanged(),
                    tap(() => this.loading = true),
                    switchMap(term => this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
                        catchError(() => of([])), // empty list on error
                        tap(() => this.loading = false)
                    ))

                )
            );
        }
    }

    preLoadData(event?: any): void {
        //this.query.IDStaff = this.env.user.StaffID;
        Promise.all([
            this.env.getType('RequestType'),
            this.env.getStatus('ApprovalStatus'),
            this.env.getType('TimeOffType'),
            this.env.getType('TimeOffType'),

        ]).then((values: any) => {
            this.requestTypeList = values[0];
            this.statusList = values[1];
            this.timeOffTypeList = values[2];
                        super.preLoadData(event);
        });
    }
    loadedData(event?: any, ignoredFromGroup?: boolean): void {
        super.loadedData(event, ignoredFromGroup);
        if(this.item?.IDSchema>0){
            this.schemaService.getAnItem(this.item.IDSchema).then(value => {
                this.schema = value;
            })
        }
        if(this.item?.Config && this.item?.IDSchema>0){

            this.patchConfig();
        }
        this._IDSchemaDataSource.initSearch();
    }
    patchConfig(){
        this.config =JSON.parse(this.item?.Config);
    }

    saveConfig(e) {
        if (e) {
            this.formGroup.get('Config').setValue(JSON.stringify(e));
            console.log(this.formGroup.getRawValue());
            console.log(JSON.parse(this.formGroup.get('Config').value));
            this.formGroup.get('Config').markAsDirty();
            this.saveChange();
            this.env.showTranslateMessage('erp.app.app-component.page-bage.save-complete', 'success');
        }
        else {
            this.env.showTranslateMessage('erp.app.app-component.page-bage.can-not-save', 'danger');
        }
    }

    changeType(subType = null) {
        if (this.formGroup.get('Config').value) {
           
            if (subType == null) {
                this.formGroup.get('SubType').setValue('');
                this.query.SubType_eq = null;
            }
            else {
                this.query.SubType_eq = subType;
            }
           
            this.query.Type = this.formGroup.get('Type').value;
            this.env.showLoading('Vui lòng chờ load dữ liệu...', this.approvalTemplateService.read(this.query))
                .then((response: any) => {
                    if (response.data && response.data.length && response.data[0].IDSchema) {
                        this.formGroup.get('IDSchema').setValue(response.data[0].IDSchema);
                        this.schemaService.getAnItem(this.formGroup.get('IDSchema').value).then(value => {
                            this.env.showPrompt("Thay đổi Type/SubType sẽ clear hết config. Bạn có muốn tiếp tục?", null, "Cảnh báo").then(_ => {
                                this.config = { 'Dimension': 'logical', 'Operator': 'AND', 'value': null, 'Logicals': [] }
                             })
                            this.schema = value;
                        })
                    }
                 
                }).catch(err => { });
        }
        this.saveChange();
    }

    changeSubType(e) {
        return this.changeType(e.target.value);
    }

    ngAfterViewChecked() {
        this.cdr.detectChanges();
    }

    async saveChange() {
        super.saveChange2();
    }
    segmentView = 's1';
    segmentChanged(ev: any) {
        this.segmentView = ev.detail.value;
    }
}

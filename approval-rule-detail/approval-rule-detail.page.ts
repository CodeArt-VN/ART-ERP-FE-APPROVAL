import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_AutoApprovalRuleProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, HRM_StaffProvider, SYS_SchemaDetailProvider, SYS_SchemaProvider, WMS_ZoneProvider, } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { Subject, catchError, concat, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

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
    ApprovalModes:[];
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
        public staffService: HRM_StaffProvider,
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
            ManualRules: this.formBuilder.array([]),
            DeletedManualRules: [[]],
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
            this.env.getType('ApprovalProcess')

        ]).then((values: any) => {
            this.requestTypeList = values[0];
            this.statusList = values[1];
            this.timeOffTypeList = values[2];
            this.ApprovalModes = values[3];
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

            this.formGroup.get('Config').setValue(this.patchConfig(this.item.Config));
        }
        this._IDSchemaDataSource.initSearch();
        this.formGroup.get('SubType').setValue(this.item?.SubType);
        this.formGroup.get('SetStatus').setValue(this.item?.SetStatus);
        if(this.item.ManualRules){
            this.patchRulesValue();
        }
    }
    private patchRulesValue() {
        if (this.item.ManualRules?.length) {
            this.item.ManualRules.forEach(i => this.addManualRule(i));
        }
    }
   
    addManualRule(rule:any,markAsDirty = false) {
        let approverList =this.patchConfig(rule?.ApproverList);
        let groups = <FormArray>this.formGroup.controls.ManualRules;
        let group = this.formBuilder.group({
            Id: new FormControl({ value: rule.Id, disabled: true }),
            IdApprovalRule: new FormControl({ value: this.formGroup.get('Id').value, disabled: true }),
            Code: [rule.Code],
            Name: [rule.Name],
            Remark: [rule.Remark],
            Sort: [rule.Sort],
            Config:[this.patchConfig(rule.Config)],
            ApprovalMode:[rule.ApprovalMode || "OnlyOneIsNeeded " ,Validators.required],
            ApproverList:[rule.ApproverList],
            IsDisabled: new FormControl({ value: rule.IsDisabled, disabled: true }),
            IsDeleted: new FormControl({ value: rule.IsDeleted, disabled: true }),
            CreatedBy: new FormControl({ value: rule.CreatedBy, disabled: true }),
            CreatedDate: new FormControl({ value: rule.CreatedDate, disabled: true }),
            ModifiedBy: new FormControl({ value: rule.ModifiedBy, disabled: true }),
            ModifiedDate: new FormControl({ value:  rule.ModifiedDate, disabled: true }),
            _approvalListIds: [approverList?.map(r=>r.Id)],
            _approverListDataSource:  {
                searchProvider: this.staffService,
                loading: false,
                input$: new Subject<string>(),
                selected: approverList,
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
            },
        })
        console.log(rule);
        group.get('ApprovalMode').markAsDirty();
        group.get('_approverListDataSource').value.initSearch();
       
        groups.push(group);
    }

    patchConfig(config){
        if(config){
            return config =JSON.parse(config);
        }
    }

    saveConfig(e,fg) {
        if (e) {
            
            fg.get('Config').setValue(JSON.stringify(e));
            fg.get('Config').markAsDirty();
            this.saveChange();
            fg.get('Config').setValue(e);
            this.env.showTranslateMessage('erp.app.app-component.page-bage.save-complete', 'success');
        }
        else {
            this.env.showTranslateMessage('erp.app.app-component.page-bage.can-not-save', 'danger');
        }
    }

    changeType(subType = null) {

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
                            var config = this.formGroup.get('Config').value;
                            if (config && config.Logicals?.length>0) {
                            this.env.showPrompt("Thay đổi Type/SubType sẽ xoá hết config. Bạn có muốn xoá ?", null, "Cảnh báo").then(_ => {
                                this.resetConfig(this.formGroup);
                                let groups = <FormArray>this.formGroup.controls.ManualRules;
                                groups.controls.forEach(g=>this.resetConfig(g));
                            })
                            }
                            this.schema = value;
                            this.formGroup.get('IDSchema').markAsDirty();
                            this.saveChange();
                        })
                     
                    }
                 
                }).catch(err => { });
    }

    changeSubType(e) {
        return this.changeType(e.Code);
    }

    changeApprovedBy(e,c){
        e = JSON.stringify(e);
        c.controls.ApproverList.setValue(e)
        c.controls.ApproverList.markAsDirty();
        this.saveChange();
    }
    resetConfig(fg){
        fg.get('Config').setValue({ 'Dimension': 'logical', 'Operator': 'AND', 'value': null, 'Logicals': [] });
    }
    removeManualRule(g,index){
        this.env.showPrompt('Bạn có chắc muốn xóa?', null, 'Xóa manual rule').then(_ => {
            let groups = <FormArray>this.formGroup.controls.ManualRules;
            //groups.controls[index].get('IsDeleted').setValue(true);
            groups.removeAt(index);
            this.item.ManualRules.splice(index, 1);
            let deletedManualRules = this.formGroup.get('DeletedManualRules').value;
            let deletedId = g.controls.Id.value;
            deletedManualRules.push(deletedId);

            this.formGroup.get('DeletedManualRules').setValue(deletedManualRules);
            this.formGroup.get('DeletedManualRules').markAsDirty();
          //  groups.controls[index].markAsDirty();
           // groups.controls[index].get('IsDeleted').markAsDirty()
            this.saveChange();
        }).catch(_ => { });

    }
    
    ngAfterViewChecked() {
        this.cdr.detectChanges();
    }

    async saveChange() {
        let submitItem = this.getDirtyValues(this.formGroup);
        super.saveChange2();
    }
    segmentView = 's1';
    segmentChanged(ev: any) {
        this.segmentView = ev.detail.value;
    }
  
}

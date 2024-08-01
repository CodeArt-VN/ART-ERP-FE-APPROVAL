import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, PopoverController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute, Router } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import {
  APPROVAL_ApprovalRuleProvider,
  APPROVAL_TemplateProvider,
  BRA_BranchProvider,
  HRM_StaffProvider,
  SYS_SchemaDetailProvider,
  SYS_SchemaProvider,
} from 'src/app/services/static/services.service';
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
  schema: any;
  ApprovalRule: any;
  ApprovalModes: [];
  approvalTemplate: any;
  config: any;
  requestTypeList = [];
  statusList = [];
  timeOffTypeList = [];

  constructor(
    public pageProvider: APPROVAL_ApprovalRuleProvider,
    public branchProvider: BRA_BranchProvider,
    public popoverCtrl: PopoverController,
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
    public approvalTemplateService: APPROVAL_TemplateProvider,
    public router: Router,
  ) {
    super();
    this.pageConfig.isDetailPage = true;
    this.formGroup = this.formBuilder.group({
      Id: new FormControl({ value: '', disabled: true }),
      IDBranch: new FormControl({
        value: this.env.selectedBranch,
        disabled: false,
      }),
      Name: ['', Validators.required],
      Type: ['', Validators.required],
      SubType: [''],
      Remark: [''],
      Code: [''],
      IDApprovalTemplate: [''],
      Sort: [''],
      SetStatus: [''],
      Config: [''],
      _Config: [''],
      RuleApprovers: this.formBuilder.array([]),
      DeletedRuleApprovers: [[]],
      IsDisabled: new FormControl({ value: '', disabled: true }),
      IsDeleted: new FormControl({ value: '', disabled: true }),
      CreatedBy: new FormControl({ value: '', disabled: true }),
      CreatedDate: new FormControl({ value: '', disabled: true }),
      ModifiedBy: new FormControl({ value: '', disabled: true }),
      ModifiedDate: new FormControl({ value: '', disabled: true }),
    });
  }

  preLoadData(event?: any): void {
    //this.query.IDStaff = this.env.user.StaffID;
    Promise.all([
      this.env.getType('RequestType'),
      this.env.getStatus('ApprovalStatus'),
      this.env.getType('TimeOffType'),
      this.env.getType('ApprovalProcess'),
    ]).then((values: any) => {
      this.requestTypeList = values[0];
      this.statusList = values[1];
      this.timeOffTypeList = values[2];
      this.ApprovalModes = values[3];
      super.preLoadData(event);
    });

    if (this.route.snapshot.queryParams.IDApprovalTemplate) {
      this.formGroup.get('IDApprovalTemplate').setValue(parseInt(this.route.snapshot.queryParams.IDApprovalTemplate));
    }
  }
  loadedData(event?: any, ignoredFromGroup?: boolean): void {
    super.loadedData(event, ignoredFromGroup);

    if (this.formGroup.get('IDApprovalTemplate').value > 0) {
      this.approvalTemplateService.getAnItem(this.formGroup.get('IDApprovalTemplate').value).then((value: any) => {
        if (value) {
          this.approvalTemplate = value;
        }
        this.formGroup.get('Type').setValue(this.approvalTemplate.Type);
        this.formGroup.get('SubType').setValue(this.approvalTemplate.SubType);
        this.schema = {};
        this.schema.Fields = [];
        let listField = Object.keys(this.approvalTemplate).filter((d) => d.includes('IsUseUDF'));
        listField.forEach((f) => {
          if (this.approvalTemplate[f]) {
            let mappingValue = f.replace('IsUseUDF', 'UDF');
            let labelValue = f.replace('IsUseUDF', 'UDFLabel');
            this.schema.Fields.push({
              Code: mappingValue,
              Name: this.approvalTemplate[labelValue],
            });
          }
        });
      });
    }

    if (this.item?.Config) {
      this.formGroup.get('_Config').setValue(this.patchConfig(this.item.Config));
    }

    if (this.item.RuleApprovers) {
      this.formGroup.setControl('RuleApprovers', this.formBuilder.array([]));
      this.patchRulesValue();
    }
    this.formGroup.get('IDBranch').markAsDirty();
    this.formGroup.get('Type').markAsDirty();
    this.formGroup.get('IDApprovalTemplate').markAsDirty();
  }
  private patchRulesValue() {
    if (this.item.RuleApprovers?.length) {
      this.item.RuleApprovers.forEach((i) => this.addRuleApprovers(i));
    }
  }

  addRuleApprovers(rule: any, markAsDirty = false) {
    let approverList = this.patchConfig(rule?.ApproverList);
    let groups = <FormArray>this.formGroup.controls.RuleApprovers;
    let group = this.formBuilder.group({
      Id: new FormControl({ value: rule.Id, disabled: true }),
      IdApprovalRule: new FormControl({
        value: this.formGroup.get('Id').value,
        disabled: true,
      }),
      Code: [rule.Code],
      Name: [rule.Name, Validators.required],
      Remark: [rule.Remark],
      Sort: [rule.Sort],
      Config: [this.patchConfig(rule.Config)],
      _Config: [this.patchConfig(rule.Config)],
      ApprovalMode: [rule.ApprovalMode, Validators.required],
      ApproverList: [rule.ApproverList],
      IsDisabled: new FormControl({
        value: rule.IsDisabled,
        disabled: true,
      }),
      IsDeleted: new FormControl({
        value: rule.IsDeleted,
        disabled: true,
      }),
      CreatedBy: new FormControl({
        value: rule.CreatedBy,
        disabled: true,
      }),
      CreatedDate: new FormControl({
        value: rule.CreatedDate,
        disabled: true,
      }),
      ModifiedBy: new FormControl({
        value: rule.ModifiedBy,
        disabled: true,
      }),
      ModifiedDate: new FormControl({
        value: rule.ModifiedDate,
        disabled: true,
      }),
      _approvalListIds: [approverList?.map((r) => r.Id)],
      _approverListDataSource: {
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
              tap(() => (this.loading = true)),
              switchMap((term) =>
                this.searchProvider.search({ Take: 20, Skip: 0, Term: term }).pipe(
                  catchError(() => of([])), // empty list on error
                  tap(() => (this.loading = false)),
                ),
              ),
            ),
          );
        },
      },
    });
    console.log(rule);
    group.get('_approverListDataSource').value.initSearch();
    // group.get('ApprovalMode').markAsDirty();
    groups.push(group);
  }

  patchConfig(config) {
    if (config) {
      return (config = JSON.parse(config));
    }
  }

  saveConfig(e, fg) {
    if (e) {
      fg.get('Config').setValue(JSON.stringify(e));
      fg.get('Config').markAsDirty();
      this.saveChange();
      this.env.showTranslateMessage('Saving completed!', 'success');
    } else {
      this.env.showTranslateMessage('Cannot save, please try again', 'danger');
    }
  }

  changeApprovedBy(e, c) {
    e = JSON.stringify(e);
    c.controls.ApproverList.setValue(e);
    c.controls.ApproverList.markAsDirty();
    this.saveChange();
  }
  resetConfig(fg) {
    fg.get('Config').setValue({
      Dimension: 'logical',
      Operator: 'AND',
      value: null,
      Logicals: [],
    });
    fg.get('_Config')?.setValue({
      Dimension: 'logical',
      Operator: 'AND',
      value: null,
      Logicals: [],
    });
    fg.get('Config').markAsDirty();
  }
  removeRuleApprovers(g, index) {
    this.env
      .showPrompt('Bạn có chắc muốn xóa?', null, 'Xóa manual rule')
      .then((_) => {
        let groups = <FormArray>this.formGroup.controls.RuleApprovers;
        //groups.controls[index].get('IsDeleted').setValue(true);
        groups.removeAt(index);
        this.item.RuleApprovers.splice(index, 1);
        let DeletedRuleApprovers = this.formGroup.get('DeletedRuleApprovers').value;
        let deletedId = g.controls.Id.value;
        DeletedRuleApprovers.push(deletedId);

        this.formGroup.get('DeletedRuleApprovers').setValue(DeletedRuleApprovers);
        this.formGroup.get('DeletedRuleApprovers').markAsDirty();
        //  groups.controls[index].markAsDirty();
        // groups.controls[index].get('IsDeleted').markAsDirty()
        this.saveChange();
      })
      .catch((_) => {});
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  async saveChange() {
    let submitItem = this.getDirtyValues(this.formGroup);
    super.saveChange2();
  }

  savedChange(savedItem = null, form = this.formGroup) {
    super.savedChange(savedItem, form);
    this.item = savedItem;
    this.loadedData();
  }

  segmentView = 's1';
  segmentChanged(ev: any) {
    this.segmentView = ev.detail.value;
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController, NavParams } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_TemplateProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';
import { Subject, concat, distinctUntilChanged, of } from 'rxjs';

@Component({
    selector: 'app-request-modal',
    templateUrl: './request-modal.page.html',
    styleUrls: ['./request-modal.page.scss'],
    standalone: false
})
export class RequestModalPage extends PageBase {
  requestTypeList = [];
  statusList = [];
  timeOffTypeList = [];
  approvalTemplateList = [];
  template;
  _approverListDataSource;
  constructor(
    public pageProvider: WMS_ZoneProvider,
    public approvalTemplateService: APPROVAL_TemplateProvider,
    public modalController: ModalController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
  ) {
    super();
    this.pageConfig.isDetailPage = true;
    this.formGroup = formBuilder.group({
      IDBranch: [env.selectedBranch],
      IDStaff: [env.user.StaffID],
      Id: [''],
      IDApprovalTemplate: ['', Validators.required],
      Name: [''],
      Type: ['', Validators.required],
      SubType: [''],
      ApprovalMode: [''],
      Status: ['Draft'],
      SelectableApproverIds: [''],
      Amount: [0],

      UDFLabel01: new FormControl({ value: '', disabled: true }),
      UDFLabel02: new FormControl({ value: '', disabled: true }),
      UDFLabel03: new FormControl({ value: '', disabled: true }),
      UDFLabel04: new FormControl({ value: '', disabled: true }),
      UDFLabel05: new FormControl({ value: '', disabled: true }),
      UDFLabel06: new FormControl({ value: '', disabled: true }),
      UDFLabel07: new FormControl({ value: '', disabled: true }),
      UDFLabel08: new FormControl({ value: '', disabled: true }),
      UDFLabel09: new FormControl({ value: '', disabled: true }),
      UDFLabel10: new FormControl({ value: '', disabled: true }),
      UDFLabel11: new FormControl({ value: '', disabled: true }),
      UDFLabel12: new FormControl({ value: '', disabled: true }),
      UDFLabel13: new FormControl({ value: '', disabled: true }),
      UDFLabel14: new FormControl({ value: '', disabled: true }),
      UDFLabel15: new FormControl({ value: '', disabled: true }),
      UDFLabel16: new FormControl({ value: '', disabled: true }),
      UDFLabel17: new FormControl({ value: '', disabled: true }),
      UDFLabel18: new FormControl({ value: '', disabled: true }),
      UDFLabel19: new FormControl({ value: '', disabled: true }),
      UDFLabel20: new FormControl({ value: '', disabled: true }),
      UDFLabel21: new FormControl({ value: '', disabled: true }),
      UDFLabel22: new FormControl({ value: '', disabled: true }),

      UDF01: new FormControl({ value: '', disabled: true }),
      UDF02: new FormControl({ value: '', disabled: true }),
      UDF03: new FormControl({ value: '', disabled: true }),
      UDF04: new FormControl({ value: '', disabled: true }),
      UDF05: new FormControl({ value: '', disabled: true }),
      UDF06: new FormControl({ value: '', disabled: true }),
      UDF07: new FormControl({ value: '', disabled: true }),
      UDF08: new FormControl({ value: '', disabled: true }),
      UDF09: new FormControl({ value: '', disabled: true }),
      UDF10: new FormControl({ value: '', disabled: true }),
      UDF11: new FormControl({ value: '', disabled: true }),
      UDF12: new FormControl({ value: '', disabled: true }),
      UDF13: new FormControl({ value: '', disabled: true }),
      UDF14: new FormControl({ value: '', disabled: true }),
      UDF15: new FormControl({ value: '', disabled: true }),
      UDF16: new FormControl({ value: '', disabled: true }),
      UDF17: new FormControl({ value: '', disabled: true }),
      UDF18: new FormControl({ value: '', disabled: true }),
      UDF19: new FormControl({ value: '', disabled: true }),
      UDF20: new FormControl({ value: '', disabled: true }),
      UDF21: new FormControl({ value: '', disabled: true }),
      UDF22: new FormControl({ value: '', disabled: true }),

      //
      // Code
      // Name
      // Remark
      // Sort
      // IsDisabled
      // IsDeleted
      // CreatedBy
      // ModifiedBy
      // CreatedDate
      // ModifiedDate
      // FileURL
      // ApproverBy
      // AmountNo
      // Amount
      // Reason
      // DueDate
      // ReceivedBy
      // HandingOverWork
      // Debator
      // DebatorDepartment
      // CurrentJobTitle
      // DebateJobTitle
      // Item
      // Quantity
      // Participant
      // Requirement
      // StartFrom
      // EndTo
      // ItemStatus
      // CurrentAmount
      // DesireAmount
      // Employee
      // FromDate
      // ToDate
      // UDF01
      // UDF02
      // UDF03
      // UDF04
      // UDF05
      // UDF06
      // UDF07
      // UDF08
      // UDF09
      // UDF10
      // UDF11
      // UDF12
      // UDF13
      // UDF14
      // UDF15
      // UDF16
      // UDF17
      // UDF18
      // UDF19
      // UDF20
      // UDF21
      // UDF22
    });
  }

  preLoadData(event?: any): void {
    // this.requestTypeList = this.navParams.data.requestTypeList;
    // this.statusList = this.navParams.data.statusList;

    // this.item = this.navParams.data.item;
    // this.id = this.navParams.data.id;
    console.log(this);

    super.loadedData(event);
  }

  changeTemplate(e) {
    Object.keys(this.formGroup.controls)
      .filter((d) => d.includes('UDFLabel'))
      .forEach((key) => {
        let udf = key.replace('Label', '');
        this.formGroup.get(udf).disable();
        this.formGroup.get(key).setValue('');
      });
    this.approvalTemplateService.getAnItem(e.Id).then((value: any) => {
      if (value) {
        this.template = value;
        this.formGroup.get('Type').setValue(this.template.Type);
        let keys = Object.keys(this.template).filter((d) => d.includes('IsUseUDF'));
        keys.forEach((d) => {
          if (value[d]) {
            let label = d.replace('IsUseUDF', 'UDFLabel');
            let udf = d.replace('IsUseUDF', 'UDF');
            this.formGroup.get(udf).enable();
            this.formGroup.get(label).setValue(this.template[label]);
          }
        });
        if (this.template.IsUserCanChooseApprover) {
          this._approverListDataSource = JSON.parse(this.template.SelectableApproverList);
        }
      }
    });
  }
  submit(status = null) {
    if (status) {
      this.formGroup.controls.Status.setValue(status);
    }

    this.formGroup.updateValueAndValidity();
    if (!this.formGroup.valid) {
      let a = this.findInvalidControls();
      this.env.showMessage('Please recheck information highlighted in red above', 'warning');
    } else {
      let submitItem = this.formGroup.value; //this.getDirtyValues(this.formGroup);
      this.modalController.dismiss(submitItem);
    }
  }
  public findInvalidControls() {
    const invalid = [];
    const controls = this.formGroup.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }
}

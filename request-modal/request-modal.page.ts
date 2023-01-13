import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController, NavParams } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { WMS_ZoneProvider, } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';

@Component({
    selector: 'app-request-modal',
    templateUrl: './request-modal.page.html',
    styleUrls: ['./request-modal.page.scss'],
})
export class RequestModalPage extends PageBase {
    requestTypeList = [];
    statusList = [];
    timeOffTypeList = [];
    
    constructor(
        public pageProvider: WMS_ZoneProvider,

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
            Type:['', Validators.required],
            SubType: [''],

            Status: [''],

            Name: ['', Validators.required],
            Remark: ['', Validators.required],

            Start: ['', Validators.required],
            End: ['', Validators.required],
        
            Amount: [0],
            
            
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


    submit(status=null) {
        if (status) {
            this.formGroup.controls.Status.setValue(status);
        }
        
        this.formGroup.updateValueAndValidity();
        if (!this.formGroup.valid) {
            this.env.showTranslateMessage('erp.app.pages.approval.request.message.check-red-above','warning');
        }
        else {
            let submitItem = this.formGroup.value;//this.getDirtyValues(this.formGroup);
            this.modalController.dismiss(submitItem);
        }
    }
}
import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { BRA_BranchProvider, HRM_StaffProvider, WMS_ZoneProvider,  } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Subject, catchError, concat, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-approval-template-detail',
    templateUrl: './approval-template-detail.page.html',
    styleUrls: ['./approval-template-detail.page.scss'],
})
export class ApprovalTemplateDetailPage extends PageBase {
    schemaDetailList:any;
    filter:any;
    schemaList:any;
    schema:any;
    ApprovalRule:any;
    countUDF = 0;
     constructor(
        public pageProvider: WMS_ZoneProvider,
        public branchProvider: BRA_BranchProvider,
        public env: EnvService,
        public navCtrl: NavController,
        public route: ActivatedRoute,
        public alertCtrl: AlertController,
        public formBuilder: FormBuilder,
        public cdr: ChangeDetectorRef,
        public loadingController: LoadingController,
        public commonService: CommonService,
    ) {
        super();
        this.pageConfig.isDetailPage = true;
        this.formGroup = this.formBuilder.group({
            Id: new FormControl({ value: '', disabled: true }),
            Name: ['', Validators.required],
            Type: ['', Validators.required],
            Remark: [''],
            SubType: [''],
            Sort: [''],
            IsDisabled: new FormControl({ value: '', disabled: true }),
            IsDeleted: new FormControl({ value: '', disabled: true }),
            CreatedBy: new FormControl({ value: '', disabled: true }),
            CreatedDate: new FormControl({ value: '', disabled: true }),
            ModifiedBy: new FormControl({ value: '', disabled: true }),
            ModifiedDate: new FormControl({ value: '', disabled: true }),
            DeletedFields: [[]],
        });


    }
    preLoadData(event){
       this.item = {
        Name:'aaa',
        Type:'so',
        Remark: 'ssss',
        SubType: 'ssaa',
        Sort: 1,
        IsUseUDF01:true,
        UDFLabel01:'aaaa'
       }
       super.preLoadData(event);   
    }
    loadedData(event?: any, ignoredFromGroup?: boolean): void {
        // this.item.Fields.forEach(x=> this.addField(x));
        super.loadedData(event, ignoredFromGroup);
        this.patchFormValue();
    }

    private patchFormValue() {
        let  prop = Object.keys(this.item);
        prop.forEach(x=>{
            if(x.startsWith('UDFLabel')|| x.startsWith('UDFLabel') ){
                this.formGroup.addControl(x, new FormControl(this.item[x]));
                this.countUDF+=1;
            }
        })
        //this.formGroup?.patchValue(this.item);
    }
   
    addUDF(i){
        let nameIdx = i < 10 ? "0"+i: i;
        this.formGroup.addControl('IsUseUDF'+nameIdx, new FormControl(true));
        this.formGroup.addControl('UDFLabel'+nameIdx,new FormControl(''));
    }

    segmentView = 's1';
    segmentChanged(ev: any) {
        this.segmentView = ev.detail.value;
    }

}

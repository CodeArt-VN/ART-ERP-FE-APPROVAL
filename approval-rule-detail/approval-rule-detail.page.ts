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
    selector: 'app-approval-rule-detail',
    templateUrl: './approval-rule-detail.page.html',
    styleUrls: ['./approval-rule-detail.page.scss'],
})
export class ApprovalRuleDetailPage extends PageBase {
    schemaDetailList:any;
    filter:any;
    schemaList:any;
    schema:any;
    ApprovalRule:any;

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
        public staffProvider: HRM_StaffProvider,
    ) {
        super();
        this.pageConfig.isDetailPage = true;
       
        this.schemaList =[{//so
            IDSchema: 1, Code: 'SaleOrder', Name: 'Sale orders', Type: 'Dataset', ModifiedDate: '2023-01-01',
            Fields: [
                { IDSchema: null, Id: null, Code: 'logical', Name: 'Logical', Type: 'Logical', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                //////////////////////////////
                { IDSchema: 1, Id: 1, Code: 'SOTotalValue', Name: 'Giá trị chênh lệch', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 2, Code: 'SODefault', Name: 'Giá trị trong khung', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 3, Code: 'SODiscount', Name: 'Giá trị Discount', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 4, Code: 'SOPercentDiscount', Name: '% Giá trị Discount', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 5, Code: 'IsHigherPrice', Name: 'Giá bán thời điểm CAO hơn giá bán mặc định', Type: 'number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 6, Code: 'IsLowerPrice', Name: 'Giá bán thời điểm THẤP hơn giá bán mặc định', Type: 'number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 7, Code: 'ApprovalProcess', Name: 'Cách duyệt', Type: 'select-process', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 8, Code: 'ApprovedBy', Name: 'Người duyệt', Type: 'ng-select-staff', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 9, Code: 'AutoApproval', Name: 'Duyệt tự động', Type: 'bool', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
            ]
            },
            {
            IDSchema: 2, Code: 'PurchaseOrder', Name: 'Purchase orders', Type: 'Dataset', ModifiedDate: '2023-01-01',
            Fields: [
                { IDSchema: 1, Id: 10, Code: 'logical', Name: 'Logical', Type: 'Logical', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 11, Code: 'SOTotalValue', Name: 'Giá trị chênh lệch', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 12, Code: 'SODefault', Name: 'Giá trị trong khung SO', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 13, Code: 'SODiscount', Name: 'Giá trị SO Discount', Type: 'Number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 14, Code: 'IsHigherPrice', Name: 'Giá bán thời điểm CAO hơn giá bán mặc định', Type: 'number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 15, Code: 'IsLowerPrice', Name: 'Giá bán thời điểm THẤP hơn giá bán mặc định', Type: 'number', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 16, Code: 'ApprovalProcess', Name: 'Cách duyệt', Type: 'Text', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 17, Code: 'ApprovedBy', Name: 'Người duyệt', Type: 'Text', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
                { IDSchema: 1, Id: 18, Code: 'AutoApproval', Name: 'Duyệt tự động', Type: 'bool', Icon: 'star', Aggregate: '', Sort: 1, Remark: '' },
            ]
            },
        ];
       
        //let id  =  this.route.snapshot.params.id;

    }
    preLoadData(event?: any): void {
        this.item = {
            Id:1,
            IDSchema:1,
            Name: "SO",
            Code:"so",
            Remark:'Sale Order',
            Filters :[
                {
                    ScemaDetailID : 1,
                    Filter:{
                        Dimension: 'logical', Operator: 'OR',
                        Logicals: [
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'SODiscount', Operator: 'less than or equals', Value: '1000000'},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1923]},
                            ]},
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'logical', Operator: 'OR',Logicals:[
                                    {Dimension: 'SODiscount', Operator: 'greater than', Value: '1000000'},
                                    {Dimension: 'SODiscount', Operator: 'less than or equals', Value: '3000000'},
                                ]},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1957]},
                            ]}, 
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'logical', Operator: 'OR',Logicals:[
                                    {Dimension: 'SODiscount', Operator: 'greater than', Value: '3000000'},
                                    {Dimension: 'SODiscount', Operator: 'less than or equals', Value: '10000000'},
                                ]},  
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1950]},
                            ]},
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'SODiscount', Operator: 'greater than', Value: '10000000'},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[978,1957]},
                            ]},
        
                        ]
                    }
                      
                },
                {
                    ScemaDetailID : 2,
                    Filter:
                    {
                    Dimension: 'logical', Operator: 'OR',
                    Logicals: [
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'SOPercentDiscount', Operator: 'less than or equals', Value: '20%'},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1957,978]},
                            ]},
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'logical', Operator: 'OR',Logicals:[
                                    {Dimension: 'SOPercentDiscount', Operator: 'greater than', Value: '10%'},
                                    {Dimension: 'SOPercentDiscount', Operator: 'less than or equals', Value: '20%'},
                                ]},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1957]},
                            ]},
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'logical', Operator: 'OR',Logicals:[
                                    {Dimension: 'SOPercentDiscount', Operator: 'greater than', Value: '10%'},
                                    {Dimension: 'SOPercentDiscount', Operator: 'less than or equals', Value: '20%'},
                                ]},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[1957]},
                            ]},
                            { Dimension: 'logical', Operator: 'AND',Logicals:[
                                {Dimension: 'SOPercentDiscount', Operator: 'greater than', Value: '10%'},
                                {Dimension: 'ApprovalProcess', Operator: 'equals',Value:'1319'},
                                {Dimension: 'ApprovedBy', Operator: 'equals',Value:[978]},
                            ]},
        
                            //
                            
                            ]
                        }
                },
                
            ]
        }
     
    }
   
    saveConfig(e){
        if(e){
            this.env.showTranslateMessage('erp.app.app-component.page-bage.save-complete','success');
        }
        else{
            this.env.showTranslateMessage('erp.app.app-component.page-bage.can-not-save','danger');
        }
       console.log(e)
    }
    async saveChange() {
        super.saveChange2();
    }

}

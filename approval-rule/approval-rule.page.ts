import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { BRA_BranchProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
    selector: 'app-approval-rule',
    templateUrl: 'approval-rule.page.html',
    styleUrls: ['approval-rule.page.scss']
})
export class ApprovalRulePage extends PageBase {
    ApprovalRule:any[];
    selectedBranch = null;
    branchList = [];
    showCheckedOnly = false;
    isAllRowOpened = false;
    isAddReportModalOpen = false;
    isAddColorModalOpen = false;
    constructor(
        public pageProvider: WMS_ZoneProvider,
        public branchProvider: BRA_BranchProvider,
        public modalController: ModalController,
		public popoverCtrl: PopoverController,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public env: EnvService,
        public navCtrl: NavController,
        public location: Location,
    ) {
        super(
        );
    }
  
    loadData(event?: any): void {
       
        this.ApprovalRule =[
            {
                Id:1,
                Name: "SO",
                Code:"SORule",
                IDParent:1,
                Remark:'Sale Order',
                level:[
                    {
                        Id:1,
                        Name:'Giá trị Discount',
                        IDParent:1,
                        IsActive:false,
                        Remark:'Duyệt theo tổng giá trị cột giảm giá',
                      //  Item: filterSODifferenceValue
                    },
                    {
                        Id:2,
                        Name:'% Discount',
                        IDParent:1,
                        IsActive:false,
                        Remark:'Duyệt theo ô % giảm giá toàn SO',
                    },
                    {
                        Id:3,
                        Name:'Tổng giá trị',
                        IDParent:1  ,
                        IsActive:false,
                        Remark:'Duyệt theo tổng giá trị trước thuế của SO',
                    },
                    {
                        Id:4,
                        Name:'Giá bán',
                        IDParent:1  ,
                        IsActive:false,
                        Remark:'Giá bán thời điểm CAO hơn so với giá bán mặc định',
                     },
                    {
                        Id:5,
                        Name:'Giá bán',
                        IDParent:1,
                        IsActive:false,
                        Remark:'Giá bán thời điểm THẤP hơn so với giá bán mặc định',
                     },
                ]
            },
            {
                Id:2,
                Name: "PO",
                Code:"PORule",
                HasChild:true,
                level:[],
                Remark:'Purchase Order',
            },
        ]
    }
    changeTogge(i){
        i.IsActive = !i.IsActive;
    }

    onSelectIcon(e){
        console.log(e);
    }

    onSelectColor(e){
        console.log(e);
    }
}

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
    selectedBranch = null;
    showCheckedOnly = false;
    isAllRowOpened = false;
    isAddReportModalOpen = false;
    isAddColorModalOpen = false;
    constructor(
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
       
        this.items =[
            {
                Id:1,
                IDBranch:610,
                Name: "SO",
                Code:"SORule",
                IDSchema: 1,
                Type: "SO Type",
                SubType:"",
                Remark:'Sale Order',
                
            },
            {
                Id:2,
                IDBranch:610,
                Name: "PO",
                Code:"PORule",
                IDSchema: 2,
                Type: "PO Type",
                SubType:"",
                Remark:'Purchase Order',
            },
        ]
    }

  
}

import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { APPROVAL_AutoApprovalRuleProvider, BRA_BranchProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
    selector: 'app-approval-rule',
    templateUrl: 'approval-rule.page.html',
    styleUrls: ['approval-rule.page.scss']
})
export class ApprovalRulePage extends PageBase {
    showCheckedOnly = false;
    isAllRowOpened = false;
    isAddReportModalOpen = false;
    isAddColorModalOpen = false;
    constructor(
        public pageProvider: APPROVAL_AutoApprovalRuleProvider,
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
  
    preLoadData(event?: any): void {
        super.preLoadData(event);
    }

  
}

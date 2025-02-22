import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { APPROVAL_TemplateProvider, BRA_BranchProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';

@Component({
	selector: 'app-approval-template',
	templateUrl: 'approval-template.page.html',
	styleUrls: ['approval-template.page.scss'],
	standalone: false,
})
export class ApprovalTemplatePage extends PageBase {
	selectedBranch = null;
	showCheckedOnly = false;
	isAllRowOpened = false;
	isAddReportModalOpen = false;
	isAddColorModalOpen = false;
	constructor(
		public pageProvider: APPROVAL_TemplateProvider,
		public branchProvider: BRA_BranchProvider,
		public modalController: ModalController,
		public popoverCtrl: PopoverController,
		public alertCtrl: AlertController,
		public loadingController: LoadingController,
		public env: EnvService,
		public navCtrl: NavController,
		public location: Location
	) {
		super();
	}
}

import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { APPROVAL_RequestProvider, BRA_BranchProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { RequestModalPage } from '../request-modal/request-modal.page';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-request',
    templateUrl: 'request.page.html',
    styleUrls: ['request.page.scss']
})
export class RequestPage extends PageBase {
    requestTypeList = [];
    statusList = [];
    timeOffTypeList = [];
    imgPath = '';
    constructor(
        public pageProvider: APPROVAL_RequestProvider,
        public branchProvider: BRA_BranchProvider,
        public modalController: ModalController,
		public popoverCtrl: PopoverController,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public env: EnvService,
        public navCtrl: NavController,
        public location: Location,
    ) {
        super();
        this.imgPath = environment.staffAvatarsServer;
    }

    preLoadData(event?: any): void {
        this.query.IDStaff = this.env.user.StaffID;
        Promise.all([
            this.env.getType('RequestType'),
            this.env.getStatus('ApprovalStatus'),
            this.env.getType('TimeOffType'),
            this.env.getType('TimeOffType'),

        ]).then((values: any) => {
            this.requestTypeList = values[0];
            this.statusList = values[1];
            this.timeOffTypeList = values[2];
            super.preLoadData(event);
        });
    }

    loadedData(event?: any, ignoredFromGroup?: boolean): void {
        this.items.forEach(i => {
            i._Type = this.requestTypeList.find(d=>d.Code==i.Type);
            i._Status = this.statusList.find(d=>d.Code==i.Status);
           
            if (i.Type=='Payment') {
                i.AmountText = lib.currencyFormatFriendly(i.Amount);
            }
            else if(i.Type=='TimeOff'){
                let d1 = new Date(i.Start);
                let d2 = new Date( i.End);
                let diff = Math.abs( d1.valueOf() - d2.valueOf() );
                i.AmountText = ((diff/ 86400000)+1) + ' N';
            }

            i.StartText = lib.dateFormat(i.Start, 'dd/mm');
            i.Start = lib.dateFormat(i.Start);
            i.EndText = lib.dateFormat(i.End, 'dd/mm');
            i.End = lib.dateFormat(i.End);
        });

        super.loadedData(event, ignoredFromGroup);
    }

    async showModal(i) {
        const modal = await this.modalController.create({
            component: RequestModalPage,
            componentProps: {
                requestTypeList: this.requestTypeList,
                statusList: this.statusList,
                timeOffTypeList: this.timeOffTypeList,
                item: i,
                id: i.Id
            },
            cssClass: 'my-custom-class'
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        if (data) {
            this.pageProvider.save(data).then(resp => {
                this.refresh();
                // if (data.Id == 0) {
                //     this.items.unshift(resp);
                // }
                // else {
                //     this.refresh();
                //}
            });
        }
    }

    add() {
        let newItem = {
            Id: 0
        };
        this.showModal(newItem);
    }

}

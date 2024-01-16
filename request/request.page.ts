import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { EnvService } from 'src/app/services/core/env.service';
import { PageBase } from 'src/app/page-base';
import { APPROVAL_RequestProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, SYS_SchemaDetailProvider, SYS_SchemaProvider } from 'src/app/services/static/services.service';
import { Location } from '@angular/common';
import { RequestModalPage } from '../request-modal/request-modal.page';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { lib } from 'src/app/services/static/global-functions';
import { environment } from 'src/environments/environment';
import { FormBuilder } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';

@Component({
    selector: 'app-request',
    templateUrl: 'request.page.html',
    styleUrls: ['request.page.scss']
})
export class RequestPage extends PageBase {
    schema: any;
    IDSchema: any;
    type: any;
    subType;
    ApprovalRule: any;
    config: any;
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
        public formBuilder: FormBuilder,
        public commonService: CommonService,
        public schemaService: SYS_SchemaProvider,
        public schemaDetailService: SYS_SchemaDetailProvider,
        public approvalTemplateService: APPROVAL_TemplateProvider
    ) {
        super();
        this.imgPath = environment.staffAvatarsServer;
        this.pageConfig.isShowFeature = false;
    }

    preLoadData(event?: any): void {
        this.query.SortBy = 'Id_desc';
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
            i._Type = this.requestTypeList.find(d => d.Code == i.Type);
            i._Status = this.statusList.find(d => d.Code == i.Status);

            if (i.Type == 'Payment') {
                i.AmountText = lib.currencyFormatFriendly(i.Amount);
            }
            else if (i.Type == 'TimeOff') {
                let d1 = new Date(i.Start);
                let d2 = new Date(i.End);
                let diff = Math.abs(d1.valueOf() - d2.valueOf());
                i.AmountText = ((diff / 86400000) + 1) + ' N';
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

    changeType(subType = null) {

        if (subType == null) {
            this.query.SubType_eq = null;
            this.subType = null;
        }
        else {
            this.query.SubType_eq = subType;
        }
        this.config = { 'Dimension': 'logical', 'Operator': 'AND', 'value': null, 'Logicals': [] }
        this.query.Type_eq = this.type;
        this.env.showLoading('Vui lòng chờ load dữ liệu...', this.approvalTemplateService.read(this.query))
            .then((response: any) => {
                if (response.data && response.data.length && response.data[0].IDSchema) {
                    this.IDSchema = response.data[0].IDSchema
                    this.schemaService.getAnItem(this.IDSchema).then(value => {
                        this.schema = value;
                    })

                }

            }).catch(err => { });
        this.query.SubType_eq = undefined;
        this.query.Type_eq = undefined;
    }
    saveConfig(e){
        this.config = e;
    }
    changeSubType(e) {
        return this.changeType(e.Code);
    }
    filterConfig(){
        let obj={
            "type":this.type,
            "subType" : this.subType ,
            "config" : JSON.stringify(this.config)
        }
        let apiPath = { method: "POST", url: function () { return ApiSetting.apiDomain("APPROVAL/Request/FilterRequest") } };
        this.env.showLoading('Vui lòng chờ load dữ liệu...',  this.pageProvider.commonService.connect(apiPath.method, apiPath.url(),  obj).toPromise())
       
        .then((data: any) => {
            this.items = data;
            this.loadedData();
        })
    }
}

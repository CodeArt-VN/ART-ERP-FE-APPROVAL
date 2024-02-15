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
import { getDateMeta } from '@fullcalendar/core/internal';

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
    approvalTemplateList = [];
    requestFiltered = [];
    requestFilteredByStatus = [];

    _filterTemplateID = 0;
    _isFilterFollow = false;
    _isFilterMyRequest = false;
    listSupperApprover = [];
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
        this.pageConfig.isShowFeature = true;
        this.pageConfig.mainPageActive = true;
        this.pageConfig.canSubmitOrdersForApproval = true;
    }

    preLoadData(event?: any): void {
        this.query.SortBy = 'Id_desc';
        this.query.IDStaff = this.env.user.StaffID;

        Promise.all([
            this.env.getType('RequestType'),
            this.env.getStatus('ApprovalStatus'),
            this.env.getType('TimeOffType'),
            this.approvalTemplateService.read(this.query, this.pageConfig.forceLoadData)
        ]).then((values: any) => {
            this.requestTypeList = values[0];
            this.statusList = values[1];
            this.timeOffTypeList = values[2];
            this.approvalTemplateList = values[3].data;
            super.preLoadData(event);
        });
    }

    loadedData(event?: any, ignoredFromGroup?: boolean): void {
        this.approvalTemplateList.forEach(s => {
            if(s.IsSupperApprover){
                this.listSupperApprover.push(s.Id);
            }
        });
        let submitStatus = ['Draft', 'Unapproved'];
        this.items.forEach(i => {
            i._Type = this.requestTypeList.find(d => d.Code == i.Type);
            i._Status = this.statusList.find(d => d.Code == i.Status);
            i.StartText = lib.dateFormat(i.Start, 'dd/mm/yy hh:MM');
            i.canSubmitOrdersForApproval = false;
            if(i.IDStaff ==  this.env.user.StaffID && submitStatus.findIndex(d => d == i.Status) > -1){
                i.canSubmitOrdersForApproval = true
            }
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
                approvalTemplateList: this.approvalTemplateList,
                item: i,
                id: i.Id
            },
            cssClass: 'my-custom-class'
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();

        if (data) {
            this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/PostRequest"), data).toPromise()
            .then((resp: any) => {
                this.submitAttempt = false;
                super.loadData(null);
                this.env.publishEvent({ Code: this.pageConfig.pageName });
            }).catch(err => {
                if (err.message != null) {
                    this.env.showMessage(err.message, 'danger');
                }
                else {
                    this.env.showTranslateMessage('Cannot extract data','danger');
                }
                this.submitAttempt = false;
                this.refresh();
            })
           
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
    saveConfig(e) {
        this.config = e;
    }
    changeSubType(e) {
        return this.changeType(e.Code);
    }
    filterConfig() {
        let obj = {
            "type": this.type,
            "subType": this.subType,
            "config": JSON.stringify(this.config)
        }
        let apiPath = { method: "POST", url: function () { return ApiSetting.apiDomain("APPROVAL/Request/FilterRequest") } };
        this.env.showLoading('Vui lòng chờ load dữ liệu...', this.pageProvider.commonService.connect(apiPath.method, apiPath.url(), obj).toPromise())

            .then((data: any) => {
                this.items = data;
                this.loadedData();
            })
    }

    filterBySubTab(key) {
        this.query.Follow = undefined;
        this.query.MyRequest = undefined;
        this.query.IDApprovalTemplate = undefined;
        this.query[key] = true;
        this.refresh();
    }
    changeTemplateFilter(id){
        this.pageConfig.mainPageActive = false;

        this.query.Follow = undefined;
        this.query.MyRequest = undefined;
        this.query.IDApprovalTemplate = undefined;
        if(id != 0){
            this.query.IDApprovalTemplate = id; 
        }
        this.refresh();
    }

    backSubPage() {
        this.pageConfig.mainPageActive =  true;
    }

 
    segmentView = 'All'
    listFilter = ['Approved','Denied','Draft','NeedApprove','WaitForApprove','Expired',"Unapproved"];
    segmentChanged(e) {
        this.listFilter.forEach(d=>{
                this.query.Status = undefined;
                this.query[d] = undefined;
        })
        switch(e.detail.value){
            case "All":
                break;
            case  "Approved":
            case "Denied":
            case "Draft":
            case "Pending":
            case "Unapproved":
                this.query.Status = e.detail.value
                break;
            default: //NeedApprove, WaitForApprove, Expired
                this.query[e.detail.value] = true;
        }
        this.refresh();
    }
    cancelRequest(){
        if (!this.pageConfig.canCancel) return;
        if (this.submitAttempt) return;

        let itemsCanNotProcess = this.selectedItems.filter(i => (i.Status == 'Draft' || i.Status == 'Approved'));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('Your selected invoices cannot be canceled. Please select draft or pending for approval invoice','warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            //this.selectedItems = this.selectedItems.filter(i => (i.Status == 'Pending' || i.Status == 'Unapproved'));
            this.env.showPrompt('Bạn chắc muốn HỦY ' + this.selectedItems.length + ' yêu cầu đang chọn?', null, 'Duyệt ' + this.selectedItems.length + ' yêu cầu')
                .then(_ => {
                    this.submitAttempt = true;
                    let postDTO = { Ids: [] };
                    postDTO.Ids = this.selectedItems.map(e => e.Id);

                    this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/CancelRequest/"), postDTO).toPromise()
                        .then((savedItem: any) => {
                            this.env.publishEvent({ Code: this.pageConfig.pageName });
                            this.env.showTranslateMessage('Saving completed!','success');
                            this.submitAttempt = false;

                        }).catch(err => {
                            this.submitAttempt = false;
                            console.log(err);
                        });
                });
        }
    }
    submit(){
        if (this.submitAttempt) return;

        let itemsCanNotProcess = this.selectedItems.filter(i => !(i.Status == 'Draft' || i.Status == 'Unapproved'));
        if (itemsCanNotProcess.length == this.selectedItems.length) {
            this.env.showTranslateMessage('Your selected invoices cannot be approved. Please select new or draft or disapproved ones','warning');
        }
        else {
            itemsCanNotProcess.forEach(i => {
                i.checked = false;
            });
            this.selectedItems = this.selectedItems.filter(i => (i.Status == 'Draft' || i.Status == 'Unapproved'));

            this.env.showPrompt('Bạn chắc muốn gửi duyệt ' + this.selectedItems.length + ' đơn hàng đang chọn?', null, 'Gửi duyệt ' + this.selectedItems.length + ' mua hàng')
                .then(_ => {
                    this.submitAttempt = true;
                    let postDTO = { Ids: [] };
                    postDTO.Ids = this.selectedItems.map(e => e.Id);

                    this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/SubmitRequest/"), postDTO).toPromise()
                        .then((savedItem: any) => {
                            this.env.publishEvent({ Code: this.pageConfig.pageName });
                            this.submitAttempt = false;

                            if (savedItem > 0) {
                                this.env.showTranslateMessage('{{value}} orders sent for approval','success', savedItem);
                            }
                            else {
                                this.env.showTranslateMessage('Please check again, orders must have at least 1 item to be approved','warning');
                            }

                        }).catch(err => {
                            this.submitAttempt = false;
                            console.log(err);
                        });
                });
        }
    }
}

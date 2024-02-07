import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_CommentProvider, APPROVAL_RequestProvider, APPROVAL_TemplateProvider, BRA_BranchProvider, } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-request-detail',
    templateUrl: './request-detail.page.html',
    styleUrls: ['./request-detail.page.scss'],
})
export class RequestDetailPage extends PageBase {
    requestTypeList = [];
    statusList = [];
    timeOffTypeList = [];
    commentList = [];
    imgPath = '';
    mappingList = [];
    approvalTemplate: any;
    isSupperApprover;
    currentApprover;
    isCanDisapprove;
    commentForm: FormGroup;
    constructor(
        public pageProvider: APPROVAL_RequestProvider,
        public branchProvider: BRA_BranchProvider,
        public commentProvider: APPROVAL_CommentProvider,
        public approvalTemplateService: APPROVAL_TemplateProvider,
        public modalController: ModalController,
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
        this.imgPath = environment.staffAvatarsServer;
        this.commentForm = formBuilder.group({
            IDStaff: [this.env.user.StaffID],
            IDRequest: [this.id],
            Id: [0],
            Remark: ['', Validators.required],
        });
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

        this.loadComment();
    }


    loadedData(event?: any): void {
        this.mappingList = [];
        this.item._Type = this.requestTypeList.find(d => d.Code == this.item.Type);
        this.item._SubType = this.timeOffTypeList.find(d => d.Code == this.item.SubType);
        this.item._Status = this.statusList.find(d => d.Code == this.item.Status);

        this.item.StartText = lib.dateFormat(this.item.Start, 'dd/mm');
        this.item.Start = lib.dateFormat(this.item.Start);
        this.item.EndText = lib.dateFormat(this.item.End, 'dd/mm');
        this.item.End = lib.dateFormat(this.item.End);
        let canDisapproveStatus = ['Approved', 'Denied','InProgress','Pending'];
        let canApproveStatus = ['Denied','InProgress','Pending'];

        this.item._Approvers.forEach(i => {
            i._Status = this.statusList.find(d => d.Code == i.Status);
            if (i.Id == this.env.user.StaffID) {
                this.currentApprover = i;
            }
        });

        this.isCanDisapprove = canDisapproveStatus.includes(this.item.Status) && this.item.IDStaff != this.env.user.StaffID 
        && this.item._Approvers.some(d=> d.Id == this.env.user.StaffID);

        this.item._Logs.forEach(i => {
            i._Status = this.statusList.find(d => d.Code == i.Status);
            i.Date = lib.dateFormat(i.CreatedDate, 'dd/mm/yy');
            i.Time = lib.dateFormat(i.CreatedDate, 'hh:MM');

        });
        if (this.item.IDApprovalTemplate > 0) {
            this.approvalTemplateService.getAnItem(this.item.IDApprovalTemplate).then(value => {
                if (value) {
                    this.approvalTemplate = value;
                    if(this.approvalTemplate.IsSupperApprover){
                        if(canDisapproveStatus.includes(this.item.Status)){
                            this.isCanDisapprove = true;
                        }
                       if(canApproveStatus.includes(this.item.Status)){
                        this.pageConfig.CanApprove =true;
                       }
                    } 
                    else{
                        this.checkCanApprove();
                    }
                    var udfList = Object.keys(this.approvalTemplate).filter(d => d.includes("IsUseUDF"));
                    udfList.forEach(d => {
                        if (this.approvalTemplate[d]) {
                            let label = this.approvalTemplate[d.replace('IsUseUDF', 'UDFLabel')];
                            let value = this.item[d.replace('IsUseUDF', 'UDF')]
                            this.mappingList.push({
                                Label: label,
                                Value: value
                            });
                        }
                    })
                }
            })

        }
       

        super.loadedData(event);


    }

    checkCanApprove() {
        let ignoredStatus = ['Draft', 'Approved', 'Denied'];
        let lockStatus = ['Forward']  //'Approved', 'Denied', 
        this.pageConfig.canApprove = false;
        if (this.approvalTemplate?.IsSupperApprover) {
            this.pageConfig.canApprove = true;
            return;
        }
        if (ignoredStatus.findIndex(d => d == this.item.Status) == -1) {
            this.pageConfig.canApprove = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID) > -1;
        }
        if (this.item.ApprovalMode?.trim() == 'SequentialApprovals' && this.pageConfig.canApprove) {

            let ApproverIdx = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID);

            if (ApproverIdx != 0) {
                for (let index = 0; index < ApproverIdx; index++) {
                    const Approver = this.item._Approvers[index];
                    if (Approver.Status == 'Approved') {
                        this.pageConfig.canApprove = this.item._Logs.findIndex(d => d.Id == Approver.Id) > -1;
                    }
                    else {
                        this.pageConfig.canApprove = false;
                        return;
                    }
                }
            }
            else {
                if (lockStatus.findIndex(d => d == this.item._Approvers[ApproverIdx].Status) != -1) {
                    this.pageConfig.canApprove = false;
                }
                else {
                    this.pageConfig.canApprove = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID) > -1;
                }
            }
        }
    }

    async disapprove() {
        if (!this.isCanDisapprove) {
            return;
        }
        let approval = {
            IDRequest: this.item.Id,
            IDApprover: this.env.user.StaffID,
            Status: 'Return',
            ForwardTo: null,
            Remark: ''
        };
        const modal = await this.modalController.create({
            component: ApproveModalPage,
            componentProps: {
                item: approval,
            },
            cssClass: 'my-custom-class'
        });
        await modal.present();
        const { data } = await modal.onWillDismiss();
        if (data) {
            this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/DisapproveRequest/"), data).toPromise()
                .then((result: any) => {
                    this.env.publishEvent({ Code: this.pageConfig.pageName });
                    this.submitAttempt = false;

                    if (result) {
                        this.env.showTranslateMessage('Return success', 'success');
                        this.refresh();
                    }
                    else {
                        this.env.showTranslateMessage('Return failure', 'warning');
                    }

                }).catch(err => {
                    this.submitAttempt = false;
                    console.log(err);
                });
        }
    }

    loadComment() {
        this.commentProvider.read({ IDRequest: this.id }).then(resp => {
            this.commentList = resp['data'];
            this.commentList.forEach(i => {
                i.Date = lib.dateFormatFriendly(i.CreatedDate);
            });
        })
    }


    async submitApproval(status) {
        console.log(status);
        let approval = {
            IDRequest: this.item.Id,
            IDApprover: this.env.user.StaffID,
            Status: status,
            ForwardTo: null,
            Remark: ''
        };
        if (status == 'Approved') {
            this.submitAttempt = true;
            this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/Approve"), approval).toPromise()
                .then((resp: any) => {
                    this.submitAttempt = false;
                    super.loadData(null);
                    this.env.publishEvent({ Code: this.pageConfig.pageName });
                }).catch(err => {
                    if (err.message != null) {
                        this.env.showMessage(err.message, 'danger');
                    }
                    else {
                        this.env.showTranslateMessage('erp.app.pages.approval.request.message.can-not-get-data', 'danger');
                    }
                    this.submitAttempt = false;
                    this.refresh();
                })

        }
        else {
            const modal = await this.modalController.create({
                component: ApproveModalPage,
                componentProps: {
                    item: approval,
                },
                cssClass: 'my-custom-class'
            });
            await modal.present();
            const { data } = await modal.onWillDismiss();
            if (data) {
                this.submitAttempt = true;
                this.pageProvider.commonService.connect('POST', ApiSetting.apiDomain("APPROVAL/Request/Approve"), data).toPromise()
                    .then((resp: any) => {
                        this.submitAttempt = false;
                        super.loadData(null);
                        this.env.publishEvent({ Code: this.pageConfig.pageName });
                    }).catch(err => {
                        if (err.message != null) {
                            this.env.showMessage(err.message, 'danger');
                        }
                        else {
                            this.env.showTranslateMessage('erp.app.pages.approval.request.message.can-not-get-data', 'danger');
                        }
                        this.submitAttempt = false;
                        this.refresh();
                    })
            }
        }


    }

    addComment() {
        let comment = this.commentForm.getRawValue();
        comment.IDRequest = this.id;
        this.commentProvider.save(comment).then(_ => {
            this.commentForm.controls.Remark.setValue('');
            this.loadComment();
        })
    }
}

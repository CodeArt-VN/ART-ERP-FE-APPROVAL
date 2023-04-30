import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { APPROVAL_CommentProvider, APPROVAL_RequestProvider, BRA_BranchProvider, } from 'src/app/services/static/services.service';
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
    commentForm: FormGroup;
    constructor(
        public pageProvider: APPROVAL_RequestProvider,
        public branchProvider: BRA_BranchProvider,
        public commentProvider: APPROVAL_CommentProvider,

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

        this.item._Type = this.requestTypeList.find(d => d.Code == this.item.Type);
        this.item._SubType = this.timeOffTypeList.find(d => d.Code == this.item.SubType);
        this.item._Status = this.statusList.find(d => d.Code == this.item.Status);

        if (this.item.Type == 'Payment') {
            this.item.AmountText = lib.currencyFormat(this.item.Amount);
        }
        else if (this.item.Type == 'TimeOff' || this.item.Type == 'OverTime') {
            let d1 = new Date(this.item.Start);
            let d2 = new Date(this.item.End);
            let diff = Math.abs(d1.valueOf() - d2.valueOf());
            this.item.AmountText = ((diff / 86400000) + 1) + ' ngày';
        }

        this.item.StartText = lib.dateFormat(this.item.Start, 'dd/mm');
        this.item.Start = lib.dateFormat(this.item.Start);
        this.item.EndText = lib.dateFormat(this.item.End, 'dd/mm');
        this.item.End = lib.dateFormat(this.item.End);

        

        this.item._Approvers.forEach(i => {
            i._Status = this.statusList.find(d => d.Code == i.Status);
        });

        this.item._Logs.forEach(i => {
            i._Status = this.statusList.find(d => d.Code == i.Status);
            i.Date = lib.dateFormat(i.CreatedDate, 'dd/mm/yy');
            i.Time = lib.dateFormat(i.CreatedDate, 'hh:MM');

        });

        this.checkCanApprove();
        super.loadedData(event);
    }

    checkCanApprove(){
        let ignoredStatus = ['Draft', 'Approved', 'Denied'];
        let lockStatus = ['Approved', 'Denied', 'Forward']
        this.pageConfig.canApprove = false;
        if (ignoredStatus.findIndex(d => d == this.item.Status) == -1) {
            this.pageConfig.canApprove = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID) > -1;
        }
        if (this.item.ApprovalMode == 'SequentialApprovals' && this.pageConfig.canApprove) {

            let ApproverIdx = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID);

            if (ApproverIdx != 0) {
                for (let index = 0; index < ApproverIdx; index++) {
                    const Approver = this.item._Approvers[index];
                    if (Approver.Status == 'Approved' || Approver.Status == 'Forward') {
                        this.pageConfig.canApprove = this.item._Logs.findIndex(d => d.Id == Approver.Id) > -1;
                    }
                    else {
                        this.pageConfig.canApprove = false;
                        return;
                    }
                }
            }
            else {
                if (lockStatus.findIndex(d => d == this.item._Approvers[ApproverIdx].Status) != -1 ) {
                    this.pageConfig.canApprove = false;
                }
                else {
                    this.pageConfig.canApprove = this.item._Approvers.findIndex(d => d.Id == this.env.user.StaffID) > -1;
                }
            }
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
                        this.env.showTranslateMessage('erp.app.pages.approval.request.message.can-not-get-data','danger');
                    }
                    this.submitAttempt = false;
                    this.refresh();
                })
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

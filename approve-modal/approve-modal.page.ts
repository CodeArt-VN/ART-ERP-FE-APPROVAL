import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, LoadingController, AlertController, ModalController, NavParams } from '@ionic/angular';
import { PageBase } from 'src/app/page-base';
import { ActivatedRoute } from '@angular/router';
import { EnvService } from 'src/app/services/core/env.service';
import { HRM_StaffProvider, WMS_ZoneProvider } from 'src/app/services/static/services.service';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/services/core/common.service';
import { lib } from 'src/app/services/static/global-functions';
import { concat, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ApiSetting } from 'src/app/services/static/api-setting';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-approve-modal',
  templateUrl: './approve-modal.page.html',
  styleUrls: ['./approve-modal.page.scss'],
})
export class ApproveModalPage extends PageBase {
  timesheetList = [];
  imgPath = '';
  constructor(
    public pageProvider: WMS_ZoneProvider,
    public staffProvider: HRM_StaffProvider,

    public modalController: ModalController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    public loadingController: LoadingController,
    public env: EnvService,
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public cdr: ChangeDetectorRef,
  ) {
    super();
    this.pageConfig.isDetailPage = true;
    this.imgPath = environment.staffAvatarsServer;
    this.formGroup = formBuilder.group({
      Id: [0],
      IDRequest: ['', Validators.required],
      IDApprover: ['', Validators.required],
      ForwardTo: [''],
      Remark: ['', Validators.required],
      Status: ['', Validators.required],
    });
  }

  preLoadData(event?: any): void {
    this.item = this.navParams.data.item;
    this.id = this.navParams.data.id;
    super.loadedData(event);
    this.staffSearch();
  }

  staffList$;
  staffListLoading = false;
  staffListInput$ = new Subject<string>();
  staffListSelected = [];
  staffSelected = null;
  staffSearch() {
    this.staffListLoading = false;
    this.staffList$ = concat(
      of(this.staffListSelected),
      this.staffListInput$.pipe(
        distinctUntilChanged(),
        tap(() => (this.staffListLoading = true)),
        switchMap((term) =>
          this.staffProvider
            .search({
              Take: 20,
              Skip: 0,
              IDDepartment: this.env.selectedBranchAndChildren,
              Term: term,
            })
            .pipe(
              catchError(() => of([])), // empty list on error
              tap(() => (this.staffListLoading = false)),
            ),
        ),
      ),
    );
  }

  submit() {
    this.formGroup.updateValueAndValidity();
    if (!this.formGroup.valid) {
      this.env.showMessage('Please recheck information highlighted in red above', 'warning');
    } else {
      let submitItem = this.formGroup.value; //this.getDirtyValues(this.formGroup);
      this.modalController.dismiss(submitItem);
    }
  }
}

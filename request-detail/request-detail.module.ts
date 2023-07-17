import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ShareModule } from 'src/app/share.module';
import { RequestDetailPage } from './request-detail.page';
import { FileUploadModule } from 'ng2-file-upload';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';

const routes: Routes = [
  {
    path: '',
    component: RequestDetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    FileUploadModule,
    ShareModule,
    RouterModule.forChild(routes)
  ],
  declarations: [RequestDetailPage, ApproveModalPage]
})
export class RequestDetailPageModule { }

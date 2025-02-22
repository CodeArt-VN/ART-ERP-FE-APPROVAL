import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ShareModule } from 'src/app/share.module';
import { RequestPage } from './request.page';
import { RequestModalPage } from '../request-modal/request-modal.page';

@NgModule({
	imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule, ShareModule, RouterModule.forChild([{ path: '', component: RequestPage }])],
	declarations: [RequestPage, RequestModalPage],
})
export class RequestPageModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ShareModule } from 'src/app/share.module';
import { RequestDetailPage } from './request-detail.page';
import { ApproveModalPage } from '../approve-modal/approve-modal.page';
import { PurchaseItemsComponentPageModule } from '../../PURCHASE/purchase-request-detail/purchase-items/purchase-items.component.module';
import { PurchaseQuotationItemsComponentPageModule } from '../../PURCHASE/purchase-quotation-detail/purchase-quotation-items/purchase-quotation-items.component.module';

const routes: Routes = [
	{
		path: '',
		component: RequestDetailPage,
	},
];

@NgModule({
	imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule, ShareModule, PurchaseItemsComponentPageModule, PurchaseQuotationItemsComponentPageModule, RouterModule.forChild(routes)],
	declarations: [RequestDetailPage, ApproveModalPage],
})
export class RequestDetailPageModule {}
